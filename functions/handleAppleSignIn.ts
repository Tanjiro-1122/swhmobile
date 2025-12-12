import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as jose from 'npm:jose@5.2.3';

const APPLE_CLIENT_ID = Deno.env.get('APPLE_CLIENT_ID') || '';
const APPLE_TEAM_ID = Deno.env.get('APPLE_TEAM_ID') || '';
const APPLE_KEY_ID = Deno.env.get('APPLE_KEY_ID') || '';
const APPLE_PRIVATE_KEY = Deno.env.get('APPLE_PRIVATE_KEY') || '';
const APPLE_REDIRECT_URI = Deno.env.get('APPLE_REDIRECT_URI') || 'https://sportswagerhelper.com/apple-auth-callback';
const APP_CORS_ORIGIN = Deno.env.get('APP_CORS_ORIGIN') || 'https://sportswagerhelper.com';
const ALLOW_KEY_TEST = Deno.env.get('ALLOW_KEY_TEST') === 'true';
const SESSION_SECRET = Deno.env.get('SESSION_SECRET') || '';

let cachedClientSecret = null;

function corsHeaders(allowCredentials = false) {
  const headers = {
    'Access-Control-Allow-Origin': APP_CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (allowCredentials) headers['Access-Control-Allow-Credentials'] = 'true';
  return headers;
}

async function ensureClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedClientSecret && cachedClientSecret.expAt > now + 60) return cachedClientSecret.token;

  if (!APPLE_PRIVATE_KEY || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_CLIENT_ID) {
    throw new Error('Missing APPLE_* env vars to generate client secret');
  }

  let privateKey = APPLE_PRIVATE_KEY;
  if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    const raw = privateKey.replace(/\s/g, '');
    const chunked = raw.match(/.{1,64}/g)?.join('\n') || raw;
    privateKey = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
  }

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
}

const appleJWKS = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

async function verifyIdToken(idToken) {
  if (!APPLE_CLIENT_ID) throw new Error('APPLE_CLIENT_ID not configured');
  const { payload } = await jose.jwtVerify(idToken, appleJWKS, {
    issuer: 'https://appleid.apple.com',
    audience: APPLE_CLIENT_ID,
  });
  return payload;
}

Deno.serve(async (req) => {
  const startTs = new Date().toISOString();
  console.info(`[handleAppleSignIn] ${startTs} - ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(true) });
  }

  try {
    let action, identityToken, authorizationCode, manualKey, user, nonce;

    // Check content-type to determine how to parse the body
    const contentType = req.headers.get('content-type') || '';
    console.info(`[handleAppleSignIn] Content-Type: ${contentType}`);
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Apple form_post sends data as form-urlencoded
      const formData = await req.formData();
      authorizationCode = formData.get('code');
      const userParam = formData.get('user');
      if (userParam) {
        try { user = JSON.parse(userParam); } catch (e) { user = null; }
      }
      const stateParam = formData.get('state');
      // Automatically trigger exchange when we receive form post from Apple
      action = 'exchangeCode';
    } else {
      // JSON body (from our frontend)
      const body = await req.json().catch(() => ({}));
      action = body.action;
      identityToken = body.identityToken;
      authorizationCode = body.authorizationCode;
      manualKey = body.manualKey;
      user = body.user;
      nonce = body.nonce;
    }

    // Ping endpoint for testing
    if (action === 'ping') {
      console.info('[handleAppleSignIn] Ping received');
      return new Response(JSON.stringify({ success: true, message: 'pong', timestamp: new Date().toISOString() }), { headers: corsHeaders(true) });
    }

    if (action === 'getClientId') {
      console.info('[handleAppleSignIn] getClientId action');
      return new Response(JSON.stringify({ clientId: APPLE_CLIENT_ID, redirectUri: APPLE_REDIRECT_URI }), { headers: corsHeaders(true) });
    }

    if (action === 'verify') {
      if (!identityToken) return new Response(JSON.stringify({ success: false, error: 'Missing identityToken' }), { status: 400, headers: corsHeaders(true) });
      const payload = await verifyIdToken(identityToken);
      return new Response(JSON.stringify({
        success: true,
        appleUser: {
          id: payload.sub,
          email: payload.email,
          emailVerified: payload.email_verified,
          isPrivateEmail: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false
        },
        userInfo: user || null
      }), { headers: corsHeaders(true) });
    }

    if (action === 'testManualKey') {
      console.info('[handleAppleSignIn] testManualKey action');
      if (!ALLOW_KEY_TEST) return new Response(JSON.stringify({ success: false, error: 'Key testing disabled' }), { status: 403, headers: corsHeaders() });

      // Test with current env key if no manual key provided
      if (!manualKey) {
        console.info('[handleAppleSignIn] Testing with env APPLE_PRIVATE_KEY');
        try {
          await ensureClientSecret();
          return new Response(JSON.stringify({ success: true, message: 'Client secret generated successfully with env key' }), { headers: corsHeaders() });
        } catch (err) {
          console.error('[handleAppleSignIn] Env key test failed:', err);
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 400, headers: corsHeaders() });
        }
      }

      let clean = manualKey || '';
      if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
      if (!clean.includes('BEGIN PRIVATE KEY')) {
        const raw = clean.replace(/\s/g, '');
        const chunked = raw.match(/.{1,64}/g)?.join('\n') || raw;
        clean = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
      }
      try {
        await jose.importPKCS8(clean, 'ES256');
        return new Response(JSON.stringify({ success: true, message: 'Valid EC P-256 (ES256) key' }), { headers: corsHeaders() });
      } catch (esErr) {
        try {
          await jose.importPKCS8(clean, 'RS256');
          return new Response(JSON.stringify({ success: false, error: 'Wrong key type: RSA detected. Apple needs EC P-256 (ES256).' }), { headers: corsHeaders() });
        } catch {
          return new Response(JSON.stringify({ success: false, error: `Key parsing error: ${esErr.message}` }), { status: 400, headers: corsHeaders() });
        }
      }
    }

    if (action === 'exchangeCode') {
      console.info('[handleAppleSignIn] exchangeCode action');
      if (!authorizationCode) return new Response(JSON.stringify({ success: false, error: 'Missing authorizationCode' }), { status: 400, headers: corsHeaders(true) });

      if (!APPLE_PRIVATE_KEY || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_CLIENT_ID) {
        const missing = [];
        if (!APPLE_PRIVATE_KEY) missing.push('APPLE_PRIVATE_KEY');
        if (!APPLE_TEAM_ID) missing.push('APPLE_TEAM_ID');
        if (!APPLE_KEY_ID) missing.push('APPLE_KEY_ID');
        if (!APPLE_CLIENT_ID) missing.push('APPLE_CLIENT_ID');
        return new Response(JSON.stringify({ success: false, error: `Missing required secrets: ${missing.join(', ')}` }), { status: 500, headers: corsHeaders(true) });
      }

      let clientSecret;
      try { 
        console.info('[handleAppleSignIn] Generating client secret');
        clientSecret = await ensureClientSecret(); 
        console.info('[handleAppleSignIn] Client secret generated successfully');
      } catch (err) {
        console.error('[handleAppleSignIn] Error generating client secret:', err);
        return new Response(JSON.stringify({ success: false, error: 'Failed to generate client secret', details: err.message }), { status: 500, headers: corsHeaders(true) });
      }

      console.info('[handleAppleSignIn] Exchanging code with Apple');
      const tokenController = new AbortController();
      const tokenTimeout = setTimeout(() => tokenController.abort(), 10000); // 10s timeout

      let tokenResponse;
      try {
        tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: APPLE_CLIENT_ID,
          client_secret: clientSecret,
          code: authorizationCode,
          grant_type: 'authorization_code',
          redirect_uri: APPLE_REDIRECT_URI,
        }),
        signal: tokenController.signal
        });
        } catch (fetchErr) {
        clearTimeout(tokenTimeout);
        console.error('[handleAppleSignIn] Token exchange fetch failed:', fetchErr);
        return new Response(JSON.stringify({ success: false, error: 'Failed to contact Apple', details: fetchErr.message }), { status: 500, headers: corsHeaders(true) });
        }
        clearTimeout(tokenTimeout);

        const tokenData = await tokenResponse.json();
        console.info('[handleAppleSignIn] Apple token response status:', tokenResponse.status);
      if (tokenData.error) {
        console.error('Apple token error:', tokenData);
        return new Response(JSON.stringify({ success: false, error: tokenData.error_description || tokenData.error }), { status: 400, headers: corsHeaders(true) });
      }

      if (!tokenData.id_token) return new Response(JSON.stringify({ success: false, error: 'No id_token in token response' }), { status: 400, headers: corsHeaders(true) });

      let payload;
      console.info('[handleAppleSignIn] Verifying id_token');
      try {
        // Create a timeout promise that rejects after 10 seconds
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('JWKS verification timeout')), 10000)
        );
        
        // Race between verification and timeout
        const verification = await Promise.race([
          jose.jwtVerify(tokenData.id_token, appleJWKS, { 
            issuer: 'https://appleid.apple.com', 
            audience: APPLE_CLIENT_ID 
          }),
          timeoutPromise
        ]);
        
        payload = verification.payload;
        console.info('[handleAppleSignIn] id_token verified successfully');
      } catch (verifyErr) {
        console.error('id_token verification failed:', verifyErr);
        return new Response(JSON.stringify({ success: false, error: 'Failed to verify id_token', details: verifyErr.message }), { status: 400, headers: corsHeaders(true) });
      }

      if (nonce && payload.nonce && nonce !== payload.nonce) {
        console.error('Nonce mismatch');
        return new Response(JSON.stringify({ success: false, error: 'Invalid nonce' }), { status: 400, headers: corsHeaders(true) });
      }

      console.info('[handleAppleSignIn] Processing user session');
      try {
        const base44 = createClientFromRequest(req);

        // Find user by apple_provider_id (matches User entity schema)
        console.info('[handleAppleSignIn] Looking up user by apple_provider_id');
        const existingUsers = await base44.asServiceRole.entities.User.filter({
          apple_provider_id: payload.sub
        });

        let user = existingUsers.length > 0 ? existingUsers[0] : null;

        if (!user) {
          // Check for email conflict if non-private email
          if (payload.email && !payload.hasOwnProperty('is_private_email')) {
            const existing = await base44.asServiceRole.entities.User.filter({ email: payload.email });
            if (existing.length > 0) {
              return new Response(JSON.stringify({ success: false, reason: 'link_required', message: 'An account with this email exists. Please sign in and link Apple from Account Settings.' }), { headers: corsHeaders(true) });
            }
          }

          // Create new user
          user = await base44.asServiceRole.entities.User.create({
            email: payload.email || null,
            full_name: user?.name ? `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim() : null,
            apple_provider_id: payload.sub,
            apple_provider_email: payload.email || '',
            apple_is_private_email: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false,
            apple_linked_at: new Date().toISOString(),
            apple_last_sign_in: new Date().toISOString(),
            role: 'user'
          });
        } else {
          // Update existing user
          try { 
            await base44.asServiceRole.entities.User.update(user.id, { 
              apple_last_sign_in: new Date().toISOString() 
            }); 
          } catch (e) {}
        }

        // Issue session token using Base44's native method
        const sessionToken = await base44.asServiceRole.auth.issueSessionToken(user.email || user.id);

        return new Response(JSON.stringify({ 
          success: true, 
          sessionToken: sessionToken,
          appleUser: {
            id: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
            isPrivateEmail: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false
          }
        }), { 
          status: 200, 
          headers: { ...corsHeaders(true), 'Content-Type': 'application/json' }
        });

      } catch (userErr) {
        console.error('User/session processing error:', userErr);
        return new Response(JSON.stringify({ success: false, error: 'server_error' }), { status: 500, headers: corsHeaders(true) });
      }
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), { status: 400, headers: corsHeaders() });

  } catch (error) {
    console.error('Apple Sign In error (debug):', error);

    // Prepare safe error response for debugging (trim stack)
    const safeMessage = String(error && error.message ? error.message : error).slice(0, 1000);
    const safeStack = String(error && error.stack ? error.stack : '').slice(0, 2000);

    const debugResp = {
      success: false,
      error: 'server_error',
      debug: {
        message: safeMessage,
        stack: safeStack
      }
    };

    // Still try to log to ErrorLog if possible
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'auth',
        severity: 'error',
        function_name: 'handleAppleSignIn',
        error_message: safeMessage,
        error_stack: safeStack
      });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }

    return new Response(JSON.stringify(debugResp), {
      status: 500,
      headers: { ...corsHeaders(true), 'Content-Type': 'application/json' }
    });
  }
});