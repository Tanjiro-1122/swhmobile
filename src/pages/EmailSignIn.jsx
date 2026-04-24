import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, KeyRound, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

// Uses Vercel API endpoints for email-based account linking

const STEPS = { EMAIL: "email", CODE: "code" };

export default function EmailSignIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const startResendTimer = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: send code ────────────────────────────────────────────────
  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError("Please enter your email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError("Please enter a valid email address."); return; }

    setLoading(true);
    setError("");
    try {
      // Get apple_user_id from localStorage so we can link accounts on verify
      const appleUserId = localStorage.getItem("swh_user_id") || localStorage.getItem("swh_apple_user_id") || null;
      const resp = await fetch("/api/sendVerificationCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webEmail: trimmed, appleUserId }),
      });
      const data = await resp.json();
      if (data.success) {
        setStep(STEPS.CODE);
        startResendTimer();
      } else {
        setError(data.error || "No account found with that email. Make sure you use the email from sportswagerhelper.com.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify code ──────────────────────────────────────────────
  const handleVerifyCode = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const appleUserId = localStorage.getItem("swh_user_id") || localStorage.getItem("swh_apple_user_id") || null;
      const resp = await fetch("/api/linkAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webEmail: email.trim().toLowerCase(), code: trimmedCode, appleUserId }),
      });
      const data = await resp.json();
      if (data.success && data.user) {
        const u = data.user;
        // Store linked account in localStorage — same keys the rest of the app reads
        localStorage.setItem("swh_user", JSON.stringify(u));
        localStorage.setItem("swh_user_id", u.apple_user_id || u.id || "");
        localStorage.setItem("swh_apple_user_id", u.apple_user_id || u.id || "");
        localStorage.setItem("swh_search_credits", String(u.credits ?? u.search_credits ?? 5));
        localStorage.setItem("swh_is_premium", String(u.subscription_type !== "free"));
        localStorage.setItem("swh_plan", u.subscription_type || "free");
        if (u.full_name) localStorage.setItem("swh_full_name", u.full_name);
        if (u.email) localStorage.setItem("swh_email", u.email);
        // Notify native wrapper if in iOS app
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(JSON.stringify({
              type: "SIGN_IN_COMPLETE",
              data: {
                userId: u.apple_user_id || u.id,
                isPremium: u.subscription_type !== "free",
                plan: u.subscription_type,
                email: u.email,
                fullName: u.full_name,
              }
            })));
          }
        } catch(e) {}
        window.dispatchEvent(new Event("storage"));
        navigate(createPageUrl("Dashboard"), { replace: true });
      } else {
        setError(data.error || "Invalid or expired code. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setCode("");
    setError("");
    setLoading(true);
    try {
      const appleUserId = localStorage.getItem("swh_user_id") || localStorage.getItem("swh_apple_user_id") || null;
      const resp = await fetch("/api/sendVerificationCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webEmail: email.trim().toLowerCase(), appleUserId }),
      });
      const data = await resp.json();
      if (data.success) {
        startResendTimer();
      } else {
        setError(data.error || "Failed to resend. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col px-6 pt-10 pb-12">

      {/* Back button */}
      <button
        onClick={() => step === STEPS.CODE ? setStep(STEPS.EMAIL) : navigate(-1)}
        className="self-start p-2 mb-6 rounded-xl bg-gray-800 active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-5 h-5 text-gray-300" />
      </button>

      <AnimatePresence mode="wait">

        {/* ── SCREEN 1: Email ── */}
        {step === STEPS.EMAIL && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6 flex-1"
          >
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-1">Already have an account?</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                Enter the email you used on{" "}
                <span className="text-lime-400 font-medium">sportswagerhelper.com</span>.
                We'll send a 6-digit code to sign you in.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-300">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSendCode()}
                  placeholder="youremail@example.com"
                  autoComplete="email"
                  inputMode="email"
                  className="w-full pl-11 pr-4 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-lime-500 transition-colors"
                />
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </div>

            <button
              onClick={handleSendCode}
              disabled={loading || !email.trim()}
              className="w-full py-4 rounded-2xl bg-lime-500 text-gray-950 font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              {loading ? "Sending code..." : "Send Code"}
            </button>
          </motion.div>
        )}

        {/* ── SCREEN 2: Code ── */}
        {step === STEPS.CODE && (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6 flex-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-lime-400" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-1">Check your email</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                We sent a 6-digit code to{" "}
                <span className="text-white font-semibold">{email}</span>.
                Enter it below to sign in.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-300">6-digit code</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={e => { setCode(e.target.value.slice(0, 6)); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleVerifyCode()}
                  placeholder="123456"
                  className="w-full pl-11 pr-4 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-600 text-2xl font-black tracking-widest focus:outline-none focus:border-lime-500 transition-colors"
                />
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={loading || code.trim().length !== 6}
              className="w-full py-4 rounded-2xl bg-lime-500 text-gray-950 font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>

            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="text-sm text-gray-400 text-center disabled:opacity-40 active:opacity-70 transition-opacity"
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Didn't get it? Resend code"}
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
