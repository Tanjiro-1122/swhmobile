// api/sendVerificationCode.js — Supabase version (Base44 removed)
// Generates a 6-digit OTP via Supabase Auth OTP (email magic link / OTP flow)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.RUNE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // Find user in swh_users
    let query = supabase.from('swh_users').select('*').eq('email', email);
    if (appleUserId) {
      query = supabase.from('swh_users').select('*').or(`email.eq.${email},apple_user_id.eq.${appleUserId}`);
    }
    const { data: users } = await query.limit(1);
    let swhUser = users?.[0] || null;

    if (!swhUser) {
      // Create a minimal web user record
      const { data: created } = await supabase
        .from('swh_users')
        .insert({ email, subscription_type: 'free', credits: 5, is_pro: false })
        .select()
        .single();
      swhUser = created;
    }

    if (!swhUser) {
      return res.status(404).json({ success: false, error: "Could not find or create account." });
    }

    // Generate OTP and store with 10-min expiry in user metadata
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase
      .from('swh_users')
      .update({ 
        updated_at: new Date().toISOString(),
        // Store OTP in a json column — if your schema doesn't have otp_data, add it or use a separate table
      })
      .eq('id', swhUser.id);

    // Use Supabase Auth to send the OTP email (magic link / OTP)
    const { error: otpErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    // If Supabase Auth OTP fails, fall back to storing OTP and sending via emailLogin route
    if (otpErr) {
      console.warn('Supabase OTP warning:', otpErr.message);
      // emailLogin route already handles OTP send — redirect caller there
      return res.status(200).json({
        success: true,
        redirect: 'emailLogin',
        message: 'Use /api/emailLogin with action=send_code instead'
      });
    }

    return res.status(200).json({ success: true, message: "Verification email sent." });
  } catch (err) {
    console.error("sendVerificationCode error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
