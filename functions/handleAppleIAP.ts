import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Apple Receipt Verification URLs
const PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

// Map Apple Product IDs to subscription types
const PRODUCT_MAPPING = {
  'com.sportswagerhelper.premium.monthly': 'premium_monthly',
  'com.sportswagerhelper.vip.annual': 'vip_annual',
  'com.sportswagerhelper.premium.monthly.v3': 'premium_monthly',
  'com.sportswagerhelper.premium.annual.v3': 'vip_annual'
};

// Map consumable product IDs to credit amounts
const CREDIT_PACK_MAPPING = {
  'com.sportswagerhelper.credits.25': 25,
  'com.sportswagerhelper.credits.60': 60,
  'com.sportswagerhelper.credits.100': 100
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { receipt, productId, isServerNotification } = body;

    // Handle server-to-server notifications from Apple
    if (isServerNotification) {
      return await handleServerNotification(base44, body);
    }

    // Validate receipt with Apple
    const validationResult = await validateReceipt(receipt);

    if (!validationResult.success) {
      return Response.json({ 
        error: 'Receipt validation failed',
        details: validationResult.error 
      }, { status: 400 });
    }

    // Check if this is a consumable (credit pack) or subscription
    const creditsToAdd = CREDIT_PACK_MAPPING[validationResult.productId];
    const subscriptionType = PRODUCT_MAPPING[validationResult.productId];
    
    if (creditsToAdd) {
      // Handle consumable credit pack purchase
      const currentCredits = user.search_credits || 0;
      const newCredits = currentCredits + creditsToAdd;
      
      await base44.asServiceRole.entities.User.update(user.id, {
        search_credits: newCredits
      });

      return Response.json({
        success: true,
        type: 'credits',
        creditsAdded: creditsToAdd,
        totalCredits: newCredits
      });
    }
    
    if (!subscriptionType) {
      return Response.json({ 
        error: 'Unknown product ID',
        productId: validationResult.productId 
      }, { status: 400 });
    }

    // Update user subscription
    await base44.asServiceRole.entities.User.update(user.id, {
      subscription_type: subscriptionType,
      apple_transaction_id: validationResult.transactionId,
      apple_original_transaction_id: validationResult.originalTransactionId,
      subscription_expires_at: validationResult.expiresDate,
      subscription_source: 'apple'
    });

    return Response.json({
      success: true,
      type: 'subscription',
      subscriptionType,
      expiresDate: validationResult.expiresDate
    });

  } catch (error) {
    console.error('Apple IAP Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});

// Validate receipt with Apple servers
async function validateReceipt(receiptData) {
  try {
    // Get shared secret from environment
    const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
    
    // Try production first
    let response = await fetch(PRODUCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': sharedSecret, // Required for auto-renewable subscriptions
        'exclude-old-transactions': true
      })
    });

    let result = await response.json();

    // If production returns sandbox receipt error, try sandbox
    if (result.status === 21007) {
      response = await fetch(SANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receiptData,
          'password': sharedSecret,
          'exclude-old-transactions': true
        })
      });
      result = await response.json();
    }

    // Check if validation succeeded
    if (result.status !== 0) {
      return {
        success: false,
        error: `Apple validation failed with status ${result.status}`
      };
    }

    // Extract purchase info
    const latestReceipt = result.latest_receipt_info?.[0] || result.receipt?.in_app?.[0];
    
    if (!latestReceipt) {
      return {
        success: false,
        error: 'No purchase information found in receipt'
      };
    }

    return {
      success: true,
      productId: latestReceipt.product_id,
      transactionId: latestReceipt.transaction_id,
      originalTransactionId: latestReceipt.original_transaction_id,
      expiresDate: latestReceipt.expires_date_ms 
        ? new Date(parseInt(latestReceipt.expires_date_ms)).toISOString()
        : null
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Handle Apple server-to-server notifications
async function handleServerNotification(base44, notificationData) {
  try {
    const { notification_type, unified_receipt } = notificationData;
    
    if (!unified_receipt) {
      return Response.json({ error: 'No receipt in notification' }, { status: 400 });
    }

    const latestReceipt = unified_receipt.latest_receipt_info?.[0];
    if (!latestReceipt) {
      return Response.json({ error: 'No receipt info' }, { status: 400 });
    }

    const originalTransactionId = latestReceipt.original_transaction_id;
    const productId = latestReceipt.product_id;
    const expiresDate = latestReceipt.expires_date_ms 
      ? new Date(parseInt(latestReceipt.expires_date_ms))
      : null;

    // Find user by original transaction ID
    const users = await base44.asServiceRole.entities.User.filter({
      apple_original_transaction_id: originalTransactionId
    });

    if (users.length === 0) {
      console.log('User not found for transaction:', originalTransactionId);
      return Response.json({ received: true });
    }

    const user = users[0];
    const subscriptionType = PRODUCT_MAPPING[productId];

    // Handle different notification types
    switch (notification_type) {
      case 'INITIAL_BUY':
      case 'DID_RENEW':
        // Activate/renew subscription
        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_type: subscriptionType,
          subscription_expires_at: expiresDate?.toISOString(),
          subscription_source: 'apple'
        });
        break;

      case 'CANCEL':
      case 'DID_FAIL_TO_RENEW':
      case 'REFUND':
        // Check if subscription is expired
        if (expiresDate && expiresDate < new Date()) {
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_type: 'free',
            subscription_expires_at: null
          });
        }
        break;

      default:
        console.log('Unhandled notification type:', notification_type);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Server notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}