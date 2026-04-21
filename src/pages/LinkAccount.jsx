import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Link2, CheckCircle2, Loader2, Mail, AlertCircle, Crown } from "lucide-react";

export default function LinkAccount() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleLink = async () => {
    if (!email.trim()) { setError("Please enter your email."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError("Please enter a valid email address."); return; }

    setLoading(true);
    setError("");
    try {
      const appleUserId = localStorage.getItem("swh_apple_user_id") || "";
      if (!appleUserId) {
        setError("You need to be signed in with Apple first. Go back and sign in.");
        setLoading(false);
        return;
      }

      const resp = await fetch("/api/linkAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileUserId: appleUserId, webEmail: email.trim().toLowerCase() }),
      });
      const data = await resp.json();

      if (data.success) {
        // Update localStorage with merged account data
        const current = JSON.parse(localStorage.getItem("swh_user") || "{}");
        const updated = { ...current, ...data.user };
        localStorage.setItem("swh_user", JSON.stringify(updated));
        localStorage.setItem("swh_search_credits", String(data.user.search_credits ?? 5));
        if (data.user.email) localStorage.setItem("swh_email", data.user.email);
        // Trigger Dashboard to re-read
        window.dispatchEvent(new Event("storage"));
        setSuccess(data);
      } else {
        setError(data.error || "Linking failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col px-6 pt-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-gray-800 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <h1 className="text-xl font-black">Link Web Account</h1>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          // ── Success state ──────────────────────────────────────────────
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 mt-8"
          >
            <div className="w-20 h-20 rounded-full bg-lime-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-lime-400" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-lime-400 mb-2">Accounts Linked! 🎉</h2>
              <p className="text-gray-400 text-sm">{success.message}</p>
            </div>

            {/* Plan + credits summary */}
            <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Plan</span>
                <span className="flex items-center gap-1.5 font-bold text-sm capitalize text-lime-400">
                  <Crown className="w-4 h-4" />
                  {success.user.subscription_type || "free"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Credits available</span>
                <span className="font-black text-white">{success.user.search_credits ?? success.user.credits ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Email</span>
                <span className="font-medium text-sm text-gray-300">{success.user.email}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(createPageUrl("Dashboard"), { replace: true })}
              className="w-full py-4 rounded-2xl bg-lime-500 text-gray-950 font-black text-base active:scale-95 transition-transform"
            >
              Go to Dashboard →
            </button>
          </motion.div>
        ) : (
          // ── Input state ────────────────────────────────────────────────
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Explanation card */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-xl mt-0.5">
                  <Link2 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white mb-1">Already have a web account?</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    If you subscribed or bought credits on{" "}
                    <span className="text-cyan-400 font-medium">sports-wager-helper.vercel.app</span>,
                    enter that email below and we'll transfer everything — your plan, credits, and history — to this device.
                  </p>
                </div>
              </div>
            </div>

            {/* What gets transferred */}
            <div className="flex flex-col gap-2">
              {[
                { icon: "💳", label: "Active subscription plan" },
                { icon: "⚡️", label: "All purchased credits" },
                { icon: "🔒", label: "Account stays secure" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Email input */}
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
                  onKeyDown={e => e.key === "Enter" && handleLink()}
                  autoComplete="email"
                  inputMode="email"
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
              onClick={handleLink}
              disabled={loading || !email.trim()}
              className="w-full py-4 rounded-2xl bg-white text-gray-950 font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
              {loading ? "Linking accounts..." : "Link My Account"}
            </button>

            <p className="text-center text-gray-600 text-xs">
              Make sure to use the email you signed up with on the website.{"\n"}
              Don't have a web account?{" "}
              <button
                onClick={() => navigate(createPageUrl("Pricing"))}
                className="text-cyan-400 underline"
              >
                See plans
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
