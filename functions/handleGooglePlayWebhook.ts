import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Map Google Play Product IDs to subscription types
const PRODUCT_MAPPING = {
  'com.sportswagerhelper.premium.monthly': 'premium_monthly',
  'com.sportswagerhelper.vip.annual': 'vip_annual'
};

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

  // Find user by order ID or email stored in obfuscatedExternalAccountId
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
    console.error('User not found for purchase token:', purchaseToken);
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
        const subscriptionType = PRODUCT_MAPPING[sku];

        if (subscriptionType) {
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_type: subscriptionType,
            google_play_purchase_token: purchaseToken,
            google_play_order_id: purchaseData.orderId
          });
        }
      }
    }
  }
}

async function verifySubscription(subscriptionId, purchaseToken) {
  // TODO: Implement Google Play Developer API verification
  // This requires Google Play Developer API credentials
  
  // For now, return a mock response
  // You'll need to implement actual API verification using googleapis
  console.warn('Subscription verification not implemented - using mock data');
  
  return {
    orderId: 'mock-order-id',
    expiryTimeMillis: String(Date.now() + 30 * 24 * 60 * 60 * 1000),
    obfuscatedExternalAccountId: null
  };
}

async function verifyOneTimePurchase(productId, purchaseToken) {
  // TODO: Implement Google Play Developer API verification
  console.warn('One-time purchase verification not implemented - using mock data');
  
  return {
    orderId: 'mock-order-id',
    obfuscatedExternalAccountId: null
  };
}