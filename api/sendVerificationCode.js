// api/sendVerificationCode.js
// Finds the web account by email (SWH entity OR Base44 auth), creates entity record if needed,
// then sends a 6-digit OTP via Base44 emailLogin.

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_FUNCTION_URL = `https://base44.app/api/apps/${B44_APP_ID}/functions/emailLogin`;
const B44_KEY = process.env.SWH_BASE44_API_KEY || "";

function b44Headers() { return { "Content-Type": "application/json", "api-key": B44_KEY }; }

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
    const { webEmail, appleUserId } = req.body || {};
    if (!webEmail) return res.status(400).json({ success: false, error: "webEmail is required." });
    const email = webEmail.trim().toLowerCase();

    // 1. Look up in SWH User entity
    const webData = await b44Fetch(`/entities/User?limit=500`);
    const allUsers = toRecords(webData);
    let webUser = allUsers.find(u => (u.email || "").toLowerCase() === email) || null;

    // 2. If not in entity, check Base44 auth users (web sign-ups via Base44 login)
    if (!webUser) {
      try {
        const authResp = await fetch(`${B44_BASE.replace('/api/apps/', '/api/apps/')}/users?limit=500`, {
          headers: b44Headers(),
        });
        // Try the users endpoint
        const authResp2 = await fetch(`https://app.base44.com/api/apps/${B44_APP_ID}/users?limit=500`, {
          headers: b44Headers(),
        });
        if (authResp2.ok) {
          const authData = await authResp2.json().catch(() => ({}));
          const authUsers = toRecords(authData);
          const authUser = authUsers.find(u => (u.email || "").toLowerCase() === email) || null;
          if (authUser) {
            // Auto-create a SWH entity record for this web auth user
            const created = await b44Fetch(`/entities/User`, {
              method: "POST",
              body: JSON.stringify({
                email: authUser.email,
                full_name: authUser.full_name || authUser.name || "",
                subscription_type: "free",
                search_credits: 5,
                credits: 5,
              }),
            });
            webUser = created;
            console.log("[sendVerificationCode] Auto-created entity record for auth user:", email);
          }
        }
      } catch (authErr) {
        console.warn("[sendVerificationCode] Auth user lookup failed:", authErr.message);
      }
    }

    if (!webUser) {
      return res.status(404).json({
        success: false,
        error: "No account found with that email. Make sure you use the email you signed up with on sportswagerhelper.com.",
      });
    }

    // 3. Optionally store appleUserId for verify step
    if (appleUserId && webUser.id) {
      await b44Fetch(`/entities/User/${webUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ link_verification_mobile_id: appleUserId }),
      }).catch(() => {});
    }

    // 4. Send OTP via Base44 emailLogin
    const emailRes = await fetch(B44_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_code", email }),
    });
    const emailData = await emailRes.json().catch(() => ({}));

    if (!emailData.success) {
      return res.status(500).json({
        success: false,
        error: emailData.message || "Failed to send verification email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Code sent to ${email}. Check your inbox.`,
      webUserId: webUser.id,
    });

  } catch (err) {
    console.error("[sendVerificationCode]", err.message);
    return res.status(500).json({ success: false, error: "Server error. Please try again." });
  }
}
