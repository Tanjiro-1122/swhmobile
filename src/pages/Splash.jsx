import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { triggerAppleSignIn } from "@/components/utils/iapBridge";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Zap, Loader2, Mail, ShieldCheck, Phone } from "lucide-react";

const SWH_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png";

// ─── Age Gate Screen ─────────────────────────────────────────────────────────
function AgeGate({ onConfirm }) {
  const [checked, setChecked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-lime-400" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight mb-2">Age Verification</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Sports Wager Helper provides AI-assisted sports analysis. You must be{" "}
            <span className="text-white font-bold">18 years or older</span> to access this app.
          </p>
        </div>

        {/* Checkbox */}
        <button
          onClick={() => setChecked(!checked)}
          className="w-full flex items-start gap-3 bg-gray-900 border border-gray-700 rounded-2xl p-4 active:scale-95 transition-transform text-left"
        >
          <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
            checked ? "bg-lime-500 border-lime-500" : "border-gray-600"
          }`}>
            {checked && <span className="text-black font-black text-xs">✓</span>}
          </div>
          <p className="text-sm text-gray-300 leading-snug">
            I confirm that I am 18 years of age or older and understand this app provides sports analysis and information only — not financial or betting advice.
          </p>
        </button>

        {/* Responsible gambling */}
        <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
          <p className="text-yellow-400 font-bold text-xs mb-1">⚠️ Responsible Sports Wagering</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Sports wagering should be for entertainment only. This app provides information — always wager responsibly and within your means.
          </p>
          <a
            href="tel:18005224700"
            className="flex items-center justify-center gap-1.5 mt-2 text-yellow-400 font-bold text-xs active:opacity-70"
          >
            <Phone className="w-3 h-3" />
            Problem Gambling Helpline: 1-800-522-4700
          </a>
        </div>

        {/* Legal links */}
        <p className="text-center text-gray-600 text-xs">
          By continuing you agree to our{" "}
          <a href="/TermsOfService" className="text-lime-400 underline">Terms of Service</a>
          {" "}and{" "}
          <a href="/PrivacyPolicy" className="text-lime-400 underline">Privacy Policy</a>.
        </p>

        {/* Confirm button */}
        <button
          onClick={() => { if (checked) onConfirm(); }}
          disabled={!checked}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95 ${
            checked
              ? "bg-lime-500 text-gray-950 shadow-lg shadow-lime-500/20"
              : "bg-gray-800 text-gray-600 cursor-not-allowed"
          }`}
        >
          I'm 18+ — Enter App
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Splash ─────────────────────────────────────────────────────────────
export default function Splash() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAppleSignInLoading, setIsAppleSignInLoading] = useState(false);
  const [error, setError] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        // Only auto-redirect if we have a stored swh_user (explicit login)
        // Do NOT rely on base44.auth alone — it stays true after logout
        const storedUser = localStorage.getItem("swh_user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.id) {
            navigate(createPageUrl("Dashboard"), { replace: true });
            return;
          }
        }
        // If no swh_user in storage, always show sign-in screen regardless of base44 auth state
      } catch {}

      // Check if age was already verified this session
      const alreadyVerified = sessionStorage.getItem("swh_age_verified") === "true";
      if (alreadyVerified) setAgeVerified(true);

      setChecking(false);
      setTimeout(() => setReady(true), 100);
    };
    check();
  }, []);

  const handleAgeConfirm = () => {
    sessionStorage.setItem("swh_age_verified", "true");
    setAgeVerified(true);
  };

  const handleSignIn = async () => {
    setIsAppleSignInLoading(true);
    setError("");
    try {
      const result = await triggerAppleSignIn();

      if (!result.success) {
        if (result.error !== "user_cancelled") {
          setError("Sign in failed. Please try again.");
        }
        return;
      }

      const resp = await fetch("/api/handleAppleSignIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityToken: result.identityToken,
          authorizationCode: result.authorizationCode,
          user: result.user,
          email: result.email,
          fullName: result.fullName,
        }),
      });

      const data = await resp.json();

      if (data?.success) {
        const userToStore = {
          ...data.user,
          search_credits: Math.max(
            data.user.search_credits ?? 5,
            parseInt(localStorage.getItem("swh_search_credits") || "0", 10)
          ),
        };
        localStorage.setItem("swh_user", JSON.stringify(userToStore));
        localStorage.setItem("swh_apple_user_id", data.user.apple_user_id || "");
        localStorage.setItem("swh_search_credits", String(userToStore.search_credits));
        if (userToStore.full_name && !userToStore.full_name.startsWith("Apple_") && !userToStore.full_name.includes("privaterelay")) {
          localStorage.setItem("swh_full_name", userToStore.full_name);
        } else if (result.fullName) {
          localStorage.setItem("swh_full_name", result.fullName);
        }

        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "SAVE_SESSION",
            data: {
              userId: data.user.apple_user_id,
              email: data.user.email,
              isPremium: data.user.subscription_status === "active",
              plan: data.user.subscription_type || "free",
              fullName: data.user.full_name || result.fullName || null,
            },
          }));
        }

        if (data.sessionToken) {
          try { await base44.auth.setToken(data.sessionToken); } catch {}
        }

        navigate(createPageUrl("Dashboard"), { replace: true });
      } else {
        setError(data?.error || "Sign in failed. Please try again.");
      }
    } catch (err) {
      console.error("Apple Sign In error:", err);
      setError("Sign in failed. Please try again.");
    } finally {
      setIsAppleSignInLoading(false);
    }
  };

  const handleGuest = () => {
    navigate(createPageUrl("Dashboard"), { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {/* Step 1: Age Gate */}
      {ready && !ageVerified && (
        <AgeGate key="age-gate" onConfirm={handleAgeConfirm} />
      )}

      {/* Step 2: Sign In */}
      {ready && ageVerified && (
        <motion.div
          key="sign-in"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-between px-6 pt-16 pb-12"
        >
          {/* Logo + title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-lime-500/30 shadow-xl shadow-lime-500/10">
              <img src={SWH_LOGO} alt="SWH" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-tight">Sports Wager Helper</h1>
              <p className="text-gray-400 text-sm mt-1">AI-powered sports intelligence</p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {["Match Analysis", "Player Stats", "AI Predictions", "Live Scores"].map(f => (
                <span key={f} className="text-xs px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                  {f}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full flex flex-col gap-3"
          >
            {error && (
              <p className="text-red-400 text-sm text-center px-4">{error}</p>
            )}

            <button
              onClick={handleSignIn}
              disabled={isAppleSignInLoading}
              className="w-full py-4 rounded-2xl bg-white text-gray-950 font-black text-base flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-60"
            >
              {isAppleSignInLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="text-xl"></span>
              )}
              {isAppleSignInLoading ? "Signing in..." : "Sign in with Apple"}
            </button>

            <button
              onClick={handleGuest}
              className="w-full py-3.5 rounded-2xl border border-gray-700 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Zap className="w-4 h-4 text-lime-400" />
              Continue as Guest (5 free searches)
            </button>

            <button
              onClick={() => {
                const hasAppleId = !!localStorage.getItem("swh_apple_user_id");
                if (!hasAppleId) {
                  alert("⚠️ Sign in with Apple first\n\nTo link your web account, you need to tap \"Sign in with Apple\" above first. Once Apple sign-in is complete, tap this button again to connect your email.");
                  return;
                }
                navigate(createPageUrl("EmailSignIn"));
              }}
              className="text-sm text-gray-500 text-center py-1 active:opacity-70 transition-opacity"
            >
              <span className="text-lime-500 font-semibold">I have a web account</span> — sign in with email
            </button>

            {/* Legal footer */}
            <div className="flex flex-col items-center gap-2 mt-1">
              <p className="text-center text-gray-600 text-xs">
                By continuing you agree to our{" "}
                <a href="/TermsOfService" className="text-lime-400 underline">Terms of Service</a>
                {" "}and{" "}
                <a href="/PrivacyPolicy" className="text-lime-400 underline">Privacy Policy</a>.
              </p>
              <a
                href="tel:18005224700"
                className="flex items-center gap-1.5 text-gray-600 text-xs active:opacity-70"
              >
                <Phone className="w-3 h-3" />
                Problem Gambling Helpline: 1-800-522-4700
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
