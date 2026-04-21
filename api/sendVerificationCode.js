// api/sendVerificationCode.js
// Step 1 of account linking: generate a code, store it, email it to the web account address.

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
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { mobileUserId, webEmail } = req.body || {};
    if (!mobileUserId || !webEmail) {
      return res.status(400).json({ success: false, error: 'mobileUserId and webEmail are required' });
    }

    const email = webEmail.trim().toLowerCase();

    // 1. Make sure a web account exists with this email
    const webData = await b44Fetch(`/entities/User?email=${encodeURIComponent(email)}&limit=5`);
    const webRecords = toRecords(webData);
    const webUser = webRecords.find(u => u.id !== mobileUserId && (
      u.subscription_type !== 'free' || (u.credits > 5) || (u.search_credits > 5) || !u.apple_user_id
    )) || webRecords.find(u => u.id !== mobileUserId);

    if (!webUser) {
      return res.status(404).json({
        success: false,
        error: 'No account found with that email. Make sure you use the email you signed up with on sportswagerhelper.com.'
      });
    }

    // 2. Generate and store the verification code (expires in 15 min)
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store on the web user record temporarily
    await b44Fetch(`/entities/User/${webUser.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        link_verification_code: code,
        link_verification_expires: expiresAt,
        link_verification_mobile_id: mobileUserId,
      }),
    });

    // 3. Send the email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: 'Sports Wager Helper <noreply@sportswagerhelper.com>',
        to: [email],
        subject: 'Your Account Link Code — Sports Wager Helper',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 32px; border-radius: 12px;">
            <h2 style="color: #a3e635; margin-bottom: 8px;">Account Link Request</h2>
            <p style="color: #94a3b8; margin-bottom: 24px;">
              Someone is trying to link your Sports Wager Helper web account to a mobile device. 
              If this was you, use the code below.
            </p>
            <div style="background: #1e293b; border: 2px solid #a3e635; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px;">Your verification code</p>
              <p style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #a3e635; margin: 0;">${code}</p>
            </div>
            <p style="color: #64748b; font-size: 12px;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text().catch(() => "");
      console.error('[sendVerificationCode] Resend error:', errText);
      return res.status(500).json({ success: false, error: 'Failed to send verification email. Please try again.' });
    }

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${email}. It expires in 15 minutes.`,
      webUserId: webUser.id, // send back so frontend can pass to verify step
    });

  } catch (err) {
    console.error('[sendVerificationCode] error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
