import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { purchaseToken, productId } = await req.json();

    if (!purchaseToken || !productId) {
      return Response.json(
        { success: false, error: 'Missing purchaseToken or productId' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('[RestoreGooglePlay] Restoring purchase:', { productId, userEmail: user.email });

    // Get Google Play service account key
    const serviceAccountKey = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      throw new Error('Google Play service account key not configured');
    }

    // Parse service account credentials
    const credentials = JSON.parse(serviceAccountKey);

    // Create JWT for Google OAuth
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Encode JWT
    const encoder = new TextEncoder();
    const headerB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(header))))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payloadB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(payload))))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const signatureInput = `${headerB64}.${payloadB64}`;
    
    // Import private key
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      Uint8Array.from(atob(credentials.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), c => c.charCodeAt(0)),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      encoder.encode(signatureInput)
    );
    
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const jwt = `${signatureInput}.${signatureB64}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Determine package name and verify purchase
    const packageName = 'com.sportswagerhelper.app'; // Your Android package name

    // Check if it's a subscription
    let verifyUrl, purchaseData;
    
    // Try subscription first
    try {
      verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
      const verifyResponse = await fetch(verifyUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (verifyResponse.ok) {
        purchaseData = await verifyResponse.json();
        console.log('[RestoreGooglePlay] Found subscription:', purchaseData);
      }
    } catch (err) {
      console.log('[RestoreGooglePlay] Not a subscription, trying as product');
    }

    // If not subscription, try as product (one-time purchase)
    if (!purchaseData) {
      verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;
      const verifyResponse = await fetch(verifyUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!verifyResponse.ok) {
        throw new Error('Purchase not found or invalid');
      }

      purchaseData = await verifyResponse.json();
      console.log('[RestoreGooglePlay] Found product purchase:', purchaseData);
    }

    // Verify purchase is valid
    if (purchaseData.purchaseState !== 0) {
      return Response.json(
        { success: false, error: 'Purchase is not in valid state' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Map product ID to subscription type
    let subscriptionType;
    if (productId.includes('annual') || productId.includes('vip')) {
      subscriptionType = 'vip_annual';
    } else if (productId.includes('monthly') || productId.includes('premium')) {
      subscriptionType = 'premium_monthly';
    } else {
      subscriptionType = 'premium_monthly'; // Default
    }

    // Update user subscription
    await base44.asServiceRole.entities.User.update(user.id, {
      subscription_type: subscriptionType,
      google_play_purchase_token: purchaseToken,
      google_play_product_id: productId,
    });

    // Create audit record
    await base44.asServiceRole.entities.PurchaseAudit.create({
      user_email: user.email,
      platform: 'android',
      product_id: productId,
      purchase_token: purchaseToken,
      status: 'verified',
      granted_subscription: subscriptionType,
      verification_result: purchaseData,
    });

    console.log('[RestoreGooglePlay] Successfully restored:', { userEmail: user.email, subscriptionType });

    return Response.json(
      { success: true, subscriptionType },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('[RestoreGooglePlay] Error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});