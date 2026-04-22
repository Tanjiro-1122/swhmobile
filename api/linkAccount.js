// api/linkAccount.js — verify via Base44 emailLogin, merge accounts
// Mobile user lookup: tries DB id, then apple_user_id, then creates a record if needed

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_FUNCTION_URL = `https://base44.app/api/apps/${B44_APP_ID}/functions/emailLogin`;
const B44_KEY = process.env.SWH_BASE44_API_KEY || "";

function b44Headers() { return { "Content-Type": "application/json", "api_key": B44_KEY }; }
async function b44Fetch(path, opts = {}) {
  const res = await fetch(`${B44_BASE}${path}`, { ...opts, headers: { ...b44Headers(), ...(opts.headers||{}) } });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Base44 ${res.status}: ${text.slice(0,300)}`);
  try { return JSON.parse(text); } catch { return {}; }
}
function toRecords(d) { return Array.isArray(d) ? d : (d?.records ?? d?.items ?? []); }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { mobileUserId, webEmail, code, appleUserId } = req.body || {};
    if (!mobileUserId || !webEmail || !code) {
      return res.status(400).json({ success: false, error: "mobileUserId, webEmail, and code are required." });
    }
    const email = webEmail.trim().toLowerCase();

    // 1. Verify code via Base44 emailLogin
    const verifyRes = await fetch(B44_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_code", email, code: String(code).trim() }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyData.success) {
      return res.status(400).json({ success: false, error: "Incorrect or expired code. Please try again." });
    }

    // 2. Find web account
    const webData = await b44Fetch(`/entities/User?email=${encodeURIComponent(email)}&limit=10`);
    const webUser = toRecords(webData)[0];
    if (!webUser) return res.status(404).json({ success: false, error: "Web account not found." });

    // 3. Find mobile account — multiple fallback strategies
    let mobileUser = null;

    // Try by DB record id
    try {
      const byId = await b44Fetch(`/entities/User/${mobileUserId}`);
      if (byId?.id) mobileUser = byId;
    } catch {}

    // Try by apple_user_id (passed directly from wrapper)
    if (!mobileUser && appleUserId) {
      const d = await b44Fetch(`/entities/User?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`);
      mobileUser = toRecords(d)[0] ?? null;
    }

    // Try stored mobile id from send step
    if (!mobileUser && webUser.link_verification_mobile_id && webUser.link_verification_mobile_id !== mobileUserId) {
      try {
        const byStored = await b44Fetch(`/entities/User/${webUser.link_verification_mobile_id}`);
        if (byStored?.id) mobileUser = byStored;
      } catch {}
    }

    // If still not found — the web account IS the user, just stamp the apple_user_id on it
    // This happens when Apple Sign-In never created a DB record
    if (!mobileUser) {
      console.log("[linkAccount] No mobile record found — stamping apple_user_id onto web account");
      mobileUser = webUser;
    }

    // 4. Merge
    const mergedCredits = Math.max(
      Number(webUser.search_credits ?? webUser.credits ?? 0),
      Number(mobileUser.id === webUser.id ? 0 : (mobileUser.search_credits ?? mobileUser.credits ?? 0))
    );
    const mergedPlan = (webUser.subscription_type && webUser.subscription_type !== "free")
      ? webUser.subscription_type : (mobileUser.subscription_type || "free");
    const mergedStatus =
      webUser.subscription_status === "active" || webUser.subscription_status === "lifetime_vip"
        ? webUser.subscription_status
        : mobileUser.subscription_status === "active" ? "active"
        : (webUser.subscription_status || "inactive");

    const updates = {
      subscription_type: mergedPlan,
      subscription_status: mergedStatus,
      subscription_expiry_date: webUser.subscription_expiry_date || mobileUser.subscription_expiry_date || null,
      search_credits: mergedCredits,
      credits: mergedCredits,
      monthly_free_lookups_used: Math.min(Number(webUser.monthly_free_lookups_used ?? 0), Number(mobileUser.monthly_free_lookups_used ?? 0)),
      vip_member: webUser.vip_member || false,
      vip_spot_number: webUser.vip_spot_number || null,
      is_legacy_member: webUser.is_legacy_member || false,
      link_verification_mobile_id: null,
    };

    // Stamp apple_user_id if we have it and it's missing
    if (appleUserId && !webUser.apple_user_id) updates.apple_user_id = appleUserId;
    if (mobileUser.id !== webUser.id) updates.linked_web_account_id = webUser.id;

    await b44Fetch(`/entities/User/${mobileUser.id}`, { method: "PUT", body: JSON.stringify(updates) });

    return res.status(200).json({
      success: true,
      message: `Accounts linked! Your ${mergedPlan} plan and ${mergedCredits} credits are now active.`,
      user: {
        id: mobileUser.id,
        email: webUser.email,
        full_name: mobileUser.full_name || webUser.full_name || "",
        apple_user_id: appleUserId || mobileUser.apple_user_id || webUser.apple_user_id,
        subscription_type: mergedPlan,
        subscription_status: mergedStatus,
        credits: mergedCredits,
        search_credits: mergedCredits,
        monthly_free_lookups_used: updates.monthly_free_lookups_used,
        role: mobileUser.role || webUser.role || "user",
        vip_member: webUser.vip_member || false,
        is_legacy_member: webUser.is_legacy_member || false,
      },
    });

  } catch (err) {
    console.error("[linkAccount] error:", err.message);
    return res.status(500).json({ success: false, error: "Server error. Please try again." });
  }
}
