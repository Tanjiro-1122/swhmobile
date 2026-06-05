// api/emailLogin.js — Supabase OTP auth (replaces broken Resend flow)
// Uses Supabase Auth built-in OTP email delivery (no external API key needed)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Public-facing Supabase URL for OTP send (uses anon key)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const normalizeEmail = (email = "") => email.trim().toLowerCase();

async function findAuthUserByEmail(email) {
  // Use direct lookup instead of fetching up to 1000 users and scanning locally
  const { data, error } = await supabase.auth.admin.getUserByEmail(email);
  if (error && error.message?.includes('User not found')) return null;
  if (error) throw error;
  return data?.user ?? null;
}

async function ensureAuthUser(email) {
  const existing = await findAuthUserByEmail(email);
  if (existing) return existing;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source_app: "sports_wager_helper" },
  });
  if (error) throw error;
  return data.user;
}

async function ensureSwhUser({ email, authUser, apple_user_id }) {
  const displayName = email.split("@")[0] || "SWH User";
  const payload = {
    email,
    display_name: authUser?.user_metadata?.display_name || displayName,
    credits: 5,
    subscription_type: "free",
    is_pro: false,
    ...(apple_user_id ? { apple_user_id } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("swh_users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const update = { updated_at: payload.updated_at };
    if (!existing.display_name) update.display_name = payload.display_name;
    if (!existing.apple_user_id && apple_user_id) update.apple_user_id = apple_user_id;
    const { data, error } = await supabase
      .from("swh_users")
      .update(update)
      .eq("email", email)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("swh_users")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, email: rawEmail, code, token: tokenParam, apple_user_id } = req.body || {};
  const email = normalizeEmail(rawEmail);
  if (!email) return res.status(400).json({ success: false, error: "Email required" });

  try {
    // ── SEND CODE ──────────────────────────────────────────────────────────────
    if (action === "send_code") {
      // Ensure user exists in swh_users before sending OTP
      const authUser = await ensureAuthUser(email);
      await ensureSwhUser({ email, authUser, apple_user_id });

      // Send OTP via Supabase Auth (built-in email delivery — no Resend needed)
      const otpRes = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, create_user: false }),
      });

      if (!otpRes.ok) {
        const otpData = await otpRes.json().catch(() => ({}));
        const msg = otpData?.msg || otpData?.error_description || otpData?.message || "";

        // Rate limit is fine — means a code was recently sent
        if (otpRes.status === 429 || (msg && msg.toLowerCase().includes("rate limit"))) {
          return res.status(200).json({ success: true, delivery: "otp", note: "recent_code_still_valid" });
        }

        console.error("[emailLogin] OTP send error:", otpRes.status, msg);
        return res.status(500).json({
          success: false,
          error: "We couldn\'t send a code to that email. Please check it and try again.",
        });
      }

      return res.status(200).json({ success: true, delivery: "otp" });
    }

    // ── VERIFY CODE ────────────────────────────────────────────────────────────
    if (action === "verify_code") {
      const codeValue = (code || tokenParam || "").trim();
      if (!codeValue) return res.status(400).json({ success: false, error: "Code required" });

      // Verify OTP with Supabase Auth
      const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token: codeValue, type: "email" }),
      });

      const verifyData = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok || verifyData?.error || verifyData?.error_code) {
        const errMsg = verifyData?.error_description || verifyData?.message || verifyData?.msg || "Incorrect or expired code.";
        console.error("[emailLogin] OTP verify error:", verifyData);
        return res.status(400).json({ success: false, error: errMsg });
      }

      // OTP verified — get or create swh_users profile
      const authUser = await findAuthUserByEmail(email);
      const profile = await ensureSwhUser({ email, authUser, apple_user_id });

      return res.status(200).json({
        success: true,
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.display_name || profile.full_name || email.split("@")[0],
          apple_user_id: profile.apple_user_id || null,
          subscription_type: profile.subscription_type || "free",
          search_credits: profile.credits ?? 5,
          is_pro: profile.is_pro || false,
          subscription_status: profile.is_pro ? "active" : "inactive",
        },
      });
    }

    return res.status(400).json({ success: false, error: "Unknown action" });
  } catch (err) {
    console.error("[emailLogin] Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
}
