// api/sendVerificationCode.js
// Finds the web account by email in SWH User entity, then sends OTP via Base44 emailLogin.
// Also handles web auth users who exist in Base44 but not in the entity yet.

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_FUNCTION_URL = `https://app.base44.com/api/apps/${B44_APP_ID}/functions/emailLogin`;
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

    // 2. If not found in entity, try Base44 auth users list (catches web-only sign-ups)
    if (!webUser) {
      try {
        const authResp = await fetch(`${B44_BASE}/users?limit=500`, {
          headers: b44Headers(),
        });
        if (authResp.ok) {
          const authData = await authResp.json().catch(() => ({}));
          const authUsers = toRecords(authData);
          const authUser = authUsers.find(u => (u.email || "").toLowerCase() === email) || null;
          if (authUser) {
            // Auto-create a SWH entity record for this auth-only user
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
            console.log("[sendVerificationCode] Auto-created entity record for:", email);
          }
        }
      } catch (authErr) {
        console.warn("[sendVerificationCode] Auth fallback failed:", authErr.message);
      }
    }

    if (!webUser) {
      return res.status(404).json({
        success: false,
        error: "No account found with that email. Make sure you use the exact email from sportswagerhelper.com.",
      });
    }

    // 3. Stamp appleUserId for the verify step
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
    console.error("[sendVerificationCode] ERROR:", err.message);
    return res.status(500).json({ success: false, error: "Server error: " + err.message });
  }
}
