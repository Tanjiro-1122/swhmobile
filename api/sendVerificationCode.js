// api/sendVerificationCode.js
// Just finds the web account by email and sends the code. No mobile ID needed.

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
    const { webEmail, appleUserId } = req.body || {};
    if (!webEmail) {
      return res.status(400).json({ success: false, error: "webEmail is required." });
    }
    const email = webEmail.trim().toLowerCase();

    // 1. Make sure this email exists in the DB
    const webData = await b44Fetch(`/entities/User?email=${encodeURIComponent(email)}&limit=5`);
    const webUser = toRecords(webData)[0];
    if (!webUser) {
      return res.status(404).json({ success: false, error: "No account found with that email. Use the exact email from sportswagerhelper.com." });
    }

    // 2. Store appleUserId for the verify step (optional but helpful)
    if (appleUserId) {
      await b44Fetch(`/entities/User/${webUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ link_verification_mobile_id: appleUserId }),
      }).catch(() => {});
    }

    // 3. Send the code via Base44 emailLogin
    const emailRes = await fetch(B44_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_code", email }),
    });
    const emailData = await emailRes.json().catch(() => ({}));
    if (!emailData.success) {
      return res.status(500).json({ success: false, error: emailData.message || "Failed to send email. Please try again." });
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
