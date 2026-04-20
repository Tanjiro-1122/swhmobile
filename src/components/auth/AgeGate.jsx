import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, Phone } from "lucide-react";

export default function AgeGate() {
  const [showGate, setShowGate] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [error, setError] = useState("");
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem("age_verified");
    if (!verified) setShowGate(true);
  }, []);

  const handleVerify = () => {
    setError("");
    if (!birthYear || !birthMonth) {
      setError("Please select your birth month and year.");
      return;
    }
    const now = new Date();
    let age = now.getFullYear() - parseInt(birthYear);
    if (now.getMonth() + 1 < parseInt(birthMonth)) age--;
    if (age < 18) {
      setError("You must be 18 or older to use this app.");
      return;
    }
    localStorage.setItem("age_verified", "true");
    localStorage.setItem("age_verified_timestamp", Date.now().toString());
    setExiting(true);
    setTimeout(() => setShowGate(false), 400);
  };

  const handleExit = () => {
    window.location.href = "https://www.ncpgambling.org/help-treatment/national-helpline-1-800-522-4700/";
  };

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 18; y >= currentYear - 100; y--) years.push(y);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

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
          {/* Card */}
          <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(20px)" }}>

            {/* Header */}
            <div className="px-6 pt-8 pb-6 text-center"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2))" }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border border-purple-500/40"
                style={{ background: "rgba(124,58,237,0.2)" }}>
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Age Verification</h1>
              <p className="text-slate-400 text-sm mt-1">You must be 18+ to continue</p>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-5">

              {/* DOB selectors */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</p>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={birthMonth}
                    onChange={(e) => { setBirthMonth(e.target.value); setError(""); }}
                    className="w-full px-3 py-3 rounded-xl text-sm font-medium text-white border border-white/10 focus:border-purple-500 focus:outline-none appearance-none"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    <option value="" style={{ background: "#1e293b" }}>Month</option>
                    {months.map((m, i) => (
                      <option key={i} value={i + 1} style={{ background: "#1e293b" }}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={birthYear}
                    onChange={(e) => { setBirthYear(e.target.value); setError(""); }}
                    className="w-full px-3 py-3 rounded-xl text-sm font-medium text-white border border-white/10 focus:border-purple-500 focus:outline-none appearance-none"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    <option value="" style={{ background: "#1e293b" }}>Year</option>
                    {years.map((y) => (
                      <option key={y} value={y} style={{ background: "#1e293b" }}>{y}</option>
                    ))}
                  </select>
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs font-semibold mt-2 text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Disclaimer */}
              <div className="rounded-xl p-3 border border-yellow-500/20 flex items-start gap-2.5"
                style={{ background: "rgba(234,179,8,0.08)" }}>
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-200/70 text-xs leading-relaxed">
                  Sports analytics for <strong>informational purposes only</strong>. Gambling problem? Call <strong>1-800-522-4700</strong>
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleVerify}
                className="w-full py-4 rounded-2xl text-white font-black text-base tracking-wide transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}
              >
                Verify & Enter →
              </button>

              <button
                onClick={handleExit}
                className="w-full py-2.5 rounded-xl text-slate-500 text-xs font-semibold hover:text-slate-400 transition-colors"
              >
                I am under 18 — Exit
              </button>

              <p className="text-center text-slate-600 text-[10px]">
                Date of birth used for verification only. Not stored on our servers.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
