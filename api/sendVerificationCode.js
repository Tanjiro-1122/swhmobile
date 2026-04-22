// api/sendVerificationCode.js
// Sends a 6-digit code via Base44 emailLogin AND stores it on the web user record for verification.

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
    const { mobileUserId, webEmail } = req.body || {};
    if (!mobileUserId || !webEmail) {
      return res.status(400).json({ success: false, error: "mobileUserId and webEmail are required." });
    }

    const email = webEmail.trim().toLowerCase();

    // ── 1. Find the web account ───────────────────────────────────────
    const webData = await b44Fetch(`/entities/User?email=${encodeURIComponent(email)}&limit=10`);
    const webRecords = toRecords(webData);
    const webUser = webRecords.find(u => u.id !== mobileUserId) || webRecords[0];

    if (!webUser) {
      return res.status(404).json({
        success: false,
        error: "No account found with that email. Use the exact email from sportswagerhelper.com.",
      });
    }

    // ── 2. Generate a 6-digit code ────────────────────────────────────
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // ── 3. Store code on web user record ──────────────────────────────
    await b44Fetch(`/entities/User/${webUser.id}`, {
      method: "PUT",
      body: JSON.stringify({
        link_verification_code: code,
        link_verification_expires: expires,
        link_verification_mobile_id: mobileUserId,
      }),
    });

    // ── 4. Send email via Base44 emailLogin (send_code) ───────────────
    const emailRes = await fetch(B44_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_code", email }),
    });
    const emailData = await emailRes.json().catch(() => ({}));

    if (!emailData.success) {
      return res.status(500).json({
        success: false,
        error: emailData.message || emailData.error || "Failed to send verification email.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `A 6-digit code was sent to ${email}. It expires in 15 minutes.`,
      webUserId: webUser.id,
    });

  } catch (err) {
    console.error("[sendVerificationCode] error:", err.message);
    return res.status(500).json({ success: false, error: "Server error. Please try again." });
  }
}
