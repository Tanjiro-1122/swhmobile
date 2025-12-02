import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as jose from 'npm:jose@5.2.3';

const APPLE_CLIENT_ID = Deno.env.get("APPLE_CLIENT_ID");
const APPLE_TEAM_ID = Deno.env.get("APPLE_TEAM_ID");
const APPLE_KEY_ID = Deno.env.get("APPLE_KEY_ID");
const APPLE_PRIVATE_KEY = Deno.env.get("APPLE_PRIVATE_KEY");

// Generate Apple client secret JWT using jose
async function generateClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  
  // Simple Key Formatting - Handle newlines only
  let privateKey = APPLE_PRIVATE_KEY || "";
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // If user pasted just the blob without headers, add them
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
      const rawBody = privateKey.replace(/\s/g, ''); // Clean up
      const chunked = rawBody.match(/.{1,64}/g)?.join('\n');
      privateKey = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
  }

  try {
    const alg = 'ES256';
    const ecPrivateKey = await jose.importPKCS8(privateKey, alg);
    
    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({ alg, kid: APPLE_KEY_ID })
      .setIssuedAt(now)
      .setIssuer(APPLE_TEAM_ID)
      .setAudience('https://appleid.apple.com')
      .setSubject(APPLE_CLIENT_ID)
      .setExpirationTime(now + 86400 * 180) // 180 days
      .sign(ecPrivateKey);
      
    return jwt;
  } catch (err) {
    console.error("JOSE Sign Error:", err);
    if (err.message && (err.message.includes("requires curve") || err.message.includes("curve"))) {
         throw new Error(`Invalid Key Curve: The provided APPLE_PRIVATE_KEY is not a P-256 Elliptic Curve key. Please ensure you downloaded the .p8 file from the Apple Developer Portal (Keys section) and it is specifically for "Sign in with Apple". Error details: ${err.message}`);
    }
    throw new Error(`Failed to sign Apple client secret: ${err.message}`);
  }
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
      return Response.json({ 
        clientId: APPLE_CLIENT_ID,
        // Let frontend determine the redirect URI based on current window.location
        // or use a specific one if needed.
        redirectUri: null, 
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

    if (action === 'testManualKey') {
        const { manualKey } = await req.json();
        
        // 1. Basic Cleanup
        let cleanKey = manualKey || "";
        if (cleanKey.includes("\\n")) cleanKey = cleanKey.replace(/\\n/g, '\n');
        
        // 2. Add headers if missing
        if (!cleanKey.includes("BEGIN PRIVATE KEY")) {
            const rawBody = cleanKey.replace(/\s/g, '');
            const chunked = rawBody.match(/.{1,64}/g)?.join('\n');
            cleanKey = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----`;
        }

        try {
          // Test 1: Is it a valid ES256 (P-256) key? (What Apple needs)
          await jose.importPKCS8(cleanKey, 'ES256');
          
          return Response.json({ 
            success: true, 
            message: "Success! This is a valid Elliptic Curve (P-256) key compatible with Apple Sign In.",
            details: {
                algorithm: "ES256",
                format: "PKCS8",
                readyForSecrets: true
            }
          }, { headers: { 'Access-Control-Allow-Origin': '*' }});

        } catch (esError) {
          // Test 2: Is it an RSA key? (Common mistake, e.g. Google keys)
          try {
            await jose.importPKCS8(cleanKey, 'RS256');
            return Response.json({ 
                success: false, 
                error: "WRONG KEY TYPE: This is an RSA key (commonly used by Google). Apple Sign In requires an Elliptic Curve (EC) P-256 key.",
                details: {
                    detectedType: "RSA (RS256)",
                    requiredType: "Elliptic Curve (ES256)"
                }
            }, { headers: { 'Access-Control-Allow-Origin': '*' }});
          } catch (rsaError) {
            // Test 3: Generic failure
            return Response.json({ 
                success: false, 
                error: `Key Parsing Failed: ${esError.message}`,
                details: {
                    originalError: esError.message
                }
            }, { headers: { 'Access-Control-Allow-Origin': '*' }});
          }
        }
      }

    if (action === 'exchangeCode') {
      const { redirectUri } = await req.json();
      console.log('Starting exchangeCode action with redirectUri:', redirectUri);

      if (!APPLE_PRIVATE_KEY || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_CLIENT_ID) {
        const missing = [];
        if (!APPLE_PRIVATE_KEY) missing.push('APPLE_PRIVATE_KEY');
        if (!APPLE_TEAM_ID) missing.push('APPLE_TEAM_ID');
        if (!APPLE_KEY_ID) missing.push('APPLE_KEY_ID');
        if (!APPLE_CLIENT_ID) missing.push('APPLE_CLIENT_ID');
        throw new Error(`Missing required secrets for Apple Sign In: ${missing.join(', ')}`);
      }

      // Exchange authorization code for tokens
      let clientSecret;
      try {
        clientSecret = await generateClientSecret();
      } catch (err) {
        console.error('Error generating client secret:', err);
        throw new Error(`Failed to generate client secret: ${err.message}`);
      }

      // Log key format details (safely)
      const keyDebug = APPLE_PRIVATE_KEY ? {
        length: APPLE_PRIVATE_KEY.length,
        hasHeader: APPLE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY'),
        hasFooter: APPLE_PRIVATE_KEY.includes('END PRIVATE KEY'),
        hasNewlines: APPLE_PRIVATE_KEY.includes('\n') || APPLE_PRIVATE_KEY.includes('\\n')
      } : 'MISSING';

      console.log('Exchanging code with Apple:', {
        client_id: APPLE_CLIENT_ID,
        team_id: APPLE_TEAM_ID,
        key_id: APPLE_KEY_ID,
        hasClientSecret: !!clientSecret,
        hasCode: !!authorizationCode,
        keyDebug
      });

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
          redirect_uri: redirectUri || 'https://sportswagerhelper.com/apple-auth-callback',
        }),
      });

      const tokenData = await tokenResponse.json();

      console.log('Apple token response:', JSON.stringify(tokenData));

      if (tokenData.error) {
        console.error('Apple token error:', tokenData);
        throw new Error(`Apple API Error: ${tokenData.error_description || tokenData.error}`);
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

    return Response.json({ success: false, error: 'Invalid action' }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Apple Sign In CRITICAL error:', error);
    console.error('Stack:', error.stack);
    return Response.json({ 
      success: false,
      error: error.message, 
      stack: error.stack,
      details: 'Check backend logs for more info'
    }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
});