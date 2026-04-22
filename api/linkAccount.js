// api/linkAccount.js
// Flow: user types web email → gets code → enters code → we find web account by email,
// verify the code, then stamp apple_user_id onto that web record and return its plan/credits.

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
    const { webEmail, code, appleUserId } = req.body || {};
    if (!webEmail || !code) {
      return res.status(400).json({ success: false, error: "webEmail and code are required." });
    }
    const email = webEmail.trim().toLowerCase();

    // 1. Verify the code (Base44 emailLogin manages it)
    const verifyRes = await fetch(B44_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_code", email, code: String(code).trim() }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyData.success) {
      return res.status(400).json({ success: false, error: "Incorrect or expired code. Please try again." });
    }

    // 2. Find the web account by email — this is THE account
    const webData = await b44Fetch(`/entities/User?limit=500`);
    const allUsers = toRecords(webData);
    const webUser = allUsers.find(u => (u.email||"").toLowerCase() === email) || null;
    // webUser already set above
    if (!webUser) return res.status(404).json({ success: false, error: "Account not found." });

    // 3. Stamp apple_user_id onto the web account so mobile lookups work going forward
    const updates = { link_verification_mobile_id: null };
    if (appleUserId && !webUser.apple_user_id) {
      updates.apple_user_id = appleUserId;
    }
    await b44Fetch(`/entities/User/${webUser.id}`, { method: "PUT", body: JSON.stringify(updates) });

    // 4. Return the full plan/credits from the web account
    const plan = webUser.subscription_type || "free";
    const status = webUser.subscription_status || "inactive";
    const credits = Number(webUser.search_credits ?? webUser.credits ?? 0);

    return res.status(200).json({
      success: true,
      message: `Accounts linked! Your ${plan} plan and ${credits} credits are now active.`,
      user: {
        id: webUser.id,
        email: webUser.email,
        full_name: webUser.full_name || "",
        apple_user_id: appleUserId || webUser.apple_user_id || "",
        subscription_type: plan,
        subscription_status: status,
        subscription_expiry_date: webUser.subscription_expiry_date || null,
        credits,
        search_credits: credits,
        monthly_free_lookups_used: webUser.monthly_free_lookups_used ?? 0,
        role: webUser.role || "user",
        vip_member: webUser.vip_member || false,
        is_legacy_member: webUser.is_legacy_member || false,
      },
    });

  } catch (err) {
    console.error("[linkAccount] error:", err.message);
    return res.status(500).json({ success: false, error: "Server error. Please try again." });
  }
}
