// api/handleRevenueCatWebhook.js
// Receives webhook events from RevenueCat and updates user credits/subscription in Base44.
// The webhook URL in RevenueCat should be: https://sports-wager-helper.vercel.app/api/handleRevenueCatWebhook

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE  = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_KEY   = process.env.SWH_BASE44_API_KEY || "";

// Map RevenueCat product IDs → credit amounts
const PRODUCT_CREDITS = {
  "com.sportswagerhelper.credits.25":  25,
  "com.sportswagerhelper.credits.60":  60,
  "com.sportswagerhelper.credits.100": 100,
};
// Subscription product IDs
const SUBSCRIPTION_IDS = [
  "com.sportswagerhelper.monthly",
  "com.sportswagerhelper.annual",
  "swh_pro_monthly",
  "swh_pro_annual",
];

function b44Headers() {
  return { "Content-Type": "application/json", "api_key": B44_KEY };
}
async function b44Fetch(path, opts = {}) {
  const res = await fetch(`${B44_BASE}${path}`, {
    ...opts,
    headers: { ...b44Headers(), ...(opts.headers || {}) },
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Base44 ${res.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return {}; }
}
function toRecords(data) {
  return Array.isArray(data) ? data : (data?.records ?? data?.items ?? []);
}

async function findUser(appUserId, email) {
  try {
    const allD = await b44Fetch(`/entities/User?limit=500`);
    const allUsers = toRecords(allD);
    // Try apple_user_id first
    if (appUserId) {
      const u = allUsers.find(u => u.apple_user_id === appUserId);
      if (u) return u;
    }
    // Fallback: match by email
    if (email) {
      const u = allUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (u) return u;
    }
  } catch (e) {
    console.error('[RC Webhook] findUser error:', e.message);
  }
  return null;
}

export default async function handler(req, res) {
  // RevenueCat webhooks are always POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body?.event ?? req.body ?? {};
    const eventType = event.type ?? event.event_type ?? "";
    const productId = event.product_id ?? event.product_identifier ?? "";
    const appUserId = event.app_user_id ?? event.subscriber?.app_user_id ?? "";
    const email     = event.subscriber_attributes?.email?.value ?? event.subscriber?.email ?? "";

    console.log(`[RC Webhook] type=${eventType} product=${productId} userId=${appUserId}`);

    // ── INITIAL_PURCHASE or NON_RENEWING_PURCHASE = credit pack ──────────
    if (["INITIAL_PURCHASE", "NON_RENEWING_PURCHASE"].includes(eventType)) {
      const creditsToAdd = PRODUCT_CREDITS[productId];
      if (!creditsToAdd) {
        // Not a credit pack — might be a subscription, handled below
        console.log(`[RC Webhook] Unknown product ${productId} — skipping credit grant`);
        return res.status(200).json({ received: true, action: "skipped_unknown_product" });
      }

      const user = await findUser(appUserId, email);
      if (!user) {
        console.warn(`[RC Webhook] User not found for appUserId=${appUserId} email=${email}`);
        return res.status(200).json({ received: true, action: "user_not_found" });
      }

      const current = Number(user.search_credits ?? user.credits ?? 0);
      const newTotal = current + creditsToAdd;

      await b44Fetch(`/entities/User/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ search_credits: newTotal, credits: newTotal }),
      });

      console.log(`[RC Webhook] ✅ Added ${creditsToAdd} credits to user ${user.id}. Total: ${newTotal}`);
      return res.status(200).json({ received: true, action: "credits_added", creditsAdded: creditsToAdd, total: newTotal });
    }

    // ── Subscription events ───────────────────────────────────────────────
    if (["RENEWAL", "PRODUCT_CHANGE"].includes(eventType) ||
        (eventType === "INITIAL_PURCHASE" && SUBSCRIPTION_IDS.includes(productId))) {
      const user = await findUser(appUserId, email);
      if (!user) {
        return res.status(200).json({ received: true, action: "user_not_found" });
      }
      const expiryMs = event.expiration_at_ms ?? event.expiry_date_ms ?? null;
      const expiry = expiryMs ? new Date(expiryMs).toISOString() : null;

      await b44Fetch(`/entities/User/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          subscription_type: productId || "pro",
          subscription_status: "active",
          ...(expiry && { subscription_expiry_date: expiry }),
        }),
      });

      console.log(`[RC Webhook] ✅ Subscription activated for user ${user.id}`);
      return res.status(200).json({ received: true, action: "subscription_activated" });
    }

    if (["CANCELLATION", "EXPIRATION", "BILLING_ISSUE"].includes(eventType)) {
      const user = await findUser(appUserId, email);
      if (user) {
        await b44Fetch(`/entities/User/${user.id}`, {
          method: "PUT",
          body: JSON.stringify({ subscription_status: "inactive" }),
        });
        console.log(`[RC Webhook] ✅ Subscription deactivated for user ${user.id}`);
      }
      return res.status(200).json({ received: true, action: "subscription_deactivated" });
    }

    // All other event types — acknowledge but take no action
    return res.status(200).json({ received: true, action: "no_action", type: eventType });

  } catch (err) {
    console.error("[RC Webhook] Error:", err.message);
    // Always return 200 to RevenueCat so it doesn't retry infinitely
    return res.status(200).json({ received: true, error: err.message });
  }
}
