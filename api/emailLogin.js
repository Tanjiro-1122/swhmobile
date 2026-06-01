import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const CODE_TTL_MINUTES = 10;

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const makeCode = () => String(crypto.randomInt(100000, 1000000));
const hashCode = (email, code) => crypto
  .createHash("sha256")
  .update(`${email}:${code}:${process.env.SUPABASE_SERVICE_ROLE_KEY || "swh"}`)
  .digest("hex");

async function sendCodeEmail(email, code) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    const err = new Error("Email delivery is not configured yet. Please contact support.");
    err.publicMessage = "Email delivery is not configured yet. Please contact support.";
    throw err;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.SWH_EMAIL_FROM || "Sports Wager Helper <onboarding@resend.dev>",
      to: [email],
      subject: "Your Sports Wager Helper sign-in code",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;color:#0f172a">
          <h1 style="font-size:24px;margin:0 0 12px">Your Sports Wager Helper code</h1>
          <p style="font-size:15px;line-height:1.5;margin:0 0 18px">Enter this 6-digit code to sign in. It works for both new and existing accounts.</p>
          <div style="font-size:34px;font-weight:800;letter-spacing:8px;background:#f1f5f9;border-radius:14px;padding:18px 22px;text-align:center">${code}</div>
          <p style="font-size:13px;color:#64748b;line-height:1.5;margin-top:18px">This code expires in ${CODE_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.</p>
        </div>
      `,
      text: `Your Sports Wager Helper sign-in code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.`,
    }),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    const err = new Error(`Email send failed (${response.status}): ${raw.slice(0, 300)}`);
    err.status = response.status;
    err.raw = raw;
    if (response.status === 403 && raw.includes("testing emails")) {
      err.publicMessage = "We couldn't send a code to that email. If you're testing, use a verified address.";
    } else {
      err.publicMessage = "We couldn't send a code to that email. Please check it and try again.";
    }
    throw err;
  }
}

async function findAuthUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data?.users?.find((u) => u.email?.toLowerCase() === email) || null;
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

  const { action, email: rawEmail, code, apple_user_id } = req.body || {};
  const email = normalizeEmail(rawEmail);
  if (!email) return res.status(400).json({ success: false, error: "Email required" });

  try {
    if (action === "send_code") {
      const codeValue = makeCode();
      const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

      // Always create/ensure user exists — works for new AND existing users
      const authUser = await ensureAuthUser(email);
      await ensureSwhUser({ email, authUser, apple_user_id });

      const { error: otpError } = await supabase.from("swh_error_log").insert({
        user_email: email,
        page: "email_login",
        error_message: "SWH email login code issued",
        context: {
          code_hash: hashCode(email, codeValue),
          expires_at: expiresAt,
        },
        severity: "auth_code",
        resolved: false,
        created_at: new Date().toISOString(),
      });
      if (otpError) throw otpError;

      await sendCodeEmail(email, codeValue);
      return res.status(200).json({ success: true, delivery: "code" });
    }

    if (action === "verify_code") {
      if (!code) return res.status(400).json({ success: false, error: "Code required" });

      const { data: codeRows, error: codeFetchError } = await supabase
        .from("swh_error_log")
        .select("id, context, created_at")
        .eq("user_email", email)
        .eq("page", "email_login")
        .eq("severity", "auth_code")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(1);
      if (codeFetchError) throw codeFetchError;

      const storedCode = codeRows?.[0];
      const storedContext = storedCode?.context || {};
      if (!storedCode) return res.status(400).json({ success: false, error: "Invalid or expired code." });
      if (new Date(storedContext.expires_at).getTime() < Date.now()) return res.status(400).json({ success: false, error: "Code expired. Please request a new one." });
      if (storedContext.code_hash !== hashCode(email, code.trim())) return res.status(400).json({ success: false, error: "Incorrect code. Please try again." });

      const authUser = await ensureAuthUser(email);
      const profile = await ensureSwhUser({ email, authUser, apple_user_id });

      await supabase
        .from("swh_error_log")
        .update({ resolved: true })
        .eq("id", storedCode.id);

      // Return full profile so the frontend has everything it needs
      return res.status(200).json({
        success: true,
        user: {
          id: profile.id,
          email: profile.email,
          display_name: profile.display_name,
          full_name: profile.display_name,
          apple_user_id: profile.apple_user_id || null,
          credits: profile.credits ?? 5,
          search_credits: profile.credits ?? 5,
          subscription_type: profile.subscription_type || "free",
          subscription_status: profile.is_pro ? "active" : "free",
          is_pro: profile.is_pro ?? false,
        },
      });
    }

    return res.status(400).json({ success: false, error: "Unknown action" });
  } catch (err) {
    console.error("emailLogin error:", err?.message || err);
    const publicError = err?.publicMessage || "We couldn't complete email sign-in. Please try again.";
    const status = err?.status === 403 ? 400 : 500;
    return res.status(status).json({ success: false, error: publicError });
  }
}
