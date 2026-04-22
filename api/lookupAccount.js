// api/lookupAccount.js
// Mobile app sends apple_user_id (from localStorage) → we return their full account record.
// Also handles the case where a web account was created with a different email (Stripe/Base44 login)
// and the user wants to know what plan/credits are attached to that email.

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE  = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_KEY   = process.env.SWH_BASE44_API_KEY || "";

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
function safeUser(u) {
  if (!u) return null;
  return {
    id:                        u.id,
    email:                     u.email || "",
    full_name:                 u.full_name || "",
    apple_user_id:             u.apple_user_id || "",
    subscription_type:         u.subscription_type || "free",
    subscription_status:       u.subscription_status || "inactive",
    subscription_expiry_date:  u.subscription_expiry_date || null,
    credits:                   u.credits ?? u.search_credits ?? 5,
    search_credits:            u.search_credits ?? u.credits ?? 5,
    monthly_free_lookups_used: u.monthly_free_lookups_used ?? 0,
    role:                      u.role || "user",
    linked_web_account_id:     u.linked_web_account_id || null,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { appleUserId, email } = req.body || {};

    // Fetch all users once — filter client-side (query params unreliable)
    const allData = await b44Fetch(`/entities/User?limit=500`);
    const allUsers = toRecords(allData);

    // ── Mode 1: look up by apple_user_id (mobile account refresh) ─────
    if (appleUserId) {
      const user = allUsers.find(u => u.apple_user_id === appleUserId) ?? null;
      if (!user) return res.status(404).json({ success: false, error: "Account not found." });
      return res.status(200).json({ success: true, user: safeUser(user) });
    }

    // ── Mode 2: look up by email (check if a web account exists before linking) ─
    if (email) {
      const trimmed = email.trim().toLowerCase();
      const records = allUsers.filter(u => (u.email || '').toLowerCase() === trimmed);

      if (!records.length) {
        return res.status(404).json({
          success: false,
          error: "No account found with that email. Make sure you use the email you signed up with on sportswagerhelper.com.",
        });
      }

      // Return just enough info to show the user what they'd be linking (no sensitive data)
      const match = records[0];
      return res.status(200).json({
        success: true,
        preview: {
          email:             match.email,
          full_name:         match.full_name || "",
          subscription_type: match.subscription_type || "free",
          credits:           match.search_credits ?? match.credits ?? 0,
          webUserId:         match.id,
        },
      });
    }

    return res.status(400).json({ success: false, error: "appleUserId or email is required." });

  } catch (err) {
    console.error("[lookupAccount] error:", err.message);
    return res.status(500).json({ success: false, error: "Server error. Please try again." });
  }
}
