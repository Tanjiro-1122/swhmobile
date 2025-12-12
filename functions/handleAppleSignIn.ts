import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as jose from 'npm:jose@5.2.3';

const APPLE_CLIENT_ID = Deno.env.get("APPLE_CLIENT_ID");
const APPLE_TEAM_ID = Deno.env.get("APPLE_TEAM_ID");
const APPLE_KEY_ID = Deno.env.get("APPLE_KEY_ID");
const APPLE_PRIVATE_KEY = Deno.env.get("APPLE_PRIVATE_KEY");
const APPLE_REDIRECT_URI = Deno.env.get('APPLE_REDIRECT_URI') || 'https://sportswagerhelper.com/apple-auth-callback';
const APP_CORS_ORIGIN = Deno.env.get('APP_CORS_ORIGIN') || 'https://sportswagerhelper.com';
const ALLOW_KEY_TEST = Deno.env.get('ALLOW_KEY_TEST') === 'true';

// 1) TypeScript typing for cached client secret
let cachedClientSecret: { token: string; expAt: number } | null = null;

// Simple rate limiter (in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Helper: build secure CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': APP_CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

async function ensureClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedClientSecret && cachedClientSecret.expAt > now + 60) { // keep 60s buffer
    return cachedClientSecret.token;
  }

  if (!APPLE_PRIVATE_KEY || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_CLIENT_ID) {
    throw new Error('Missing APPLE_* env vars needed to generate client secret');
  }

  // Normalize private key formatting
  let privateKey = APPLE_PRIVATE_KEY || '';
  if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    const rawBody = privateKey.replace(/\s/g, '');
    const chunked = rawBody.match(/.{1,64}/g)?.join('\n') || rawBody;
    privateKey = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
  }

  // Create signed JWT (client_secret)
  const alg = 'ES256';
  const ecPrivateKey = await jose.importPKCS8(privateKey, alg);
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 180; // 180 days (Apple allows up to 6 months)
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

// Use Apple's JWK set and jose to verify tokens (signature + claims)
const appleJWKS = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

async function verifyIdToken(idToken) {
  if (!APPLE_CLIENT_ID) throw new Error('APPLE_CLIENT_ID not configured');

  // jwtVerify will fetch the appropriate JWK and verify signature and exp/iat by default
  const { payload } = await jose.jwtVerify(idToken, appleJWKS, {
    issuer: 'https://appleid.apple.com',
    audience: APPLE_CLIENT_ID,
  });

  return payload;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const body = await req.json(); // parse once
    const { action, identityToken, authorizationCode, user, manualKey } = body || {};

    if (action === 'getClientId') {
      return Response.json({
        clientId: APPLE_CLIENT_ID,
        redirectUri: APPLE_REDIRECT_URI,
      }, { headers: corsHeaders() });
    }

    if (action === 'verify') {
      if (!identityToken) {
        return Response.json({ success: false, error: 'Missing identityToken' }, { status: 400, headers: corsHeaders() });
      }
      // Verify signature + claims using Apple's JWKS
      const payload = await verifyIdToken(identityToken);
      return Response.json({
        success: true,
        appleUser: {
          id: payload.sub,
          email: payload.email,
          emailVerified: payload.email_verified,
          isPrivateEmail: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false
        },
        userInfo: user || null
      }, { headers: corsHeaders() });
    }

    // Admin/dev-only key test endpoint
    if (action === 'testManualKey') {
      if (!ALLOW_KEY_TEST) {
        return Response.json({ success: false, error: 'Key testing disabled in production' }, { status: 403, headers: corsHeaders() });
      }
      
      // 3) Rate limit this endpoint
      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      if (!checkRateLimit(`testKey:${clientIp}`, 5, 300000)) { // 5 requests per 5 minutes
        return Response.json({ success: false, error: 'Rate limit exceeded' }, { status: 429, headers: corsHeaders() });
      }
      let cleanKey = manualKey || '';
      if (cleanKey.includes('\\n')) cleanKey = cleanKey.replace(/\\n/g, '\n');
      if (!cleanKey.includes('BEGIN PRIVATE KEY')) {
        const rawBody = cleanKey.replace(/\s/g, '');
        const chunked = rawBody.match(/.{1,64}/g)?.join('\n') || rawBody;
        cleanKey = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
      }

      try {
        await jose.importPKCS8(cleanKey, 'ES256');
        return Response.json({
          success: true,
          message: 'Valid EC P-256 (ES256) key',
        }, { headers: corsHeaders() });
      } catch (esErr) {
        try {
          await jose.importPKCS8(cleanKey, 'RS256');
          return Response.json({
            success: false,
            error: 'Wrong key type: RSA detected. Apple needs EC P-256 (ES256).'
          }, { headers: corsHeaders() });
        } catch {
          return Response.json({ success: false, error: `Key parsing error: ${esErr.message}` }, { status: 400, headers: corsHeaders() });
        }
      }
    }

    if (action === 'exchangeCode') {
      if (!authorizationCode) {
        return Response.json({ success: false, error: 'Missing authorizationCode' }, { status: 400, headers: corsHeaders() });
      }
      
      // 3) Rate limit exchangeCode action
      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      if (!checkRateLimit(`exchange:${clientIp}`, 20, 60000)) { // 20 requests per minute
        return Response.json({ success: false, error: 'Rate limit exceeded' }, { status: 429, headers: corsHeaders() });
      }

      // Ensure env is set
      if (!APPLE_PRIVATE_KEY || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_CLIENT_ID) {
        const missing = [];
        if (!APPLE_PRIVATE_KEY) missing.push('APPLE_PRIVATE_KEY');
        if (!APPLE_TEAM_ID) missing.push('APPLE_TEAM_ID');
        if (!APPLE_KEY_ID) missing.push('APPLE_KEY_ID');
        if (!APPLE_CLIENT_ID) missing.push('APPLE_CLIENT_ID');
        return Response.json({ success: false, error: `Missing required secrets: ${missing.join(', ')}` }, { status: 500, headers: corsHeaders() });
      }

      // Generate (or reuse cached) client secret
      let clientSecret;
      try {
        clientSecret = await ensureClientSecret();
      } catch (err) {
        console.error('Error generating client secret:', err);
        return Response.json({ success: false, error: 'Failed to generate client secret' }, { status: 500, headers: corsHeaders() });
      }

      // Exchange code for tokens
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
        console.error('Apple token error:', tokenData);
        return Response.json({ success: false, error: tokenData.error_description || tokenData.error }, { status: 400, headers: corsHeaders() });
      }

      // Strongly verify id_token signature & claims before trusting payload
      if (!tokenData.id_token) {
        return Response.json({ success: false, error: 'No id_token in token response' }, { status: 400, headers: corsHeaders() });
      }

      let payload;
      try {
        const verification = await jose.jwtVerify(tokenData.id_token, appleJWKS, {
          issuer: 'https://appleid.apple.com',
          audience: APPLE_CLIENT_ID
        });
        payload = verification.payload;
      } catch (verifyErr) {
        console.error('id_token verification failed:', verifyErr);
        return Response.json({ success: false, error: 'Failed to verify id_token' }, { status: 400, headers: corsHeaders() });
      }

      // 2) OPTIONAL: nonce verification (prevents replay attacks)
      try {
        const expectedNonce = body.nonce || null;
        if (expectedNonce && payload.nonce !== expectedNonce) {
          console.error('Nonce mismatch for Apple sign-in');
          return Response.json({ success: false, error: 'Invalid nonce' }, { status: 400, headers: corsHeaders() });
        }
      } catch (nonceErr) {
        console.error('Nonce verification error:', nonceErr);
        return Response.json({ success: false, error: 'Nonce verification failed' }, { status: 400, headers: corsHeaders() });
      }

      // At this point payload is trusted — use payload.sub as Apple unique id
      // 5) Server-side account linking by provider_id (payload.sub)
      const base44 = createClientFromRequest(req);
      let currentUser = null;
      try {
        currentUser = await base44.auth.me();
      } catch (authErr) {
        // User not authenticated yet - that's okay, we'll handle account lookup below
      }

      // Check if an account exists with this apple_provider_id
      const existingUsers = await base44.asServiceRole.entities.User.filter({
        apple_provider_id: payload.sub
      });

      if (existingUsers.length > 0) {
        // Account exists with this Apple ID
        const linkedUser = existingUsers[0];
        
        // If currently logged in as different user, prevent cross-account hijacking
        if (currentUser && currentUser.id !== linkedUser.id) {
          return Response.json({
            success: false,
            error: 'This Apple account is already linked to a different user'
          }, { status: 400, headers: corsHeaders() });
        }

        // Update last sign-in timestamp
        await base44.asServiceRole.entities.User.update(linkedUser.id, {
          apple_last_sign_in: new Date().toISOString()
        });

        // Return linked account info (client will handle login redirect)
        return Response.json({
          success: true,
          appleUser: {
            id: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
            isPrivateEmail: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false
          },
          linkedUserEmail: linkedUser.email
        }, { headers: corsHeaders() });
      }

      // No existing account with this apple_provider_id
      // If user is currently logged in, link Apple to their account
      if (currentUser) {
        await base44.asServiceRole.entities.User.update(currentUser.id, {
          apple_provider_id: payload.sub,
          apple_provider_email: payload.email || '',
          apple_is_private_email: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false,
          apple_linked_at: new Date().toISOString(),
          apple_last_sign_in: new Date().toISOString()
        });

        return Response.json({
          success: true,
          appleUser: {
            id: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
            isPrivateEmail: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false
          },
          linked: true,
          linkedUserEmail: currentUser.email
        }, { headers: corsHeaders() });
      }

      // User not logged in and no account with this Apple ID
      // Return user info for client to handle (create account or link after login)
      return Response.json({
        success: true,
        appleUser: {
          id: payload.sub,
          email: payload.email,
          emailVerified: payload.email_verified,
          isPrivateEmail: payload.hasOwnProperty('is_private_email') ? payload.is_private_email : false
        },
        requiresLogin: true
      }, { headers: corsHeaders() });
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400, headers: corsHeaders() });
  } catch (error) {
    console.error('Apple Sign In error:', error);
    
    // 6) Sanitize error logs - remove sensitive data
    const sanitizedMessage = error.message?.replace(/client_secret=[^&]*/g, 'client_secret=REDACTED')
                                          ?.replace(/code=[^&]*/g, 'code=REDACTED')
                                          ?.replace(/id_token=[^&]*/g, 'id_token=REDACTED') || 'Unknown error';
    const sanitizedStack = error.stack?.replace(/client_secret=[^&]*/g, 'client_secret=REDACTED')
                                       ?.replace(/code=[^&]*/g, 'code=REDACTED')
                                       ?.replace(/id_token=[^&]*/g, 'id_token=REDACTED') || '';
    
    // Log sanitized error to database
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'auth',
        severity: 'error',
        function_name: 'handleAppleSignIn',
        error_message: sanitizedMessage,
        error_stack: sanitizedStack
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return Response.json({ success: false, error: 'Authentication error occurred' }, { status: 500, headers: { 'Access-Control-Allow-Origin': APP_CORS_ORIGIN } });
  }
});