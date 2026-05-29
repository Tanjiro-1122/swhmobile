// api/handleRevenueCatWebhook.js — Supabase version
// Webhook 1 (SWH Sales): https://sports-wager-helper.vercel.app/api/handleRevenueCatWebhook
// Webhook 2 (Rune II dashboard): https://runeii.vercel.app/api/webhooks/revenuecat
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.RUNE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PRODUCT_CREDITS = {
  "com.sportswagerhelper.credits.25":  25,
  "com.sportswagerhelper.credits.60":  60,
  "com.sportswagerhelper.credits.100": 100,
};

const SUBSCRIPTION_IDS = [
  "com.sportswagerhelper.monthly",
  "com.sportswagerhelper.annual",
  "swh_pro_monthly",
  "swh_pro_annual",
];

async function findUser(appUserId, email) {
  if (appUserId) {
    const { data } = await supabase
      .from('swh_users')
      .select('*')
      .eq('apple_user_id', appUserId)
      .single();
    if (data) return data;
  }
  if (email) {
    const { data } = await supabase
      .from('swh_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    if (data) return data;
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const event = req.body?.event || req.body || {};
    const eventType = event.type || event.event_type || '';
    const appUserId = event.app_user_id || event.original_app_user_id || '';
    const email = event.subscriber_attributes?.email?.value || event.email || '';
    const productId = event.product_id || '';
    const transactionId = event.transaction_id || event.id || '';

    console.log(`[RC Webhook] event=${eventType} user=${appUserId} product=${productId}`);

    const user = await findUser(appUserId, email);

    // Log all webhook events to purchase_audit — fix: use try/catch not .catch()
    try {
      await supabase.from('swh_purchase_audit').insert({
        apple_user_id: appUserId || null,
        user_email: email || null,
        product_id: productId,
        transaction_id: transactionId || null,
        status: eventType,
        platform: 'ios',
        currency: event.currency || 'USD',
        amount: event.price || null,
        raw_receipt: JSON.stringify(event).slice(0, 2000),
      });
    } catch (auditErr) {
      console.warn('[RC Webhook] audit insert warning:', auditErr.message);
    }

    if (!user) {
      console.warn(`[RC Webhook] User not found: ${appUserId} / ${email}`);
      return res.status(200).json({ received: true, warning: 'user not found' });
    }

    // Handle credit purchases
    if (PRODUCT_CREDITS[productId] && ['INITIAL_PURCHASE', 'NON_SUBSCRIPTION_PURCHASE'].includes(eventType)) {
      const creditsToAdd = PRODUCT_CREDITS[productId];
      const newCredits = (user.credits || 0) + creditsToAdd;
      await supabase
        .from('swh_users')
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      console.log(`[RC Webhook] +${creditsToAdd} credits to ${appUserId} (total: ${newCredits})`);
    }

    // Handle subscription events
    const isSubscription = SUBSCRIPTION_IDS.includes(productId) ||
      SUBSCRIPTION_IDS.some(s => productId.includes(s.split('.').pop()));

    if (isSubscription) {
      const isAnnual = productId.includes('annual');
      const updates = {};

      if (['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION'].includes(eventType)) {
        updates.is_pro = true;
        updates.subscription_type = isAnnual ? 'annual' : 'monthly';
      } else if (['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'].includes(eventType)) {
        updates.is_pro = false;
        updates.subscription_type = 'free';
      }

      if (Object.keys(updates).length) {
        updates.updated_at = new Date().toISOString();
        await supabase.from('swh_users').update(updates).eq('id', user.id);
        console.log('[RC Webhook] subscription update:', updates, 'for', appUserId);
      }
    }

    return res.status(200).json({ received: true, eventType, userId: user.id });
  } catch (err) {
    console.error('[RC Webhook] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
