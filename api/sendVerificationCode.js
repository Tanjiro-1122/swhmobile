// api/sendVerificationCode.js — generates our own code, stores it, emails it via Resend

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_KEY = process.env.SWH_BASE44_API_KEY || "";
const RESEND_KEY = process.env.RESEND_API_KEY || "";

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

    // ── 2. Generate code + store it ───────────────────────────────────
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await b44Fetch(`/entities/User/${webUser.id}`, {
      method: "PUT",
      body: JSON.stringify({
        link_verification_code: code,
        link_verification_expires: expires,
        link_verification_mobile_id: mobileUserId,
      }),
    });

    // ── 3. Send email via Resend ──────────────────────────────────────
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: "Sports Wager Helper <onboarding@resend.dev>",
        to: [email],
        subject: "Your Sports Wager Helper verification code",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#111;color:#fff;padding:32px;border-radius:12px;">
            <h2 style="color:#84cc16;margin-bottom:8px;">Sports Wager Helper</h2>
            <p style="color:#aaa;margin-bottom:24px;">Link your web account to the mobile app</p>
            <div style="background:#1f2937;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
              <p style="color:#9ca3af;font-size:14px;margin:0 0 8px;">Your verification code</p>
              <p style="font-size:42px;font-weight:900;letter-spacing:12px;color:#fff;margin:0;">${code}</p>
              <p style="color:#6b7280;font-size:12px;margin:12px 0 0;">Expires in 15 minutes</p>
            </div>
            <p style="color:#6b7280;font-size:12px;">If you didn't request this, you can ignore this email.</p>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json().catch(() => ({}));

    if (!emailRes.ok) {
      console.error("[sendVerificationCode] Resend error:", JSON.stringify(emailData));
      return res.status(500).json({
        success: false,
        error: "Failed to send verification email. Please try again.",
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
