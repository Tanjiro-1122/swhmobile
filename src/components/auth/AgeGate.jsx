import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, CheckCircle, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AgeGate() {
  const [isVerified, setIsVerified] = useState(true);
  const [showGate, setShowGate] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    const verified = localStorage.getItem('age_verified');
    const verifiedTimestamp = localStorage.getItem('age_verified_timestamp');
    
    // Re-verify every 30 days for compliance
    if (verified && verifiedTimestamp) {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (parseInt(verifiedTimestamp) < thirtyDaysAgo) {
        localStorage.removeItem('age_verified');
        localStorage.removeItem('age_verified_timestamp');
        setIsVerified(false);
        setShowGate(true);
        return;
      }
    }
    
    if (!verified) {
      setIsVerified(false);
      setShowGate(true);
    }
  }, []);

  const handleVerify = () => {
    setVerificationError("");
    
    // Validate inputs
    if (!birthYear || !birthMonth) {
      setVerificationError("Please select your birth month and year");
      return;
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const yearNum = parseInt(birthYear);
    const monthNum = parseInt(birthMonth);
    
    // Calculate age
    let age = currentYear - yearNum;
    if (currentMonth < monthNum) {
      age--;
    }
    
    // Must be 18+ (21+ in some jurisdictions, but 18 is baseline)
    if (age < 18) {
      setVerificationError("You must be 18 years or older to use this app");
      return;
    }
    
    // Store verification with timestamp
    localStorage.setItem('age_verified', 'true');
    localStorage.setItem('age_verified_timestamp', Date.now().toString());
    localStorage.setItem('age_verified_year', birthYear);
    setIsVerified(true);
    setTimeout(() => setShowGate(false), 300);
  };

  const handleDecline = () => {
    window.location.href = 'https://www.ncpgambling.org/help-treatment/national-helpline-1-800-522-4700/';
  };

  if (isVerified || !showGate) {
    return null;
  }
  
  // Generate year options (must be at least 18)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 18; y >= currentYear - 100; y--) {
    years.push(y);
  }
  
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-md w-full my-8"
        >
          <Card className="border-4 border-red-500 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl font-black">
                🔞 AGE VERIFICATION REQUIRED
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 sm:p-8 space-y-4 sm:space-y-6">
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-3 sm:p-4">
                <p className="text-gray-900 font-bold text-center text-base sm:text-lg mb-1 sm:mb-2">
                  You must be 18 years or older to use this app
                </p>
                <p className="text-gray-700 text-center text-xs sm:text-sm">
                  (21+ in certain jurisdictions where required by law)
                </p>
              </div>

              {/* Age Verification Form */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <p className="font-bold text-gray-900">Please enter your date of birth:</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Month</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {verificationError && (
                  <p className="text-red-600 font-bold text-sm mt-2 text-center">{verificationError}</p>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>This app provides sports analytics and statistical insights.</strong> It is intended for informational and entertainment purposes only.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>If you or someone you know has a gambling problem,</strong> please seek help by calling <strong>1-800-522-4700</strong>.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    By continuing, you certify that you are of legal age in your jurisdiction and accept our Terms of Service.
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4">
                <p className="text-center text-red-900 font-bold text-xs sm:text-sm">
                  ⚠️ WARNING: This app is NOT available to minors
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Button
                  onClick={handleVerify}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm sm:text-lg py-4 sm:py-6 font-bold shadow-lg"
                >
                  ✅ Verify Age & Continue
                </Button>

                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="w-full border-2 border-red-400 text-red-700 hover:bg-red-50 text-xs sm:text-base py-3 sm:py-5 font-semibold"
                >
                  ❌ I am under 18 / Exit
                </Button>
              </div>

              <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4">
                Your date of birth is used only for age verification and is not stored on our servers.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}