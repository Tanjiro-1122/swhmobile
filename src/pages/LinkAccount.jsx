import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Link2, CheckCircle2, Loader2, Mail, AlertCircle, Crown, KeyRound, RefreshCw } from "lucide-react";

const STEPS = { EMAIL: 'email', CODE: 'code', SUCCESS: 'success' };

export default function LinkAccount() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [webUserId, setWebUserId] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const mobileUserId = localStorage.getItem("swh_apple_user_id") || "";

  // Step 1: Send verification code
  const handleSendCode = async () => {
    if (!email.trim()) { setError("Please enter your email."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError("Please enter a valid email address."); return; }
    if (!mobileUserId) { setError("You need to be signed in with Apple first. Go back and sign in."); return; }

    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/sendVerificationCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileUserId, webEmail: email.trim().toLowerCase() }),
      });
      const data = await resp.json();
      if (data.success) {
        setWebUserId(data.webUserId);
        setStep(STEPS.CODE);
        // 60-second resend cooldown
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || "Failed to send code. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code + merge
  const handleVerifyCode = async () => {
    if (!code.trim() || code.trim().length !== 6) { setError("Please enter the 6-digit code from your email."); return; }

    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/linkAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileUserId, webEmail: email.trim().toLowerCase(), code: code.trim() }),
      });
      const data = await resp.json();
      if (data.success) {
        // Update localStorage
        const current = JSON.parse(localStorage.getItem("swh_user") || "{}");
        const updated = { ...current, ...data.user };
        localStorage.setItem("swh_user", JSON.stringify(updated));
        localStorage.setItem("swh_search_credits", String(data.user.search_credits ?? 5));
        if (data.user.email) localStorage.setItem("swh_email", data.user.email);
        window.dispatchEvent(new Event("storage"));
        setSuccess(data);
        setStep(STEPS.SUCCESS);
      } else {
        setError(data.error || "Verification failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setCode("");
    setError("");
    setLoading(true);
    try {
      const resp = await fetch("/api/sendVerificationCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileUserId, webEmail: email.trim().toLowerCase() }),
      });
      const data = await resp.json();
      if (data.success) {
        setWebUserId(data.webUserId);
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col px-6 pt-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => step === STEPS.CODE ? setStep(STEPS.EMAIL) : navigate(-1)}
          className="p-2 rounded-xl bg-gray-800 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <div>
          <h1 className="text-xl font-black">Link Web Account</h1>
          {step === STEPS.CODE && (
            <p className="text-xs text-gray-500 mt-0.5">Check your email for a 6-digit code</p>
          )}
        </div>
      </div>

      {/* Step indicators */}
      {step !== STEPS.SUCCESS && (
        <div className="flex items-center gap-2 mb-8">
          {[STEPS.EMAIL, STEPS.CODE].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                step === s ? 'bg-lime-500 text-gray-950' :
                (i === 0 && step === STEPS.CODE) ? 'bg-lime-500/30 text-lime-400' :
                'bg-gray-800 text-gray-500'
              }`}>
                {i === 0 && step === STEPS.CODE ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs ${step === s ? 'text-white font-semibold' : 'text-gray-600'}`}>
                {s === STEPS.EMAIL ? 'Enter email' : 'Enter code'}
              </span>
              {i === 0 && <div className="w-8 h-px bg-gray-700 mx-1" />}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Email entry ── */}
        {step === STEPS.EMAIL && (
          <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-xl mt-0.5">
                  <Link2 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white mb-1">Already have a web account?</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    If you subscribed or bought credits on the web at{" "}
                    <span className="text-cyan-400 font-medium">sportswagerhelper.com</span>,
                    enter that email below. We'll send a verification code to confirm it's yours, then transfer everything to this device.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { icon: "💳", label: "Active subscription plan" },
                { icon: "⚡️", label: "All purchased credits" },
                { icon: "🔒", label: "Verified with email code" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-300">Web account email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="youremail@example.com"
                  className="w-full pl-11 pr-4 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  onKeyDown={e => e.key === "Enter" && handleSendCode()}
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </div>

            <button
              onClick={handleSendCode}
              disabled={loading || !email.trim()}
              className="w-full py-4 rounded-2xl bg-white text-gray-950 font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              {loading ? "Sending code..." : "Send Verification Code"}
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: Code entry ── */}
        {step === STEPS.CODE && (
          <motion.div key="code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
            <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-xl mt-0.5">
                  <KeyRound className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white mb-1">Check your email</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    We sent a 6-digit code to{" "}
                    <span className="text-cyan-400 font-medium">{email}</span>.
                    It expires in 15 minutes.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-300">6-digit verification code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={e => { setCode(e.target.value.slice(0, 6)); setError(""); }}
                placeholder="• • • • • •"
                className="w-full text-center py-5 bg-gray-900 border border-gray-700 rounded-2xl text-white text-3xl font-black tracking-[12px] placeholder-gray-700 focus:outline-none focus:border-lime-500 transition-colors"
                onKeyDown={e => e.key === "Enter" && handleVerifyCode()}
              />
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-400 text-sm">
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
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
              {loading ? "Linking accounts..." : "Verify & Link Account"}
            </button>

            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
            </button>
          </motion.div>
        )}

        {/* ── SUCCESS ── */}
        {step === STEPS.SUCCESS && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 mt-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}>
              <div className="w-24 h-24 rounded-full bg-lime-500/20 flex items-center justify-center border-2 border-lime-500/40">
                <CheckCircle2 className="w-12 h-12 text-lime-400" />
              </div>
            </motion.div>

            <div className="text-center">
              <h2 className="text-2xl font-black text-lime-400 mb-2">Accounts Linked! 🎉</h2>
              <p className="text-gray-400 text-sm">{success?.message}</p>
            </div>

            <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Plan</span>
                <span className="flex items-center gap-1.5 font-bold text-sm capitalize text-lime-400">
                  <Crown className="w-4 h-4" />
                  {success?.user?.subscription_type || "free"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Credits available</span>
                <span className="font-black text-white">{success?.user?.search_credits ?? success?.user?.credits ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Email</span>
                <span className="font-medium text-sm text-gray-300">{success?.user?.email}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(createPageUrl("Dashboard"), { replace: true })}
              className="w-full py-4 rounded-2xl bg-lime-500 text-gray-950 font-black text-base active:scale-95 transition-transform"
            >
              Go to Dashboard →
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
