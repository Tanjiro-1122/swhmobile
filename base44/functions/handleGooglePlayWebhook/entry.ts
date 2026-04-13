import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { GoogleAuth } from 'npm:google-auth-library@9.4.1';

// Map Google Play Product IDs to subscription types
const PRODUCT_MAPPING = {
  'com.sportswagerhelper.premium.monthly': 'premium_monthly',
  'com.sportswagerhelper.vip.annual': 'vip_annual'
};

// Map consumable credit-pack product IDs to credit amounts
const CREDIT_PACK_MAPPING = {
  'com.sportswagerhelper.credits.25': 25,
  'com.sportswagerhelper.credits.60': 60,
  'com.sportswagerhelper.credits.100': 100
};

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

// Package name for your app
const PACKAGE_NAME = 'com.wnapp.id1761803023263';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Parse Pub/Sub message
    const body = await req.json();
    const message = body.message;

    if (!message || !message.data) {
      return Response.json({ error: 'Invalid Pub/Sub message' }, { status: 400 });
    }

    // Decode base64 message data
    const decodedData = atob(message.data);
    const notification = JSON.parse(decodedData);

    console.log('Received Google Play notification:', notification);

    // Handle subscription notification
    if (notification.subscriptionNotification) {
      await handleSubscriptionNotification(base44, notification.subscriptionNotification);
    }

    // Handle one-time product notification
    if (notification.oneTimeProductNotification) {
      await handleOneTimeProductNotification(base44, notification.oneTimeProductNotification);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Google Play webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleSubscriptionNotification(base44, notification) {
  const { subscriptionId, purchaseToken, notificationType } = notification;

  // Get subscription details from Google Play
  const subscriptionData = await verifySubscription(subscriptionId, purchaseToken);

  if (!subscriptionData) {
    console.error('Failed to verify subscription');
    return;
  }

  // Find user by purchase token
  const users = await base44.asServiceRole.entities.User.filter({
    google_play_purchase_token: purchaseToken
  });

  let user;
  if (users.length > 0) {
    user = users[0];
  } else {
    // Try to find by email in developer payload
    const payload = subscriptionData.obfuscatedExternalAccountId;
    if (payload) {
      const usersByEmail = await base44.asServiceRole.entities.User.filter({
        email: payload
      });
      if (usersByEmail.length > 0) {
        user = usersByEmail[0];
      }
    }
  }

  if (!user) {
    // User not found — this can happen when the webhook fires before
    // handleGooglePlayIAP runs (race condition on first purchase).
    // Create a pending audit record so an admin can manually activate if needed.
    console.error('User not found for purchase token:', purchaseToken, '— creating pending audit record');
    try {
      const subscriptionType = PRODUCT_MAPPING[subscriptionId];
      await base44.asServiceRole.entities.PurchaseAudit.create({
        platform: 'android',
        product_id: subscriptionId,
        purchase_token: purchaseToken,
        transaction_id: subscriptionData.orderId,
        status: 'failed',
        error_message: `Webhook received but no user found for purchaseToken. notificationType=${notificationType}`,
        granted_subscription: subscriptionType || null,
      });
    } catch (auditErr) {
      console.error('Failed to create audit record for missing user:', auditErr);
    }
    return;
  }

  const subscriptionType = PRODUCT_MAPPING[subscriptionId];

  if (!subscriptionType) {
    console.error('Unknown product ID:', subscriptionId);
    return;
  }

  // Handle notification types
  switch (notificationType) {
    case 1: // SUBSCRIPTION_RECOVERED
    case 2: // SUBSCRIPTION_RENEWED
    case 4: // SUBSCRIPTION_PURCHASED
      // Activate subscription
      await base44.asServiceRole.entities.User.update(user.id, {
        subscription_type: subscriptionType,
        google_play_purchase_token: purchaseToken,
        google_play_order_id: subscriptionData.orderId,
        subscription_expires_at: new Date(parseInt(subscriptionData.expiryTimeMillis)).toISOString()
      });
      break;

    case 3: // SUBSCRIPTION_CANCELED
    case 13: // SUBSCRIPTION_EXPIRED
      // Check if subscription is actually expired
      const expiryTime = parseInt(subscriptionData.expiryTimeMillis);
      if (expiryTime < Date.now()) {
        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_type: 'free',
          subscription_expires_at: null
        });
      }
      break;

    case 12: // SUBSCRIPTION_REVOKED
      // Immediately revoke access
      await base44.asServiceRole.entities.User.update(user.id, {
        subscription_type: 'free',
        subscription_expires_at: null
      });
      break;
  }
}

async function handleOneTimeProductNotification(base44, notification) {
  const { sku, purchaseToken, notificationType } = notification;

  if (notificationType === 1) { // ONE_TIME_PRODUCT_PURCHASED
    // Verify the purchase
    const purchaseData = await verifyOneTimePurchase(sku, purchaseToken);

    if (!purchaseData) {
      console.error('Failed to verify one-time purchase');
      return;
    }

    // Find user and grant access
    const payload = purchaseData.obfuscatedExternalAccountId;
    if (payload) {
      const users = await base44.asServiceRole.entities.User.filter({
        email: payload
      });

      if (users.length > 0) {
        const user = users[0];

        // Check if this is a credit-pack purchase first
        const creditsToAdd = CREDIT_PACK_MAPPING[sku];
        if (creditsToAdd) {
          const currentCredits = user.search_credits || 0;
          await base44.asServiceRole.entities.User.update(user.id, {
            search_credits: currentCredits + creditsToAdd,
            google_play_purchase_token: purchaseToken,
            google_play_order_id: purchaseData.orderId
          });
          console.log(`Granted ${creditsToAdd} credits to user ${user.id} (total: ${currentCredits + creditsToAdd})`);
          return;
        }

        // Otherwise treat as a subscription product
        const subscriptionType = PRODUCT_MAPPING[sku];
        if (subscriptionType) {
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_type: subscriptionType,
            google_play_purchase_token: purchaseToken,
            google_play_order_id: purchaseData.orderId
          });
        } else {
          console.error('Unknown one-time product SKU:', sku);
        }
      }
    }
  }
}

async function verifySubscription(subscriptionId, purchaseToken) {
  try {
    const client = await getAuthenticatedClient();
    
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`;
    
    const response = await client.request({ url });
    
    console.log('Subscription verification response:', response.data);
    
    return {
      orderId: response.data.orderId,
      expiryTimeMillis: response.data.expiryTimeMillis,
      obfuscatedExternalAccountId: response.data.obfuscatedExternalAccountId
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
    
    return {
      orderId: response.data.orderId,
      obfuscatedExternalAccountId: response.data.obfuscatedExternalAccountId
    };
  } catch (error) {
    console.error('Error verifying one-time purchase:', error);
    return null;
  }
}