import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, email, code, apple_user_id } = req.body || {};

  if (!email) return res.status(400).json({ success: false, error: "Email required" });

  try {
    // ── SEND CODE ──────────────────────────────────────────────────────────────
    if (action === "send_code") {
      // Use Supabase OTP (sends a 6-digit code via email)
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true }
      });
      if (error) return res.status(400).json({ success: false, error: error.message });
      return res.status(200).json({ success: true });
    }

    // ── VERIFY CODE ────────────────────────────────────────────────────────────
    if (action === "verify_code") {
      if (!code) return res.status(400).json({ success: false, error: "Code required" });

      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "email"
      });
      if (error) return res.status(400).json({ success: false, error: "Invalid or expired code." });

      const user = data.user;
      const session = data.session;

      // If apple_user_id provided, link it to this email account in swh_user_profiles
      if (apple_user_id && user) {
        await supabase
          .from("swh_user_profiles")
          .upsert({ 
            id: user.id,
            email: user.email,
            apple_user_id,
            updated_at: new Date().toISOString()
          }, { onConflict: "email" });
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from("swh_user_profiles")
        .select("*")
        .eq("email", user.email)
        .single();

      return res.status(200).json({
        success: true,
        user: { id: user.id, email: user.email },
        profile: profile || null,
        access_token: session?.access_token || null
      });
    }

    return res.status(400).json({ success: false, error: "Unknown action" });
  } catch (err) {
    console.error("emailLogin error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
