// api/linkAccount.js
// Verifies code via Base44 emailLogin verify_code, then merges web + mobile accounts.

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_FUNCTION_URL = `https://base44.app/api/apps/${B44_APP_ID}/functions/emailLogin`;
const B44_KEY = process.env.SWH_BASE44_API_KEY || "";

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { mobileUserId, webEmail, code } = req.body || {};

    if (!mobileUserId || !webEmail || !code) {
      return res.status(400).json({ success: false, error: "mobileUserId, webEmail, and code are required." });
    }

    const email = webEmail.trim().toLowerCase();

    // ── 1. Verify code via Base44 emailLogin ──────────────────────────
    const verifyRes = await fetch(B44_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_code", email, code: String(code).trim() }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));

    if (!verifyData.success) {
      return res.status(400).json({
        success: false,
        error: "Incorrect or expired code. Please try again.",
      });
    }

    // ── 2. Find the web account by email ─────────────────────────────
    const webData = await b44Fetch(`/entities/User?email=${encodeURIComponent(email)}&limit=10`);
    const webRecords = toRecords(webData);
    const webUser = webRecords.find(u => u.id !== mobileUserId) || webRecords[0];

    if (!webUser) {
      return res.status(404).json({ success: false, error: "Web account not found." });
    }

    // ── 3. Find mobile account — by DB id, fallback to apple_user_id ─
    let mobileUser = null;
    try {
      const byId = await b44Fetch(`/entities/User/${mobileUserId}`);
      if (byId?.id) mobileUser = byId;
    } catch {}
    if (!mobileUser) {
      const mobileData = await b44Fetch(`/entities/User?apple_user_id=${encodeURIComponent(mobileUserId)}&limit=1`);
      mobileUser = toRecords(mobileData)[0] ?? null;
    }
    // Last resort: use link_verification_mobile_id stored during send step
    if (!mobileUser && webUser.link_verification_mobile_id) {
      try {
        const byStoredId = await b44Fetch(`/entities/User/${webUser.link_verification_mobile_id}`);
        if (byStoredId?.id) mobileUser = byStoredId;
      } catch {}
    }

    if (!mobileUser) {
      return res.status(404).json({ success: false, error: "Mobile account not found. Try signing out and back in first." });
    }

    // ── 4. Merge — best of both ───────────────────────────────────────
    const mergedCredits = Math.max(
      Number(webUser.search_credits ?? webUser.credits ?? 0),
      Number(mobileUser.search_credits ?? mobileUser.credits ?? 0)
    );
    const mergedPlan =
      (webUser.subscription_type && webUser.subscription_type !== "free")
        ? webUser.subscription_type
        : (mobileUser.subscription_type || "free");
    const mergedStatus =
      webUser.subscription_status === "active" || webUser.subscription_status === "lifetime_vip"
        ? webUser.subscription_status
        : mobileUser.subscription_status === "active" ? "active"
        : (webUser.subscription_status || mobileUser.subscription_status || "inactive");
    const mergedExpiry = webUser.subscription_expiry_date || mobileUser.subscription_expiry_date || null;
    const mergedName   = mobileUser.full_name || webUser.full_name || "";

    const mobileUpdates = {
      subscription_type:           mergedPlan,
      subscription_status:         mergedStatus,
      subscription_expiry_date:    mergedExpiry,
      search_credits:              mergedCredits,
      credits:                     mergedCredits,
      monthly_free_lookups_used:   Math.min(
        Number(webUser.monthly_free_lookups_used ?? 0),
        Number(mobileUser.monthly_free_lookups_used ?? 0)
      ),
      email:                       webUser.email,
      full_name:                   mergedName,
      linked_web_account_id:       webUser.id,
      vip_member:                  webUser.vip_member || false,
      vip_spot_number:             webUser.vip_spot_number || null,
      is_legacy_member:            webUser.is_legacy_member || false,
    };

    // ── 5. Write both records ─────────────────────────────────────────
    await b44Fetch(`/entities/User/${mobileUser.id}`, {
      method: "PUT",
      body: JSON.stringify(mobileUpdates),
    });

    await b44Fetch(`/entities/User/${webUser.id}`, {
      method: "PUT",
      body: JSON.stringify({
        linked_mobile_account_id:    mobileUser.id,
        link_verification_mobile_id: null,
      }),
    }).catch(e => console.warn("[linkAccount] web cleanup failed:", e.message));

    // ── 6. Respond ────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: `Accounts linked! Your ${mergedPlan} plan and ${mergedCredits} credits are now active.`,
      user: {
        id:                        mobileUser.id,
        email:                     webUser.email,
        full_name:                 mergedName,
        apple_user_id:             mobileUser.apple_user_id,
        subscription_type:         mergedPlan,
        subscription_status:       mergedStatus,
        subscription_expiry_date:  mergedExpiry,
        credits:                   mergedCredits,
        search_credits:            mergedCredits,
        monthly_free_lookups_used: mobileUpdates.monthly_free_lookups_used,
        role:                      mobileUser.role || webUser.role || "user",
        vip_member:                webUser.vip_member || false,
        is_legacy_member:          webUser.is_legacy_member || false,
      },
    });

  } catch (err) {
    console.error("[linkAccount] error:", err.message);
    return res.status(500).json({ success: false, error: "Server error. Please try again." });
  }
}
