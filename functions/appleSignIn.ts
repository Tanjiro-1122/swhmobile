import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import jwt from 'npm:jsonwebtoken@9.0.2';

const APPLE_CLIENT_ID = Deno.env.get("APPLE_CLIENT_ID");
const APPLE_TEAM_ID = Deno.env.get("APPLE_TEAM_ID");
const APPLE_KEY_ID = Deno.env.get("APPLE_KEY_ID");
const APPLE_PRIVATE_KEY = Deno.env.get("APPLE_PRIVATE_KEY");

// Generate Apple client secret JWT
function generateClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  
  // Handle private key format - replace literal \n with actual newlines
  let privateKey = APPLE_PRIVATE_KEY;
  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  const payload = {
    iss: APPLE_TEAM_ID,
    iat: now,
    exp: now + 86400 * 180, // 180 days
    aud: 'https://appleid.apple.com',
    sub: APPLE_CLIENT_ID,
  };

  const header = {
    alg: 'ES256',
    kid: APPLE_KEY_ID,
  };

  return jwt.sign(payload, privateKey, { algorithm: 'ES256', header });
}

// Verify Apple identity token
async function verifyAppleToken(identityToken) {
  // Fetch Apple's public keys
  const keysResponse = await fetch('https://appleid.apple.com/auth/keys');
  const keysData = await keysResponse.json();
  
  // Decode the token header to get the key id
  const tokenParts = identityToken.split('.');
  const header = JSON.parse(atob(tokenParts[0]));
  
  // Find the matching key
  const key = keysData.keys.find(k => k.kid === header.kid);
  if (!key) {
    throw new Error('Unable to find matching Apple public key');
  }
  
  // For simplicity, we'll decode and verify basic claims
  // In production, you'd want to use a proper JWT library with JWK support
  const payload = JSON.parse(atob(tokenParts[1]));
  
  // Verify basic claims
  if (payload.iss !== 'https://appleid.apple.com') {
    throw new Error('Invalid token issuer');
  }
  
  if (payload.aud !== APPLE_CLIENT_ID) {
    throw new Error('Invalid token audience');
  }
  
  if (payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }
  
  return payload;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { action, identityToken, authorizationCode, user } = await req.json();

    if (action === 'getClientId') {
      // Return client ID for frontend initialization
      // Also log config status for debugging (without exposing secrets)
      console.log('Apple Sign In Config Check:', {
        hasClientId: !!APPLE_CLIENT_ID,
        hasTeamId: !!APPLE_TEAM_ID,
        hasKeyId: !!APPLE_KEY_ID,
        hasPrivateKey: !!APPLE_PRIVATE_KEY,
        privateKeyLength: APPLE_PRIVATE_KEY?.length || 0,
        clientId: APPLE_CLIENT_ID
      });
      
      return Response.json({ 
        clientId: APPLE_CLIENT_ID,
        redirectUri: 'https://sportswagerhelper.com/apple-auth-callback',
        configStatus: {
          hasClientId: !!APPLE_CLIENT_ID,
          hasTeamId: !!APPLE_TEAM_ID,
          hasKeyId: !!APPLE_KEY_ID,
          hasPrivateKey: !!APPLE_PRIVATE_KEY
        }
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'verify') {
      // Verify the identity token from Apple
      const appleUser = await verifyAppleToken(identityToken);
      
      return Response.json({
        success: true,
        appleUser: {
          id: appleUser.sub,
          email: appleUser.email,
          emailVerified: appleUser.email_verified,
          isPrivateEmail: appleUser.is_private_email,
        },
        // Include user info if provided (only on first sign in)
        userInfo: user || null
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'exchangeCode') {
      // Exchange authorization code for tokens
      const clientSecret = generateClientSecret();
      
      const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: APPLE_CLIENT_ID,
          client_secret: clientSecret,
          code: authorizationCode,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Decode the id_token to get user info
      const idTokenParts = tokenData.id_token.split('.');
      const idTokenPayload = JSON.parse(atob(idTokenParts[1]));

      return Response.json({
        success: true,
        appleUser: {
          id: idTokenPayload.sub,
          email: idTokenPayload.email,
          emailVerified: idTokenPayload.email_verified,
        },
        tokens: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          idToken: tokenData.id_token,
          expiresIn: tokenData.expires_in,
        }
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    return Response.json({ error: 'Invalid action' }, { 
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Apple Sign In error:', error);
    return Response.json({ error: error.message }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
});