import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { triggerAppleSignIn } from "@/components/utils/iapBridge";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Zap, Loader2 } from "lucide-react";

const SWH_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png";

export default function Splash() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAppleSignInLoading, setIsAppleSignInLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const check = async () => {
      try {
        const storedUser = localStorage.getItem("swh_user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.id) {
            navigate(createPageUrl("Dashboard"), { replace: true });
            return;
          }
        }
        const isAuth = await base44.auth.isAuthenticated().catch(() => false);
        if (isAuth) {
          navigate(createPageUrl("Dashboard"), { replace: true });
          return;
        }
      } catch {}
      setChecking(false);
      setTimeout(() => setReady(true), 100);
    };
    check();
  }, []);

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

      // Call our Vercel API — fullName comes as a string from the wrapper
      const resp = await fetch("/api/handleAppleSignIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityToken: result.identityToken,
          authorizationCode: result.authorizationCode,
          user: result.user,
          email: result.email,
          // wrapper sends fullName as string e.g. "Javier Huertas"
          fullName: result.fullName,
        }),
      });

      const data = await resp.json();

      if (data?.success) {
        // Save full user object to localStorage — Dashboard reads from here
        const userToStore = {
          ...data.user,
          // Merge existing credits from localStorage if the server shows 5 (default)
          search_credits: Math.max(
            data.user.search_credits ?? 5,
            parseInt(localStorage.getItem("swh_search_credits") || "0", 10)
          ),
        };
        localStorage.setItem("swh_user", JSON.stringify(userToStore));
        localStorage.setItem("swh_apple_user_id", data.user.apple_user_id || "");
        localStorage.setItem("swh_search_credits", String(userToStore.search_credits));
        // ✅ Save display name so Dashboard always shows real name, not Apple ID
        if (userToStore.full_name && !userToStore.full_name.startsWith("Apple_") && !userToStore.full_name.includes("privaterelay")) {
          localStorage.setItem("swh_full_name", userToStore.full_name);
        } else if (result.fullName) {
          localStorage.setItem("swh_full_name", result.fullName);
        }

        // Tell the native wrapper to persist the session too
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
    <AnimatePresence>
      {ready && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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

            <p className="text-center text-gray-600 text-xs mt-2">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
