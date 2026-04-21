// api/sendVerificationCode.js
// Step 1 of account linking: generate a 6-digit code, store it, email it.

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
function generateCode() {
  // Cryptographically random 6-digit code (100000–999999)
  return String(Math.floor(100000 + Math.random() * 900000));
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
    if (!RESEND_KEY) {
      return res.status(500).json({ success: false, error: "Email service not configured. Please contact support." });
    }

    const email = webEmail.trim().toLowerCase();

    // ── 1. Look up the web account ────────────────────────────────────
    const webData = await b44Fetch(`/entities/User?email=${encodeURIComponent(email)}&limit=10`);
    const webRecords = toRecords(webData);

    // Prefer an account that is NOT the mobile account and has real data
    const webUser =
      webRecords.find(u => u.id !== mobileUserId && (
        (u.subscription_type && u.subscription_type !== "free") ||
        (u.search_credits > 5) ||
        (u.credits > 5) ||
        !u.apple_user_id
      )) ||
      webRecords.find(u => u.id !== mobileUserId);

    if (!webUser) {
      return res.status(404).json({
        success: false,
        error: "No account found with that email. Use the exact email you signed up with on sportswagerhelper.com.",
      });
    }

    // ── 2. Rate-limit: block if a fresh code was sent in the last 60 s ─
    if (webUser.link_verification_expires) {
      const expires = new Date(webUser.link_verification_expires);
      const sentAt = new Date(expires.getTime() - 15 * 60 * 1000);
      if (Date.now() - sentAt.getTime() < 60_000) {
        return res.status(429).json({
          success: false,
          error: "A code was just sent. Please wait 60 seconds before requesting another.",
        });
      }
    }

    // ── 3. Generate + store the code ──────────────────────────────────
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await b44Fetch(`/entities/User/${webUser.id}`, {
      method: "PUT",
      body: JSON.stringify({
        link_verification_code: code,
        link_verification_expires: expiresAt,
        link_verification_mobile_id: mobileUserId,
      }),
    });

    // ── 4. Send the email ─────────────────────────────────────────────
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: "Sports Wager Helper <noreply@sportswagerhelper.com>",
        to: [email],
        subject: "Your Account Link Code — Sports Wager Helper",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                 alt="Sports Wager Helper" style="width:56px;height:56px;border-radius:12px;margin-bottom:16px;" />
            <h2 style="color:#a3e635;margin:0 0 8px;">Link Your Account</h2>
            <p style="color:#94a3b8;margin:0 0 24px;font-size:14px;line-height:1.5;">
              Someone requested to link your Sports Wager Helper web account to a mobile device.
              If this was you, enter the code below in the app.
            </p>
            <div style="background:#1e293b;border:2px solid #a3e635;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
              <p style="color:#94a3b8;font-size:12px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
              <p style="font-size:44px;font-weight:900;letter-spacing:14px;color:#a3e635;margin:0;padding-left:14px;">${code}</p>
            </div>
            <p style="color:#475569;font-size:12px;line-height:1.5;margin:0;">
              ⏱ Expires in <strong>15 minutes</strong>.<br/>
              If you didn't request this, ignore this email — your account is safe.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text().catch(() => "");
      console.error("[sendVerificationCode] Resend error:", errText);
      return res.status(500).json({ success: false, error: "Failed to send verification email. Please try again." });
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
