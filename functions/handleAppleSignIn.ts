import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as jose from 'npm:jose@5.2.3';

const APPLE_CLIENT_ID = Deno.env.get('APPLE_CLIENT_ID') || '';
const APPLE_TEAM_ID = Deno.env.get('APPLE_TEAM_ID') || '';
const APPLE_KEY_ID = Deno.env.get('APPLE_KEY_ID') || '';
const APPLE_PRIVATE_KEY = Deno.env.get('APPLE_PRIVATE_KEY') || '';
const APPLE_REDIRECT_URI = Deno.env.get('APPLE_REDIRECT_URI') || 'https://sportswagerhelper.com/apple-auth-callback';
const APP_CORS_ORIGIN = Deno.env.get('APP_CORS_ORIGIN') || 'https://sportswagerhelper.com';
const ALLOW_KEY_TEST = Deno.env.get('ALLOW_KEY_TEST') === 'true';
const APP_DEBUG = Deno.env.get('APP_DEBUG') === 'true';

let cachedClientSecret = null;
const appleJWKS = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

function corsHeaders(allowCredentials = false, originHeader) {
  const origin = originHeader && originHeader === APP_CORS_ORIGIN ? originHeader : APP_CORS_ORIGIN;
  const headers = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin'
  };
  if (allowCredentials) headers['Access-Control-Allow-Credentials'] = 'true';
  return headers;
}

function promiseTimeout(promise, ms = 8000, name = 'operation') {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise.finally(() => clearTimeout(timeoutId)), timeout]);
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function ensureClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedClientSecret && cachedClientSecret.expAt > now + 60) return cachedClientSecret.token;

  if (!APPLE_PRIVATE_KEY || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_CLIENT_ID) {
    throw new Error('Missing APPLE_* env vars to generate client secret');
  }

  let privateKey = APPLE_PRIVATE_KEY;
  if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
  if (!privateKey.includes('BEGIN')) {
    const raw = privateKey.replace(/\s/g, '');
    const chunked = raw.match(/.{1,64}/g)?.join('\n') || raw;
    privateKey = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
  }

  if (!/-----BEGIN PRIVATE KEY-----/.test(privateKey)) {
    throw new Error('APPLE_PRIVATE_KEY does not appear to be a valid PKCS8 PEM');
  }

  try {
    const alg = 'ES256';
    const ecPrivateKey = await jose.importPKCS8(privateKey, alg);
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 24 * 180;
    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({ alg, kid: APPLE_KEY_ID })
      .setIssuedAt(iat)
      .setIssuer(APPLE_TEAM_ID)
      .setAudience('https://appleid.apple.com')
      .setSubject(APPLE_CLIENT_ID)
      .setExpirationTime(exp)
      .sign(ecPrivateKey);

    cachedClientSecret = { token: jwt, expAt: exp };
    return jwt;
  } catch (err) {
    throw new Error(`Failed to generate client_secret: ${err?.message || String(err)}`);
  }
}

async function verifyIdToken(idToken) {
  if (!APPLE_CLIENT_ID) throw new Error('APPLE_CLIENT_ID not configured');
  try {
    const verifyPromise = jose.jwtVerify(idToken, appleJWKS, {
      issuer: 'https://appleid.apple.com',
      audience: APPLE_CLIENT_ID
    });
    const { payload } = await promiseTimeout(verifyPromise, 8000, 'jwtVerify');
    return payload;
  } catch (err) {
    throw new Error(`id_token verification failed: ${err?.message || String(err)}`);
  }
}

Deno.serve(async (req) => {
  const startTs = new Date().toISOString();
  const origin = req.headers.get('origin') || undefined;
  const headers = corsHeaders(true, origin);
  console.info(`[handleAppleSignIn] ${startTs} - ${req.method} ${req.url} origin=${origin}`);

  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const contentType = (req.headers.get('content-type') || '').toLowerCase();
    console.info(`[handleAppleSignIn] Content-Type: ${contentType}`);
    let action;
    let identityToken;
    let authorizationCode;
    let manualKey;
    let incomingUser = null;
    let nonce;
    let isFormPost = false;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const raw = await req.text();
      const params = new URLSearchParams(raw);
      authorizationCode = params.get('code') || undefined;
      const userParam = params.get('user');
      try { incomingUser = userParam ? JSON.parse(userParam) : null; } catch(e) { incomingUser = null; }
      action = 'exchangeCode';
      isFormPost = true;
      console.info('[handleAppleSignIn] Form POST from Apple detected');
    } else if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      action = body.action;
      identityToken = body.identityToken;
      authorizationCode = body.authorizationCode;
      manualKey = body.manualKey;
      incomingUser = body.user;
      nonce = body.nonce;
    } else {
      const t = await req.text().catch(() => '');
      try { const body = t ? JSON.parse(t) : {}; action = body.action; identityToken = body.identityToken; authorizationCode = body.authorizationCode; manualKey = body.manualKey; incomingUser = body.user; nonce = body.nonce; } catch(e){ /* ignore */ }
    }

    if (action === 'ping') {
      return new Response(JSON.stringify({ success: true, message: 'pong', timestamp: new Date().toISOString() }), { status: 200, headers });
    }

    if (action === 'getClientId') {
      return new Response(JSON.stringify({ clientId: APPLE_CLIENT_ID, redirectUri: APPLE_REDIRECT_URI }), { status: 200, headers });
    }

    if (action === 'verify') {
      if (!identityToken) return new Response(JSON.stringify({ success: false, error: 'Missing identityToken' }), { status: 400, headers });
      const payload = await verifyIdToken(identityToken);
      return new Response(JSON.stringify({ success: true, appleUser: { id: payload.sub, email: payload.email, emailVerified: payload.email_verified, isPrivateEmail: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false }, userInfo: incomingUser || null }), { status: 200, headers });
    }

    if (action === 'testManualKey') {
      if (!ALLOW_KEY_TEST) return new Response(JSON.stringify({ success: false, error: 'Key testing disabled' }), { status: 403, headers });
      if (!manualKey) {
        try {
          await ensureClientSecret();
          return new Response(JSON.stringify({ success: true, message: 'Client secret generated successfully with env key' }), { status: 200, headers });
        } catch (err) {
          const debug = APP_DEBUG ? { message: String(err?.message || err) } : undefined;
          return new Response(JSON.stringify({ success: false, error: 'client_secret_error', debug }), { status: 400, headers });
        }
      }

      let clean = manualKey || '';
      if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
      if (!clean.includes('BEGIN')) {
        const raw = clean.replace(/\s/g, '');
        const chunked = raw.match(/.{1,64}/g)?.join('\n') || raw;
        clean = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
      }

      try {
        await jose.importPKCS8(clean, 'ES256');
        return new Response(JSON.stringify({ success: true, message: 'Valid EC P-256 (ES256) key' }), { status: 200, headers });
      } catch (esErr) {
        try {
          await jose.importPKCS8(clean, 'RS256');
          return new Response(JSON.stringify({ success: false, error: 'Wrong key type: RSA detected. Apple needs EC P-256 (ES256).' }), { status: 400, headers });
        } catch {
          return new Response(JSON.stringify({ success: false, error: `Key parsing error: ${esErr?.message || esErr}` }), { status: 400, headers });
        }
      }
    }

    if (action === 'exchangeCode') {
      if (!authorizationCode) return new Response(JSON.stringify({ success: false, error: 'Missing authorizationCode' }), { status: 400, headers });

      const missing = [];
      if (!APPLE_PRIVATE_KEY) missing.push('APPLE_PRIVATE_KEY');
      if (!APPLE_TEAM_ID) missing.push('APPLE_TEAM_ID');
      if (!APPLE_KEY_ID) missing.push('APPLE_KEY_ID');
      if (!APPLE_CLIENT_ID) missing.push('APPLE_CLIENT_ID');
      if (missing.length) return new Response(JSON.stringify({ success: false, error: `Missing required secrets: ${missing.join(', ')}` }), { status: 500, headers });

      let clientSecret;
      try { clientSecret = await ensureClientSecret(); } catch (err) { const debug = APP_DEBUG ? { message: String(err?.message || err) } : undefined; return new Response(JSON.stringify({ success: false, error: 'Failed to generate client secret', debug }), { status: 500, headers }); }

      let tokenResponse;
      try {
        tokenResponse = await fetchWithTimeout('https://appleid.apple.com/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ client_id: APPLE_CLIENT_ID, client_secret: clientSecret, code: authorizationCode, grant_type: 'authorization_code', redirect_uri: APPLE_REDIRECT_URI }).toString()
        }, 10000);
      } catch (fetchErr) {
        const debug = APP_DEBUG ? { message: String(fetchErr?.message || fetchErr) } : undefined;
        return new Response(JSON.stringify({ success: false, error: 'Failed to contact Apple', debug }), { status: 502, headers });
      }

      const text = await tokenResponse.text().catch(() => '');
      let tokenData;
      try { tokenData = text ? JSON.parse(text) : {}; } catch (parseErr) { const debug = APP_DEBUG ? { raw: text } : undefined; return new Response(JSON.stringify({ success: false, error: 'Invalid response from Apple token endpoint', debug }), { status: 502, headers }); }

      if (!tokenResponse.ok) {
        const debug = APP_DEBUG ? { tokenData } : undefined;
        const errMsg = tokenData?.error_description || tokenData?.error || `HTTP ${tokenResponse.status}`;
        return new Response(JSON.stringify({ success: false, error: errMsg, debug }), { status: 400, headers });
      }

      if (!tokenData.id_token) return new Response(JSON.stringify({ success: false, error: 'No id_token in token response' }), { status: 400, headers });

      let payload;
      try { payload = await verifyIdToken(tokenData.id_token); } catch (verifyErr) { const debug = APP_DEBUG ? { message: String(verifyErr?.message || verifyErr) } : undefined; return new Response(JSON.stringify({ success: false, error: 'Failed to verify id_token', debug }), { status: 400, headers }); }

      if (nonce && payload.nonce && nonce !== payload.nonce) return new Response(JSON.stringify({ success: false, error: 'Invalid nonce' }), { status: 400, headers });

      try {
        const base44 = createClientFromRequest(req);
        const appleFormUserData = incomingUser;

        const existingUsers = await base44.asServiceRole.entities.User.filter({ apple_provider_id: payload.sub });
        let dbUser = existingUsers.length > 0 ? existingUsers[0] : null;

        if (!dbUser) {
          if (payload.email && !payload.hasOwnProperty('is_private_email')) {
            const existing = await base44.asServiceRole.entities.User.filter({ email: payload.email });
            if (existing.length > 0) {
              return new Response(JSON.stringify({ success: false, reason: 'link_required', message: 'An account with this email exists. Please sign in and link Apple from Account Settings.' }), { status: 200, headers });
            }
          }

          dbUser = await base44.asServiceRole.entities.User.create({
            email: payload.email || null,
            full_name: appleFormUserData?.name ? `${appleFormUserData.name.firstName || ''} ${appleFormUserData.name.lastName || ''}`.trim() : null,
            apple_provider_id: payload.sub,
            apple_provider_email: payload.email || '',
            apple_is_private_email: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false,
            apple_linked_at: new Date().toISOString(),
            apple_last_sign_in: new Date().toISOString(),
            role: 'user'
          });
        } else {
          try { await base44.asServiceRole.entities.User.update(dbUser.id, { apple_last_sign_in: new Date().toISOString() }); } catch {}
        }

        const sessionToken = await base44.asServiceRole.auth.issueSessionToken(dbUser.email || dbUser.id);

        if (isFormPost) {
          const redirectUrl = `${APP_CORS_ORIGIN}/apple-auth-callback?token=${encodeURIComponent(sessionToken)}&success=true`;
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><p>Signing you in...</p><script>window.location.href = ${JSON.stringify(redirectUrl)}</script></body></html>`;
          return new Response(html, { status: 200, headers: { ...headers, 'Content-Type': 'text/html' } });
        }

        return new Response(JSON.stringify({ success: true, sessionToken, appleUser: { id: payload.sub, email: payload.email, emailVerified: payload.email_verified, isPrivateEmail: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false } }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });

      } catch (userErr) {
        const debug = APP_DEBUG ? { message: String(userErr?.message || userErr), stack: String(userErr?.stack || '') } : undefined;
        console.error('User/session processing error:', userErr);
        return new Response(JSON.stringify({ success: false, error: 'server_error', debug }), { status: 500, headers });
      }
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), { status: 400, headers });
  } catch (error) {
    console.error('Apple Sign In error (debug):', error);
    const debug = APP_DEBUG ? { message: String(error?.message || error), stack: String(error?.stack || '') } : undefined;
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({ error_type: 'auth', severity: 'error', function_name: 'handleAppleSignIn', error_message: String(error?.message || error).slice(0,1000), error_stack: String(error?.stack || '').slice(0,2000) });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }
    const origin = req.headers.get('origin') || undefined;
    const headers = corsHeaders(true, origin);
    return new Response(JSON.stringify({ success: false, error: 'server_error', debug }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});