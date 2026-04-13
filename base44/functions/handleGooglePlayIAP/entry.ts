import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleAuth } from 'npm:google-auth-library@9.4.1';

// Map Google Play Product IDs to subscription types
const PRODUCT_MAPPING = {
  'com.sportswagerhelper.premium.monthly': 'premium_monthly',
  'com.sportswagerhelper.vip.annual': 'vip_annual'
};

// Map credit product IDs to credit amounts
const CREDIT_MAPPING = {
  'com.sportswagerhelper.credits.25': 25,
  'com.sportswagerhelper.credits.60': 60,
  'com.sportswagerhelper.credits.100': 100
};

// Package name for your app
const PACKAGE_NAME = Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME') || 'com.wnapp.id1761803023263';

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
  let body = {};
  let base44;
  
  try {
    base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    body = await req.json();
    const { purchaseToken, productId, action } = body;
    
    // Handle activatePending request
    if (action === 'activatePending') {
      return await handleActivatePending(base44, user, productId);
    }

    if (!purchaseToken || !productId) {
      return Response.json({ 
        success: false, 
        error: 'Missing purchaseToken or productId' 
      }, { status: 400 });
    }

    console.log('Processing Google Play IAP:', { productId, userEmail: user.email });

    // Save the purchase token to the user record immediately so the Google Play
    // Real-Time Developer Notifications webhook can look up this user even if
    // it fires before verification completes (race condition).
    try {
      await base44.asServiceRole.entities.User.update(user.id, {
        google_play_purchase_token: purchaseToken,
        google_play_product_id: productId,
      });
    } catch (tokenSaveErr) {
      console.warn('Failed to save purchase token early:', tokenSaveErr);
    }

    // Determine purchase type
    const isSubscription = productId.includes('monthly') || productId.includes('annual');
    const isCredits = productId.includes('credits');
    
    let purchaseData;
    
    if (isSubscription) {
      purchaseData = await verifySubscription(productId, purchaseToken);
    } else {
      purchaseData = await verifyOneTimePurchase(productId, purchaseToken);
    }

    if (!purchaseData) {
      // Create failed audit record
      await base44.asServiceRole.entities.PurchaseAudit.create({
        user_email: user.email,
        platform: 'android',
        product_id: productId,
        purchase_token: purchaseToken,
        status: 'failed',
        error_message: 'Failed to verify purchase with Google Play'
      });
      
      return Response.json({ 
        success: false, 
        error: 'Failed to verify purchase with Google Play' 
      }, { status: 400 });
    }

    // Check if purchase already processed (idempotency)
    const existing = await base44.asServiceRole.entities.Receipt.filter({
      google_play_order_id: purchaseData.orderId
    });
    
    if (existing.length > 0) {
      return Response.json({ success: true, message: 'Purchase already processed' });
    }

    // Create audit record (Receipt entity)
    await base44.asServiceRole.entities.Receipt.create({
      google_play_order_id: purchaseData.orderId,
      purchase_token: purchaseToken,
      product_id: productId,
      user_id: user.id,
      platform: 'android',
      raw: JSON.stringify(purchaseData.raw || purchaseData)
    });

    // Handle credit purchases (consumables)
    if (isCredits) {
      const creditsToAdd = CREDIT_MAPPING[productId];
      
      if (!creditsToAdd) {
        return Response.json({ 
          success: false, 
          error: 'Unknown credit product ID' 
        }, { status: 400 });
      }

      // Get current credits and add new ones
      const currentCredits = user.search_credits || 0;
      const newCredits = currentCredits + creditsToAdd;

      // Write audit FIRST — if a crash happens after this but before granting,
      // the audit record exists so admins can see it and manually grant credits.
      await base44.asServiceRole.entities.PurchaseAudit.create({
        user_email: user.email,
        platform: 'android',
        product_id: productId,
        transaction_id: purchaseData.orderId,
        purchase_token: purchaseToken,
        status: 'verified',
        granted_credits: creditsToAdd
      });

      // Grant credits AFTER audit is recorded
      await base44.asServiceRole.entities.User.update(user.id, {
        search_credits: newCredits
      });

      // Acknowledge the purchase (consume it) so it can be purchased again
      await acknowledgePurchase(productId, purchaseToken);

      console.log('Google Play credits purchase successful:', { 
        userId: user.id, 
        creditsAdded: creditsToAdd,
        newBalance: newCredits,
        orderId: purchaseData.orderId 
      });

      return Response.json({ 
        success: true, 
        credits_added: creditsToAdd,
        new_balance: newCredits
      });
    }

    // Handle subscription purchases
    const subscriptionType = PRODUCT_MAPPING[productId];
    
    if (!subscriptionType) {
      return Response.json({ 
        success: false, 
        error: 'Unknown product ID' 
      }, { status: 400 });
    }

    // Check if user already has active subscription (prevent duplicate grants)
    const currentExpiry = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const newExpiry = purchaseData.expiryTimeMillis ? new Date(parseInt(purchaseData.expiryTimeMillis)) : null;
    
    // Only update if new subscription or if new expiry is later
    if (!currentExpiry || !newExpiry || newExpiry > currentExpiry) {
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
    }

    // Create successful audit record
    await base44.asServiceRole.entities.PurchaseAudit.create({
      user_email: user.email,
      platform: 'android',
      product_id: productId,
      transaction_id: purchaseData.orderId,
      purchase_token: purchaseToken,
      status: 'verified',
      granted_subscription: subscriptionType,
      verification_result: purchaseData.raw
    });

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
    
    // Log error to database
    try {
      if (base44) {
        await base44.asServiceRole.entities.ErrorLog.create({
          error_type: 'iap',
          severity: 'error',
          function_name: 'handleGooglePlayIAP',
          error_message: error.message,
          error_stack: error.stack,
          context: { 
            action: body?.action,
            productId: body?.productId,
            platform: 'android'
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

async function handleActivatePending(base44, user, productId) {
  try {
    // Check if user already has active subscription
    if (user.subscription_type && user.subscription_type !== 'free') {
      const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
      if (!expiresAt || expiresAt > new Date()) {
        return Response.json({ success: true, message: 'Subscription already active' });
      }
    }
    
    // Look for recently processed receipt for this user/product
    const recentReceipts = await base44.asServiceRole.entities.Receipt.filter({
      user_id: user.id,
      product_id: productId,
      platform: 'android'
    });
    
    if (recentReceipts.length === 0) {
      return Response.json({ 
        error: 'No receipt found for this product',
        success: false 
      }, { status: 404 });
    }
    
    // Use the most recent receipt
    const receipt = recentReceipts.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )[0];
    
    const creditsToAdd = CREDIT_MAPPING[productId];
    const subscriptionType = PRODUCT_MAPPING[productId];
    
    if (creditsToAdd) {
      const currentCredits = user.search_credits || 0;
      const newCredits = currentCredits + creditsToAdd;
      
      await base44.asServiceRole.entities.User.update(user.id, {
        search_credits: newCredits
      });
      
      return Response.json({
        success: true,
        type: 'credits',
        credits_added: creditsToAdd,
        new_balance: newCredits
      });
    }
    
    if (!subscriptionType) {
      return Response.json({ 
        error: 'Unknown product ID',
        success: false 
      }, { status: 400 });
    }
    
    // Activate subscription
    await base44.asServiceRole.entities.User.update(user.id, {
      subscription_type: subscriptionType,
      google_play_order_id: receipt.google_play_order_id,
      subscription_source: 'google_play'
    });
    
    return Response.json({ 
      success: true,
      subscription_type: subscriptionType 
    });
    
  } catch (error) {
    console.error('Activate pending error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}

async function verifySubscription(subscriptionId, purchaseToken) {
  try {
    const client = await getAuthenticatedClient();
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`;
    const response = await client.request({ url });
    const data = response.data;

    // Check if subscription is active (paymentState: 1 = Payment received, 2 = Free trial)
    if (data && (data.paymentState === 1 || data.paymentState === 2)) {
      return {
        orderId: data.orderId,
        expiryTimeMillis: data.expiryTimeMillis,
        purchaseToken,
        raw: data
      };
    }

    console.error('Subscription invalid or not paid:', data);
    return null;
  } catch (err) {
    console.error('Error verifying subscription:', err);
    return null;
  }
}

async function verifyOneTimePurchase(productId, purchaseToken) {
  try {
    const client = await getAuthenticatedClient();
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${productId}/tokens/${purchaseToken}`;
    const response = await client.request({ url });
    const data = response.data;
    
    // purchaseState 0 = purchased
    if (data && data.purchaseState === 0) {
      return { 
        orderId: data.orderId, 
        purchaseState: data.purchaseState, 
        raw: data 
      };
    }
    
    console.error('One-time purchase not completed or canceled:', data);
    return null;
  } catch (err) {
    console.error('Error verifying one-time purchase:', err);
    return null;
  }
}

async function acknowledgePurchase(productId, purchaseToken) {
  try {
    const client = await getAuthenticatedClient();
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${productId}/tokens/${purchaseToken}:acknowledge`;
    
    await client.request({ 
      url, 
      method: 'POST',
      data: {}
    });
    
    return true;
  } catch (err) {
    console.error('Error acknowledging purchase:', err);
    return false;
  }
}