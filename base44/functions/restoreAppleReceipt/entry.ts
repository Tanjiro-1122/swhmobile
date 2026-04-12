import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const APPLE_VERIFY_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';
const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET') || '';
const APP_CORS_ORIGIN = Deno.env.get('APP_CORS_ORIGIN') || 'https://sportswagerhelper.com';

// Product mapping: App Store product IDs to subscription types
const PRODUCT_MAPPING = {
  'com.sportswagerhelper.premium.monthly': 'premium_monthly',
  'com.sportswagerhelper.vip.annual': 'vip_annual',
  'com.sportswagerhelper.legacy': 'legacy',
  // v3 product IDs introduced in a later app version
  'com.sportswagerhelper.premium.monthly.v3': 'premium_monthly',
  'com.sportswagerhelper.premium.annual.v3': 'vip_annual',
  'com.sportswagerhelper.vip.annual.v3': 'vip_annual'
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': APP_CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

async function validateReceiptWithApple(receiptBase64) {
  const body = {
    'receipt-data': receiptBase64,
    password: APPLE_SHARED_SECRET,
    'exclude-old-transactions': false
  };

  let resp = await fetch(APPLE_VERIFY_URL, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  let data = await resp.json();
  
  // Handle sandbox receipts (TestFlight)
  if (data.status === 21007) {
    resp = await fetch(APPLE_VERIFY_SANDBOX, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    data = await resp.json();
  }
  
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    let currentUser;
    try {
      currentUser = await base44.auth.me();
    } catch (authErr) {
      return Response.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401, headers: corsHeaders() });
    }

    const body = await req.json();
    const { receiptBase64 } = body || {};

    if (!receiptBase64) {
      return Response.json({ 
        success: false, 
        error: 'Missing receipt data' 
      }, { status: 400, headers: corsHeaders() });
    }

    // Validate receipt with Apple
    const validation = await validateReceiptWithApple(receiptBase64);
    
    if (validation.status !== 0) {
      return Response.json({ 
        success: false, 
        error: 'Receipt validation failed',
        appleStatus: validation.status,
        message: getAppleStatusMessage(validation.status)
      }, { status: 400, headers: corsHeaders() });
    }

    // Extract latest receipt info
    const latestInfo = validation.latest_receipt_info || validation.receipt?.in_app || [];
    
    // Find active subscription
    const active = latestInfo
      .filter(p => {
        const expMs = Number(p.expires_date_ms || p.expires_date);
        return !isNaN(expMs) && expMs > Date.now();
      })
      .sort((a, b) => {
        const aExp = Number(a.expires_date_ms || a.expires_date);
        const bExp = Number(b.expires_date_ms || b.expires_date);
        return bExp - aExp; // Most recent first
      })[0];

    if (!active) {
      return Response.json({ 
        success: false, 
        error: 'No active subscription found in receipt' 
      }, { status: 200, headers: corsHeaders() });
    }

    const originalTransactionId = active.original_transaction_id || active.transaction_id;
    const productId = active.product_id;
    const expiresAt = new Date(Number(active.expires_date_ms || active.expires_date));
    const purchaseDate = new Date(Number(active.purchase_date_ms || active.purchase_date));

    // Map product ID to subscription type
    const subscriptionType = PRODUCT_MAPPING[productId] || 'premium_monthly';

    // Check if this purchase already exists
    const existingPurchases = await base44.asServiceRole.entities.PurchaseAudit.filter({
      transaction_id: originalTransactionId,
      platform: 'apple'
    });

    let purchaseRecord;
    if (existingPurchases.length > 0) {
      // Update existing purchase
      purchaseRecord = existingPurchases[0];
      await base44.asServiceRole.entities.PurchaseAudit.update(purchaseRecord.id, {
        user_email: currentUser.email,
        status: 'verified',
        granted_subscription: subscriptionType,
        verification_result: validation
      });
    } else {
      // Create new purchase record
      purchaseRecord = await base44.asServiceRole.entities.PurchaseAudit.create({
        user_email: currentUser.email,
        platform: 'apple',
        product_id: productId,
        transaction_id: originalTransactionId,
        status: 'verified',
        granted_subscription: subscriptionType,
        verification_result: validation
      });
    }

    // Update user subscription
    await base44.asServiceRole.entities.User.update(currentUser.id, {
      subscription_type: subscriptionType,
      subscription_expires_at: expiresAt.toISOString(),
      apple_original_transaction_id: originalTransactionId,
      last_subscription_update: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      subscription: {
        type: subscriptionType,
        expiresAt: expiresAt.toISOString(),
        purchaseDate: purchaseDate.toISOString(),
        productId: productId
      }
    }, { status: 200, headers: corsHeaders() });

  } catch (error) {
    console.error('restoreAppleReceipt error:', error);
    
    // Log sanitized error
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'iap',
        severity: 'error',
        function_name: 'restoreAppleReceipt',
        error_message: String(error.message || error).slice(0, 1000),
        error_stack: String(error.stack || '').slice(0, 2000)
      });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }
    
    return Response.json({ 
      success: false, 
      error: 'Server error during receipt validation' 
    }, { status: 500, headers: corsHeaders() });
  }
});

function getAppleStatusMessage(status) {
  const messages = {
    21000: 'The App Store could not read the JSON object you provided.',
    21002: 'The data in the receipt-data property was malformed or missing.',
    21003: 'The receipt could not be authenticated.',
    21004: 'The shared secret you provided does not match the shared secret on file.',
    21005: 'The receipt server is not currently available.',
    21006: 'This receipt is valid but expired.',
    21007: 'This receipt is from the test environment.',
    21008: 'This receipt is from the production environment.',
    21010: 'This receipt could not be authorized.'
  };
  return messages[status] || `Unknown status code: ${status}`;
}