import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Zap, Globe } from "lucide-react";

const SWH_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png";

export default function Splash() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
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

  const handleSignIn = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  const handleGuest = () => navigate(createPageUrl("Dashboard"), { replace: true });

  if (checking) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <img src={SWH_LOGO} alt="SWH" className="w-20 h-20 rounded-2xl" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-hidden flex flex-col">

      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-lime-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* TOP — Logo + name */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence>
          {ready && (
            <>
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-lime-400/20 rounded-3xl blur-xl scale-110" />
                  <img
                    src={SWH_LOGO}
                    alt="Sports Wager Helper"
                    className="relative w-28 h-28 rounded-3xl border border-lime-500/30 shadow-2xl"
                  />
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                  Sports Wager
                  <br />
                  <span className="text-lime-400">Helper</span>
                </h1>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-xs mx-auto">
                  AI-powered sports analysis in your pocket. Get smarter picks, live odds & player insights.
                </p>
              </motion.div>

              {/* Divider line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="w-16 h-px bg-gradient-to-r from-transparent via-lime-400 to-transparent mt-8 mb-8"
              />

              {/* Feature pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="flex flex-wrap gap-2 justify-center"
              >
                {["AI Match Picks", "Live Odds", "Player Stats", "Team Analysis"].map((f) => (
                  <span
                    key={f}
                    className="text-xs font-semibold text-lime-300/80 bg-lime-500/10 border border-lime-500/20 px-3 py-1 rounded-full"
                  >
                    {f}
                  </span>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM — CTAs */}
      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="px-6 pb-12 flex flex-col gap-3"
          >
            {/* Sign In */}
            <button
              onClick={handleSignIn}
              className="w-full py-4 rounded-2xl bg-lime-400 text-gray-950 font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <LogIn className="w-5 h-5" />
              Sign In / Create Account
            </button>

            {/* Guest */}
            <button
              onClick={handleGuest}
              className="w-full py-4 rounded-2xl bg-gray-800/80 border border-gray-700 text-gray-300 font-bold text-base active:scale-95 transition-transform"
            >
              Browse as Guest
              <span className="text-gray-500 font-normal text-sm ml-1">· 5 free searches</span>
            </button>

            {/* Website FYI */}
            <div className="mt-2 flex items-center justify-center gap-2 text-gray-600 text-xs">
              <Globe className="w-3.5 h-3.5 text-lime-600" />
              <span>
                For the full AI experience, visit{" "}
                <span className="text-lime-500 font-semibold">sportswagerhelper.com</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
