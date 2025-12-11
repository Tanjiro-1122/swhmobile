import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Apple Receipt Verification URLs
const PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

// Map Apple Product IDs to subscription types
const PRODUCT_MAPPING = {
  'com.sportswagerhelper.premium.monthly': 'premium_monthly',
  'com.sportswagerhelper.vip.annual': 'vip_annual',
  'com.sportswagerhelper.premium.monthly.v3': 'premium_monthly',
  'com.sportswagerhelper.premium.annual.v3': 'vip_annual',
  'com.sportswagerhelper.vip.annual.v3': 'vip_annual'
};

// Map consumable product IDs to credit amounts
const CREDIT_PACK_MAPPING = {
  'com.sportswagerhelper.credits.25': 25,
  'com.sportswagerhelper.credits.60': 60,
  'com.sportswagerhelper.credits.100': 100
};

Deno.serve(async (req) => {
  let body = {};
  let base44;
  
  try {
    base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    body = await req.json();
    const { receipt, productId, isServerNotification, action } = body;

    // Handle activatePending request (when only pending marker exists)
    if (action === 'activatePending') {
      return await handleActivatePending(base44, user, body);
    }

    // Handle server-to-server notifications from Apple
    if (isServerNotification) {
      return await handleServerNotification(base44, body);
    }

    // Validate receipt with Apple
    const validationResult = await validateReceipt(receipt);

    if (!validationResult.success) {
      // Create failed audit record
      await base44.asServiceRole.entities.PurchaseAudit.create({
        user_email: user.email,
        platform: 'apple',
        product_id: productId || 'unknown',
        status: 'failed',
        error_message: validationResult.error
      });
      
      return Response.json({ 
        error: 'Receipt validation failed',
        details: validationResult.error 
      }, { status: 400 });
    }

    // Check if receipt/transaction already processed (idempotency)
    const existing = await base44.asServiceRole.entities.Receipt.filter({
      transaction_id: validationResult.transactionId
    });
    
    if (existing.length > 0) {
      return Response.json({ success: true, message: 'Receipt already processed' });
    }

    // Create audit record (Receipt entity)
    await base44.asServiceRole.entities.Receipt.create({
      transaction_id: validationResult.transactionId,
      original_transaction_id: validationResult.originalTransactionId,
      product_id: validationResult.productId,
      user_id: user.id,
      platform: 'apple',
      raw: JSON.stringify(validationResult.raw || {})
    });

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

      // Create successful audit record
      await base44.asServiceRole.entities.PurchaseAudit.create({
        user_email: user.email,
        platform: 'apple',
        product_id: validationResult.productId,
        transaction_id: validationResult.transactionId,
        status: 'verified',
        granted_credits: creditsToAdd
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

    // Check if user already has active subscription (prevent duplicate grants)
    const currentExpiry = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const newExpiry = validationResult.expiresDate ? new Date(validationResult.expiresDate) : null;
    
    // Only update if new subscription or if new expiry is later
    if (!currentExpiry || !newExpiry || newExpiry > currentExpiry) {
      await base44.asServiceRole.entities.User.update(user.id, {
        subscription_type: subscriptionType,
        apple_transaction_id: validationResult.transactionId,
        apple_original_transaction_id: validationResult.originalTransactionId,
        subscription_expires_at: validationResult.expiresDate,
        subscription_source: 'apple'
      });
    }

    // Create successful audit record
    await base44.asServiceRole.entities.PurchaseAudit.create({
      user_email: user.email,
      platform: 'apple',
      product_id: validationResult.productId,
      transaction_id: validationResult.transactionId,
      status: 'verified',
      granted_subscription: subscriptionType,
      verification_result: validationResult.raw
    });

    return Response.json({
      success: true,
      type: 'subscription',
      subscriptionType,
      expiresDate: validationResult.expiresDate
    });

  } catch (error) {
    console.error('Apple IAP Error:', error);
    
    // Log error to database
    try {
      if (base44) {
        await base44.asServiceRole.entities.ErrorLog.create({
          error_type: 'iap',
          severity: 'error',
          function_name: 'handleAppleIAP',
          error_message: error.message,
          error_stack: error.stack,
          context: { 
            action: body?.action,
            productId: body?.productId,
            platform: 'apple'
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});

// Validate receipt with Apple servers
async function validateReceipt(receiptData) {
  try {
    const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
    const expectedBundleId = Deno.env.get('APPLE_BUNDLE_ID') || 'com.SportsWagerHelper.app';

    if (!sharedSecret) {
      return { success: false, error: 'APPLE_SHARED_SECRET not configured' };
    }

    async function callApple(url) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receiptData,
          password: sharedSecret,
          'exclude-old-transactions': false
        })
      });
      return res.json();
    }

    let result = await callApple(PRODUCTION_URL);

    // Fallback to sandbox if needed
    if (result.status === 21007) {
      result = await callApple(SANDBOX_URL);
    }

    if (result.status !== 0) {
      return { 
        success: false, 
        error: `Apple validation failed with status ${result.status}` 
      };
    }

    const receipt = result.receipt;
    if (!receipt) {
      return { success: false, error: 'No receipt returned', raw: result };
    }

    // Validate bundle ID
    if (expectedBundleId && receipt.bundle_id && receipt.bundle_id !== expectedBundleId) {
      return { 
        success: false, 
        error: 'Receipt bundle_id mismatch', 
        bundle_id: receipt.bundle_id 
      };
    }

    // Get all purchases and sort by most recent
    const purchases = [...(result.latest_receipt_info || []), ...(receipt.in_app || [])];
    if (!purchases.length) {
      return { success: false, error: 'No in_app purchases found', raw: result };
    }

    purchases.sort((a, b) => {
      const aTime = parseInt(a.expires_date_ms || a.purchase_date_ms || '0', 10);
      const bTime = parseInt(b.expires_date_ms || b.purchase_date_ms || '0', 10);
      return bTime - aTime;
    });

    const matched = purchases[0];

    return {
      success: true,
      productId: matched.product_id,
      transactionId: matched.transaction_id,
      originalTransactionId: matched.original_transaction_id,
      expiresDate: matched.expires_date_ms 
        ? new Date(parseInt(matched.expires_date_ms, 10)).toISOString()
        : null,
      raw: matched
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle activation when only pending marker exists
async function handleActivatePending(base44, user, body) {
  try {
    const { productId } = body;
    
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
      platform: 'apple'
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
    
    // Determine subscription type from product ID
    const PRODUCT_MAPPING = {
      'com.sportswagerhelper.premium.monthly': 'premium_monthly',
      'com.sportswagerhelper.vip.annual': 'vip_annual',
      'com.sportswagerhelper.premium.monthly.v3': 'premium_monthly',
      'com.sportswagerhelper.premium.annual.v3': 'vip_annual',
      'com.sportswagerhelper.vip.annual.v3': 'vip_annual'
    };
    
    const subscriptionType = PRODUCT_MAPPING[productId];
    if (!subscriptionType) {
      return Response.json({ 
        error: 'Unknown product ID',
        success: false 
      }, { status: 400 });
    }
    
    // Activate subscription
    await base44.asServiceRole.entities.User.update(user.id, {
      subscription_type: subscriptionType,
      apple_transaction_id: receipt.transaction_id,
      apple_original_transaction_id: receipt.original_transaction_id,
      subscription_source: 'apple'
    });
    
    return Response.json({ 
      success: true,
      subscriptionType 
    });
    
  } catch (error) {
    console.error('Activate pending error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
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