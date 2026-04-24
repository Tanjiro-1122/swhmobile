// api/linkAccount.js
// Verifies the OTP stored in the User entity, stamps apple_user_id, returns full account.

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE   = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_KEY    = process.env.SWH_BASE44_API_KEY || process.env.BASE44_API_KEY || process.env.BASE44_SERVICE_TOKEN || "";

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
    const submittedCode = String(code).trim();

    // 1. Find the user by email
    const webData = await b44Fetch(`/entities/User?limit=500`);
    const allUsers = toRecords(webData);
    const webUser  = allUsers.find(u => (u.email || "").toLowerCase() === email) || null;

    if (!webUser) {
      return res.status(404).json({ success: false, error: "Account not found." });
    }

    // 2. Validate OTP
    const storedCode   = webUser.otp_code || "";
    const storedExpiry = webUser.otp_expiry ? new Date(webUser.otp_expiry) : null;

    if (!storedCode) {
      return res.status(400).json({ success: false, error: "No code was sent. Please request a new one." });
    }
    if (storedCode !== submittedCode) {
      return res.status(400).json({ success: false, error: "Incorrect code. Please try again." });
    }
    if (storedExpiry && Date.now() > storedExpiry.getTime()) {
      return res.status(400).json({ success: false, error: "Code expired. Please request a new one." });
    }

    // 3. Stamp apple_user_id and clear OTP
    const updates = { otp_code: null, otp_expiry: null, link_verification_mobile_id: null };
    if (appleUserId && !webUser.apple_user_id) {
      updates.apple_user_id = appleUserId;
    }
    await b44Fetch(`/entities/User/${webUser.id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    // 4. Return the full account
    const credits = Number(webUser.search_credits ?? webUser.credits ?? 5);
    const plan    = webUser.subscription_type || "free";

    return res.status(200).json({
      success: true,
      message: `Signed in! Your ${plan} plan and ${credits} credits are now active.`,
      user: {
        id:                        webUser.id,
        email:                     webUser.email,
        full_name:                 webUser.full_name || "",
        apple_user_id:             appleUserId || webUser.apple_user_id || "",
        subscription_type:         plan,
        subscription_status:       webUser.subscription_status || "inactive",
        subscription_expiry_date:  webUser.subscription_expiry_date || null,
        credits,
        search_credits:            credits,
        monthly_free_lookups_used: webUser.monthly_free_lookups_used ?? 0,
        role:                      webUser.role || "user",
        vip_member:                webUser.vip_member || false,
        is_legacy_member:          webUser.is_legacy_member || false,
      },
    });

  } catch (err) {
    console.error("[linkAccount] ERROR:", err.message);
    return res.status(500).json({ success: false, error: "Server error: " + err.message });
  }
}
