import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle } from "lucide-react";

export default function AgeGate() {
  const [showGate, setShowGate] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem("age_verified");
    if (!verified) setShowGate(true);
  }, []);

  const handleConfirm = () => {
    localStorage.setItem("age_verified", "true");
    localStorage.setItem("age_verified_timestamp", Date.now().toString());
    setExiting(true);
    setTimeout(() => setShowGate(false), 400);
  };

  const handleExit = () => {
    window.location.href = "https://www.ncpgambling.org/help-treatment/national-helpline-1-800-522-4700/";
  };

  if (!showGate) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="agegate"
        initial={{ opacity: 0 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}
      >
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 22 }}
          className="relative w-full max-w-sm mx-4"
        >
          <div
            className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ background: "rgba(15,23,42,0.97)", backdropFilter: "blur(20px)" }}
          >
            {/* Header */}
            <div
              className="px-6 pt-10 pb-6 text-center"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2))" }}
            >
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border border-purple-500/40"
                style={{ background: "rgba(124,58,237,0.2)" }}
              >
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Age Verification</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Sports Wager Helper is intended for users <strong className="text-white">18 years of age or older.</strong>
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-4">

              {/* Disclaimer */}
              <div
                className="rounded-xl p-3 border border-yellow-500/20 flex items-start gap-2.5"
                style={{ background: "rgba(234,179,8,0.08)" }}
              >
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-200/70 text-xs leading-relaxed">
                  Sports analytics for <strong>informational purposes only.</strong> Gambling problem?{" "}
                  <strong>Call 1-800-522-4700</strong>
                </p>
              </div>

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                className="w-full py-4 rounded-2xl text-white font-black text-base tracking-wide transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}
              >
                ✓ I confirm I am 18 or older
              </button>

              {/* Exit */}
              <button
                onClick={handleExit}
                className="w-full py-2.5 rounded-xl text-slate-500 text-xs font-semibold hover:text-slate-400 transition-colors"
              >
                I am under 18 — Exit
              </button>

              <p className="text-center text-slate-600 text-[10px]">
                By continuing you agree to our Terms of Service and confirm you meet the minimum age requirement.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
