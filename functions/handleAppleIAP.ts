import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Apple App Store Receipt Validation URLs
const PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

// Map Apple product IDs to Base44 subscription types
// TODO: Replace these with your actual Apple product IDs from App Store Connect
const PRODUCT_ID_MAPPING = {
  'com.sportswagerhelper.premium.monthly': 'premium_monthly',
  'com.sportswagerhelper.vip.annual': 'vip_annual',
  // Add more mappings as needed
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
    const { receiptData, transactionReceipt, isServerNotification } = body;

    // Handle server-to-server notifications from Apple
    if (isServerNotification) {
      return await handleServerNotification(base44, body);
    }

    // Validate receipt with Apple
    const validationResult = await validateReceipt(receiptData || transactionReceipt);

    if (!validationResult.success) {
      return Response.json({ 
        error: 'Receipt validation failed', 
        details: validationResult.error 
      }, { status: 400 });
    }

    // Extract product ID from the receipt
    const productId = validationResult.productId;
    const subscriptionType = PRODUCT_ID_MAPPING[productId];

    if (!subscriptionType) {
      return Response.json({ 
        error: 'Unknown product ID', 
        productId 
      }, { status: 400 });
    }

    // Update user's subscription type in Base44
    await base44.asServiceRole.entities.User.update(user.id, {
      subscription_type: subscriptionType
    });

    return Response.json({
      success: true,
      subscriptionType,
      productId,
      expiresDate: validationResult.expiresDate,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Apple IAP error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});

async function validateReceipt(receiptData) {
  try {
    // First try production
    let response = await fetch(PRODUCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': Deno.env.get('APPLE_SHARED_SECRET') || '', // Optional: for auto-renewable subscriptions
        'exclude-old-transactions': true
      })
    });

    let data = await response.json();

    // If production returns sandbox receipt error, try sandbox
    if (data.status === 21007) {
      response = await fetch(SANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receiptData,
          'password': Deno.env.get('APPLE_SHARED_SECRET') || '',
          'exclude-old-transactions': true
        })
      });
      data = await response.json();
    }

    // Status 0 means receipt is valid
    if (data.status === 0) {
      const latestReceipt = data.latest_receipt_info?.[0] || data.receipt?.in_app?.[0];
      
      if (!latestReceipt) {
        return { success: false, error: 'No receipt info found' };
      }

      return {
        success: true,
        productId: latestReceipt.product_id,
        transactionId: latestReceipt.transaction_id,
        expiresDate: latestReceipt.expires_date_ms 
          ? new Date(parseInt(latestReceipt.expires_date_ms)).toISOString() 
          : null,
        originalTransactionId: latestReceipt.original_transaction_id
      };
    }

    // Receipt validation failed
    return {
      success: false,
      error: `Apple validation failed with status ${data.status}`,
      status: data.status
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function handleServerNotification(base44, notificationData) {
  try {
    // Apple sends notifications for subscription events
    // notification_type can be: INITIAL_BUY, DID_RENEW, DID_CHANGE_RENEWAL_STATUS, CANCEL, etc.
    
    const { notification_type, unified_receipt } = notificationData;
    const latestReceipt = unified_receipt?.latest_receipt_info?.[0];

    if (!latestReceipt) {
      return Response.json({ error: 'No receipt in notification' }, { status: 400 });
    }

    const productId = latestReceipt.product_id;
    const subscriptionType = PRODUCT_ID_MAPPING[productId];
    const originalTransactionId = latestReceipt.original_transaction_id;

    // Find user by transaction ID (you'd need to store this during initial purchase)
    // For now, we'll use the approach of storing transaction ID in user metadata
    const users = await base44.asServiceRole.entities.User.list();
    const user = users.find(u => u.apple_transaction_id === originalTransactionId);

    if (!user) {
      console.error('User not found for transaction:', originalTransactionId);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle different notification types
    switch (notification_type) {
      case 'INITIAL_BUY':
      case 'DID_RENEW':
      case 'INTERACTIVE_RENEWAL':
        // Activate subscription
        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_type: subscriptionType
        });
        break;

      case 'CANCEL':
      case 'DID_CHANGE_RENEWAL_PREF':
        // Check if subscription is still active
        const expiresDate = new Date(parseInt(latestReceipt.expires_date_ms));
        if (expiresDate < new Date()) {
          // Subscription expired, downgrade to free
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_type: 'free'
          });
        }
        break;

      case 'REFUND':
        // Revoke subscription immediately
        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_type: 'free'
        });
        break;
    }

    return Response.json({ success: true, notification_type });

  } catch (error) {
    console.error('Server notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}