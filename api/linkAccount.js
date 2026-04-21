// api/linkAccount.js
// Step 2 of account linking: verify the code, then merge the two accounts.

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
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
    const { mobileUserId, webUserId, code } = req.body || {};

    if (!mobileUserId || !webUserId || !code) {
      return res.status(400).json({ success: false, error: "mobileUserId, webUserId, and code are required." });
    }

    // ── 1. Fetch the web user ─────────────────────────────────────────
    const webData = await b44Fetch(`/entities/User/${webUserId}`);
    // Base44 single-record fetch can return the record directly or under a key
    const webUser = webData?.id ? webData : (webData?.record ?? webData?.data ?? null);

    if (!webUser?.id) {
      return res.status(404).json({ success: false, error: "Web account not found." });
    }

    // ── 2. Validate the code ──────────────────────────────────────────
    const storedCode = String(webUser.link_verification_code || "").trim();
    const expiresAt  = webUser.link_verification_expires;
    const issuedFor  = webUser.link_verification_mobile_id;

    if (!storedCode) {
      return res.status(400).json({ success: false, error: "No verification code found. Please request a new one." });
    }
    if (storedCode !== String(code).trim()) {
      return res.status(400).json({ success: false, error: "Incorrect code. Double-check and try again." });
    }
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: "This code has expired. Please request a new one." });
    }
    if (issuedFor && issuedFor !== mobileUserId) {
      return res.status(400).json({ success: false, error: "This code was issued for a different device. Please request a new one." });
    }

    // ── 3. Fetch the mobile account ───────────────────────────────────
    const mobileData = await b44Fetch(`/entities/User?apple_user_id=${encodeURIComponent(mobileUserId)}&limit=1`);
    const mobileUser = toRecords(mobileData)[0] ?? null;

    if (!mobileUser) {
      return res.status(404).json({ success: false, error: "Mobile account not found. Try signing out and back in first." });
    }

    // ── 4. Merge — always take the best of both ───────────────────────
    const mergedCredits = Math.max(
      Number(webUser.search_credits ?? webUser.credits ?? 0),
      Number(mobileUser.search_credits ?? mobileUser.credits ?? 0)
    );
    const mergedPlan =
      (webUser.subscription_type && webUser.subscription_type !== "free")
        ? webUser.subscription_type
        : (mobileUser.subscription_type || "free");
    const mergedStatus =
      webUser.subscription_status === "active" ? "active"
        : mobileUser.subscription_status === "active" ? "active"
        : (webUser.subscription_status || mobileUser.subscription_status || "inactive");
    const mergedExpiry =
      webUser.subscription_expiry_date || mobileUser.subscription_expiry_date || null;
    const mergedName =
      mobileUser.full_name || webUser.full_name || "";

    const mobileUpdates = {
      subscription_type:         mergedPlan,
      subscription_status:       mergedStatus,
      subscription_expiry_date:  mergedExpiry,
      search_credits:            mergedCredits,
      credits:                   mergedCredits,
      monthly_free_lookups_used: Math.min(
        Number(webUser.monthly_free_lookups_used ?? 0),
        Number(mobileUser.monthly_free_lookups_used ?? 0)
      ),
      email:                     webUser.email,
      full_name:                 mergedName,
      linked_web_account_id:     webUser.id,
      // Clear verification fields on mobile side too (safety)
      link_verification_code:        null,
      link_verification_expires:     null,
      link_verification_mobile_id:   null,
    };

    // ── 5. Write both records ─────────────────────────────────────────
    await b44Fetch(`/entities/User/${mobileUser.id}`, {
      method: "PUT",
      body: JSON.stringify(mobileUpdates),
    });

    // Mark web account as linked + clear its verification fields
    await b44Fetch(`/entities/User/${webUser.id}`, {
      method: "PUT",
      body: JSON.stringify({
        linked_mobile_account_id:    mobileUser.id,
        link_verification_code:      null,
        link_verification_expires:   null,
        link_verification_mobile_id: null,
      }),
    }).catch(e => console.warn("[linkAccount] web record cleanup failed:", e.message));

    // ── 6. Respond ────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: `Accounts linked! Your ${mergedPlan} plan and ${mergedCredits} credits are now active on this device.`,
      user: {
        id:                       mobileUser.id,
        email:                    webUser.email,
        full_name:                mergedName,
        apple_user_id:            mobileUser.apple_user_id,
        subscription_type:        mergedPlan,
        subscription_status:      mergedStatus,
        subscription_expiry_date: mergedExpiry,
        credits:                  mergedCredits,
        search_credits:           mergedCredits,
        monthly_free_lookups_used: mobileUpdates.monthly_free_lookups_used,
        role:                     mobileUser.role || webUser.role || "user",
      },
    });

  } catch (err) {
    console.error("[linkAccount] error:", err.message);
    return res.status(500).json({ success: false, error: "Server error. Please try again." });
  }
}
