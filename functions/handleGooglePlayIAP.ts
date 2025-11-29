import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { GoogleAuth } from 'npm:google-auth-library@9.4.1';

// Map Google Play Product IDs to subscription types
const PRODUCT_MAPPING = {
  'com.sportswagerhelper.premium.monthly': 'premium_monthly',
  'com.sportswagerhelper.vip.annual': 'vip_annual'
};

// Package name for your app
const PACKAGE_NAME = 'com.wnapp.id1761803023263';

// Get service account credentials from environment
const getServiceAccountCredentials = () => {
  const keyJson = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY');
  if (!keyJson) {
    throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY not configured');
  }
  return JSON.parse(keyJson);
};

// Get authenticated Google API client
const getAuthenticatedClient = async () => {
  const credentials = getServiceAccountCredentials();
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
  });
  return await auth.getClient();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { purchaseToken, productId } = body;

    if (!purchaseToken || !productId) {
      return Response.json({ 
        success: false, 
        error: 'Missing purchaseToken or productId' 
      }, { status: 400 });
    }

    console.log('Processing Google Play IAP:', { productId, userEmail: user.email });

    // Determine if this is a subscription or one-time purchase
    const isSubscription = productId.includes('monthly') || productId.includes('annual');
    
    let purchaseData;
    
    if (isSubscription) {
      purchaseData = await verifySubscription(productId, purchaseToken);
    } else {
      purchaseData = await verifyOneTimePurchase(productId, purchaseToken);
    }

    if (!purchaseData) {
      return Response.json({ 
        success: false, 
        error: 'Failed to verify purchase with Google Play' 
      }, { status: 400 });
    }

    // Map product ID to subscription type
    const subscriptionType = PRODUCT_MAPPING[productId];
    
    if (!subscriptionType) {
      return Response.json({ 
        success: false, 
        error: 'Unknown product ID' 
      }, { status: 400 });
    }

    // Update user subscription
    const updateData = {
      subscription_type: subscriptionType,
      google_play_purchase_token: purchaseToken,
      google_play_order_id: purchaseData.orderId
    };

    // Add expiry date for subscriptions
    if (purchaseData.expiryTimeMillis) {
      updateData.subscription_expires_at = new Date(parseInt(purchaseData.expiryTimeMillis)).toISOString();
    }

    await base44.asServiceRole.entities.User.update(user.id, updateData);

    console.log('Google Play IAP successful:', { 
      userId: user.id, 
      subscriptionType,
      orderId: purchaseData.orderId 
    });

    return Response.json({ 
      success: true, 
      subscription_type: subscriptionType 
    });

  } catch (error) {
    console.error('Google Play IAP error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

async function verifySubscription(subscriptionId, purchaseToken) {
  try {
    const client = await getAuthenticatedClient();
    
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`;
    
    const response = await client.request({ url });
    
    console.log('Subscription verification response:', response.data);
    
    // Check if subscription is active
    if (response.data.paymentState !== 1 && response.data.paymentState !== 2) {
      console.error('Subscription not paid');
      return null;
    }
    
    return {
      orderId: response.data.orderId,
      expiryTimeMillis: response.data.expiryTimeMillis,
      paymentState: response.data.paymentState
    };
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return null;
  }
}

async function verifyOneTimePurchase(productId, purchaseToken) {
  try {
    const client = await getAuthenticatedClient();
    
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${productId}/tokens/${purchaseToken}`;
    
    const response = await client.request({ url });
    
    console.log('One-time purchase verification response:', response.data);
    
    // Check if purchase is completed
    if (response.data.purchaseState !== 0) {
      console.error('Purchase not completed');
      return null;
    }
    
    return {
      orderId: response.data.orderId,
      purchaseState: response.data.purchaseState
    };
  } catch (error) {
    console.error('Error verifying one-time purchase:', error);
    return null;
  }
}