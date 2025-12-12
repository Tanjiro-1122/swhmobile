import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as jose from 'npm:jose@5.2.3';

const APPLE_CLIENT_ID = Deno.env.get('APPLE_CLIENT_ID') || '';
const APPLE_TEAM_ID = Deno.env.get('APPLE_TEAM_ID') || '';
const APPLE_KEY_ID = Deno.env.get('APPLE_KEY_ID') || '';
const APPLE_PRIVATE_KEY = Deno.env.get('APPLE_PRIVATE_KEY') || '';
const APPLE_REDIRECT_URI = Deno.env.get('APPLE_REDIRECT_URI') || 'https://sportswagerhelper.com/apple-auth-callback';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

async function generateClientSecret() {
  if (!APPLE_PRIVATE_KEY || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_CLIENT_ID) {
    const missing = [];
    if (!APPLE_PRIVATE_KEY) missing.push('APPLE_PRIVATE_KEY');
    if (!APPLE_TEAM_ID) missing.push('APPLE_TEAM_ID');
    if (!APPLE_KEY_ID) missing.push('APPLE_KEY_ID');
    if (!APPLE_CLIENT_ID) missing.push('APPLE_CLIENT_ID');
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  let privateKey = APPLE_PRIVATE_KEY;
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    const raw = privateKey.replace(/\s/g, '');
    const chunked = raw.match(/.{1,64}/g)?.join('\n') || raw;
    privateKey = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
  }

  const alg = 'ES256';
  const ecPrivateKey = await jose.importPKCS8(privateKey, alg);
  
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 180; // 180 days

  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg, kid: APPLE_KEY_ID })
    .setIssuedAt(iat)
    .setIssuer(APPLE_TEAM_ID)
    .setAudience('https://appleid.apple.com')
    .setSubject(APPLE_CLIENT_ID)
    .setExpirationTime(exp)
    .sign(ecPrivateKey);

  return { jwt, exp, iat };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }), 
        { status: 403, headers: corsHeaders() }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, authorizationCode } = body || {};

    if (action === 'generateClientSecret') {
      const { jwt, exp, iat } = await generateClientSecret();
      
      return new Response(
        JSON.stringify({
          success: true,
          clientSecret: jwt,
          expiresAt: new Date(exp * 1000).toISOString(),
          issuedAt: new Date(iat * 1000).toISOString(),
          keyId: APPLE_KEY_ID,
          teamId: APPLE_TEAM_ID,
          clientId: APPLE_CLIENT_ID
        }),
        { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchangeCode') {
      if (!authorizationCode) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing authorizationCode' }),
          { status: 400, headers: corsHeaders() }
        );
      }

      const { jwt: clientSecret } = await generateClientSecret();

      const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: APPLE_CLIENT_ID,
          client_secret: clientSecret,
          code: authorizationCode,
          grant_type: 'authorization_code',
          redirect_uri: APPLE_REDIRECT_URI,
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: tokenData.error,
            error_description: tokenData.error_description,
            apple_response: tokenData
          }),
          { status: 400, headers: corsHeaders() }
        );
      }

      // Verify and decode id_token
      let appleUser = null;
      if (tokenData.id_token) {
        try {
          const appleJWKS = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
          const { payload } = await jose.jwtVerify(tokenData.id_token, appleJWKS, {
            issuer: 'https://appleid.apple.com',
            audience: APPLE_CLIENT_ID,
          });
          appleUser = {
            sub: payload.sub,
            email: payload.email,
            email_verified: payload.email_verified,
            is_private_email: payload.is_private_email
          };
        } catch (verifyErr) {
          console.error('id_token verification failed:', verifyErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          id_token: tokenData.id_token,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_in: tokenData.expires_in,
          appleUser
        }),
        { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: corsHeaders() }
    );

  } catch (error) {
    console.error('Test Apple Auth error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      }),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
});