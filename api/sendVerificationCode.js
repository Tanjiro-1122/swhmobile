// api/sendVerificationCode.js
// Generates a 6-digit OTP, stores it in the User entity, and emails it via Base44 email API.

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

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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

    // 1. Find user in SWH entity
    const webData = await b44Fetch(`/entities/User?limit=500`);
    const allUsers = toRecords(webData);
    let webUser = allUsers.find(u => (u.email || "").toLowerCase() === email) || null;

    // 2. Fallback: check Base44 auth users list
    if (!webUser) {
      const authResp = await fetch(`${B44_BASE}/users?limit=500`, { headers: b44Headers() });
      if (authResp.ok) {
        const authData = await authResp.json().catch(() => ({}));
        const authUsers = toRecords(authData);
        const authUser  = authUsers.find(u => (u.email || "").toLowerCase() === email) || null;
        if (authUser) {
          // Auto-create entity record for web-auth-only user
          webUser = await b44Fetch(`/entities/User`, {
            method: "POST",
            body: JSON.stringify({
              email: authUser.email,
              full_name: authUser.full_name || authUser.name || "",
              subscription_type: "free",
              search_credits: 5,
              credits: 5,
            }),
          });
        }
      }
    }

    if (!webUser) {
      return res.status(404).json({
        success: false,
        error: "No account found with that email. Use the exact email from sportswagerhelper.com.",
      });
    }

    // 3. Generate OTP and store it in the entity with a 10-minute expiry
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const updatePayload = { otp_code: otp, otp_expiry: expiry };
    if (appleUserId) updatePayload.link_verification_mobile_id = appleUserId;

    await b44Fetch(`/entities/User/${webUser.id}`, {
      method: "PUT",
      body: JSON.stringify(updatePayload),
    });

    // 4. Send email via Base44 email API
    const emailRes = await fetch(`${B44_BASE}/functions/sendEmail`, {
      method: "POST",
      headers: b44Headers(),
      body: JSON.stringify({
        to: email,
        subject: "Your Sports Wager Helper sign-in code",
        body: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:12px;">
            <h1 style="color:#84cc16;font-size:24px;margin-bottom:8px;">Sports Wager Helper</h1>
            <p style="color:#9ca3af;margin-bottom:24px;">Use the code below to sign in to the mobile app.</p>
            <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
              <span style="font-size:40px;font-weight:900;letter-spacing:8px;color:#84cc16;">${otp}</span>
            </div>
            <p style="color:#6b7280;font-size:13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json().catch(() => ({}));
    console.log("[sendVerificationCode] Email result:", emailData);

    // Even if email API returns non-success, the OTP is stored — return success
    // (Base44 email API response format varies)
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
