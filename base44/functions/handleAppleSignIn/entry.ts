import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Apple Sign-In secrets
const APPLE_PRIVATE_KEY = Deno.env.get('APPLE_PRIVATE_KEY') || '';
const APPLE_KEY_ID = Deno.env.get('APPLE_KEY_ID') || '';
const APPLE_TEAM_ID = Deno.env.get('APPLE_TEAM_ID') || '';
const APPLE_CLIENT_ID = Deno.env.get('APPLE_CLIENT_ID') || 'com.sportswagerhelper.app';
const APPLE_REDIRECT_URI = Deno.env.get('APPLE_REDIRECT_URI') || 'https://sportswagerhelper.com/auth/apple/callback';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Generate a client secret JWT for Apple Sign-In (ES256)
async function generateClientSecret(): Promise<string> {
  const privateKeyStr = APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const header = { alg: 'ES256', kid: APPLE_KEY_ID };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: APPLE_TEAM_ID,
    iat: now,
    exp: now + 3600,
    aud: 'https://appleid.apple.com',
    sub: APPLE_CLIENT_ID,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const keyData = privateKeyStr
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const keyBytes = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(signingInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${signingInput}.${signatureB64}`;
}

// Decode Apple identity token JWT payload
function decodeAppleToken(token: string): { sub: string; email?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

// Exchange authorization code with Apple
async function exchangeCodeWithApple(authorizationCode: string): Promise<any> {
  const clientSecret = await generateClientSecret();
  const params = new URLSearchParams({
    client_id: APPLE_CLIENT_ID,
    client_secret: clientSecret,
    code: authorizationCode,
    grant_type: 'authorization_code',
    redirect_uri: APPLE_REDIRECT_URI,
  });

  const resp = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  return resp.json();
}

// Find existing user or create new one by Apple user ID
async function findOrCreateUser(
  base44: any,
  appleUserId: string,
  email: string | null,
  fullName: string | null
): Promise<any> {
  // Search by apple_user_id first
  try {
    const existing = await base44.asServiceRole.entities.User.filter({ apple_user_id: appleUserId });
    if (existing && existing.length > 0) return existing[0];
  } catch {}

  // Search by email
  if (email) {
    try {
      const byEmail = await base44.asServiceRole.entities.User.filter({ email });
      if (byEmail && byEmail.length > 0) {
        return await base44.asServiceRole.entities.User.update(byEmail[0].id, {
          apple_user_id: appleUserId,
          full_name: fullName || byEmail[0].full_name,
        });
      }
    } catch {}
  }

  // Create new user
  return await base44.asServiceRole.entities.User.create({
    email: email || `${appleUserId}@privaterelay.appleid.com`,
    full_name: fullName || 'SWH User',
    apple_user_id: appleUserId,
    subscription_type: 'free',
    search_credits: 5,
    role: 'user',
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  let body: any = {};
  let base44: any;

  try {
    base44 = createClientFromRequest(req);
    body = await req.json().catch(() => ({}));

    const { action, identityToken, authorizationCode, email, fullName } = body;

    // ── nativeSignIn: iOS app sends identityToken directly ───────────────────
    if (action === 'nativeSignIn') {
      if (!identityToken) {
        return Response.json({ error: 'identityToken required' }, { status: 400, headers: corsHeaders() });
      }

      const tokenPayload = decodeAppleToken(identityToken);
      if (!tokenPayload?.sub) {
        return Response.json({ error: 'Invalid identity token' }, { status: 400, headers: corsHeaders() });
      }

      const appleUserId = tokenPayload.sub;
      const userEmail = email || tokenPayload.email || null;
      const userName = fullName || null;

      const user = await findOrCreateUser(base44, appleUserId, userEmail, userName);
      const sessionToken = await base44.asServiceRole.auth.createSessionToken(user.id);

      return Response.json({
        success: true,
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          subscription_type: user.subscription_type,
          search_credits: user.search_credits,
        },
      }, { headers: corsHeaders() });
    }

    // ── exchangeCode: web OAuth callback sends authorization code ─────────────
    if (action === 'exchangeCode') {
      if (!authorizationCode) {
        return Response.json({ error: 'authorizationCode required' }, { status: 400, headers: corsHeaders() });
      }

      const tokenResponse = await exchangeCodeWithApple(authorizationCode);

      if (tokenResponse.error) {
        return Response.json({
          error: `Apple token exchange failed: ${tokenResponse.error}`,
          detail: tokenResponse.error_description,
        }, { status: 400, headers: corsHeaders() });
      }

      const idToken = tokenResponse.id_token;
      if (!idToken) {
        return Response.json({ error: 'No id_token from Apple' }, { status: 400, headers: corsHeaders() });
      }

      const tokenPayload = decodeAppleToken(idToken);
      if (!tokenPayload?.sub) {
        return Response.json({ error: 'Invalid id_token from Apple' }, { status: 400, headers: corsHeaders() });
      }

      const appleUserId = tokenPayload.sub;
      const userEmail = body.email || tokenPayload.email || null;
      const userName = body.fullName || null;

      const user = await findOrCreateUser(base44, appleUserId, userEmail, userName);
      const sessionToken = await base44.asServiceRole.auth.createSessionToken(user.id);

      return Response.json({
        success: true,
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          subscription_type: user.subscription_type,
          search_credits: user.search_credits,
        },
      }, { headers: corsHeaders() });
    }

    return Response.json({ error: 'Unknown action. Use nativeSignIn or exchangeCode.' }, { status: 400, headers: corsHeaders() });

  } catch (err: any) {
    console.error('handleAppleSignIn error:', err);
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
});
