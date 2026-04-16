import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CREDIT_PACK_MAPPING: Record<string, number> = {
  'com.sportswagerhelper.credits.25': 25,
  'com.sportswagerhelper.credits.60': 60,
  'com.sportswagerhelper.credits.100': 100,
};

const CONSUMABLE_EVENT_TYPES = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
]);

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let body: any = {};

  try {
    const authHeader = req.headers.get('authorization');
    const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

    if (authHeader !== expectedAuth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    body = await req.json();
    const event = body?.event || {};
    const {
      type,
      app_user_id: appUserId,
      product_id: productId,
      transaction_id: transactionId,
      environment,
    } = event;

    if (!CONSUMABLE_EVENT_TYPES.has(type)) {
      return Response.json({ received: true });
    }

    if (!appUserId || !productId || !transactionId) {
      return Response.json({ error: 'Missing required webhook fields' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.PurchaseAudit.filter({
      transaction_id: transactionId,
    });

    if (existing.length > 0) {
      return Response.json({ received: true, duplicate: true });
    }

    const user = await base44.asServiceRole.entities.User.get(appUserId).catch(() => null);
    if (!user) {
      console.log('RevenueCat webhook user not found:', appUserId);
      return Response.json({ received: true });
    }

    const creditsToAdd = CREDIT_PACK_MAPPING[productId];
    if (!creditsToAdd) {
      return Response.json({ error: 'Unknown product ID', productId }, { status: 400 });
    }

    await base44.asServiceRole.entities.PurchaseAudit.create({
      user_email: user.email,
      platform: 'apple',
      product_id: productId,
      transaction_id: transactionId,
      status: 'verified',
      granted_credits: creditsToAdd,
      source: 'revenuecat_webhook',
    });

    const totalCredits = (user.search_credits || 0) + creditsToAdd;

    await base44.asServiceRole.entities.User.update(user.id, {
      search_credits: totalCredits,
    });

    return Response.json({
      received: true,
      creditsAdded: creditsToAdd,
      totalCredits,
    });
  } catch (error) {
    console.error('handleRevenueCatWebhook error:', error);

    try {
      await base44.asServiceRole.entities.ErrorLog.create({
        error_type: 'iap',
        severity: 'error',
        function_name: 'handleRevenueCatWebhook',
        error_message: String(error?.message || error).slice(0, 1000),
        error_stack: String(error?.stack || '').slice(0, 2000),
        context: {
          eventType: body?.event?.type,
          appUserId: body?.event?.app_user_id,
          productId: body?.event?.product_id,
          transactionId: body?.event?.transaction_id,
          environment: body?.event?.environment,
        },
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
