import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleAuth } from 'npm:google-auth-library@9.4.1';

const PRODUCT_MAPPING: Record<string, string> = {
  'com.sportswagerhelper.premium.monthly': 'premium_monthly',
  'com.sportswagerhelper.vip.annual': 'vip_annual',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const PACKAGE_NAME = Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME') || 'com.wnapp.id1761803023263';

async function getAuthenticatedClient() {
  const keyJson = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY');
  if (!keyJson) throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY not configured');
  const credentials = JSON.parse(keyJson);
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  return auth.getClient();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const { purchaseToken, productId } = await req.json();

    if (!purchaseToken || !productId) {
      return Response.json(
        { success: false, error: 'Missing purchaseToken or productId' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log('[RestoreGooglePlay] Restoring purchase:', { productId, userEmail: user.email });

    const client = await getAuthenticatedClient();

    // Try subscription endpoint first
    let purchaseData: Record<string, unknown> | null = null;
    let isSubscription = false;

    try {
      const subUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
      const subResp = await client.request<Record<string, unknown>>({ url: subUrl });
      if (subResp.data) {
        purchaseData = subResp.data;
        isSubscription = true;
        console.log('[RestoreGooglePlay] Found subscription:', purchaseData);
      }
    } catch {
      console.log('[RestoreGooglePlay] Not a subscription, trying as one-time product');
    }

    // Fall back to one-time product endpoint
    if (!purchaseData) {
      try {
        const prodUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${productId}/tokens/${purchaseToken}`;
        const prodResp = await client.request<Record<string, unknown>>({ url: prodUrl });
        if (prodResp.data) {
          purchaseData = prodResp.data;
          isSubscription = false;
          console.log('[RestoreGooglePlay] Found product purchase:', purchaseData);
        }
      } catch (err) {
        throw new Error('Purchase not found or invalid');
      }
    }

    if (!purchaseData) {
      throw new Error('Purchase not found');
    }

    // Validate purchase state depending on type
    if (isSubscription) {
      // For subscriptions: paymentState 1 = received, 2 = free trial
      const paymentState = purchaseData.paymentState as number | undefined;
      const expiryMs = parseInt((purchaseData.expiryTimeMillis as string) || '0', 10);
      const isActive =
        (paymentState === 1 || paymentState === 2) &&
        (!expiryMs || expiryMs > Date.now());
      if (!isActive) {
        return Response.json(
          { success: false, error: 'Subscription is not active or has expired' },
          { status: 400, headers: CORS_HEADERS }
        );
      }
    } else {
      // For one-time products: purchaseState 0 = purchased
      if ((purchaseData.purchaseState as number) !== 0) {
        return Response.json(
          { success: false, error: 'Purchase is not in valid state' },
          { status: 400, headers: CORS_HEADERS }
        );
      }
    }

    // Map product ID to subscription type
    let subscriptionType = PRODUCT_MAPPING[productId];
    if (!subscriptionType) {
      // Fallback heuristic for unknown product IDs
      if (productId.includes('annual') || productId.includes('vip')) {
        subscriptionType = 'vip_annual';
      } else {
        subscriptionType = 'premium_monthly';
      }
    }

    // Update user subscription
    const updateData: Record<string, unknown> = {
      subscription_type: subscriptionType,
      google_play_purchase_token: purchaseToken,
      google_play_product_id: productId,
    };
    if (isSubscription && purchaseData.expiryTimeMillis) {
      updateData.subscription_expires_at = new Date(
        parseInt(purchaseData.expiryTimeMillis as string, 10)
      ).toISOString();
    }

    await base44.asServiceRole.entities.User.update(user.id, updateData);

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
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('[RestoreGooglePlay] Error:', error);
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
