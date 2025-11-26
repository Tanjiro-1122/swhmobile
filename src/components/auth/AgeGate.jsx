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
        className="fixed inset-0 z-[100] bg-black/95 flex items-start justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-md w-full my-2 sm:my-8"
        >
          <Card className="border-2 sm:border-4 border-red-500 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-3 sm:p-6">
              <div className="flex items-center justify-center mb-2 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
              </div>
              <CardTitle className="text-center text-lg sm:text-2xl font-black">
                🔞 AGE VERIFICATION
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
              <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-2 sm:p-3">
                <p className="text-gray-900 font-bold text-center text-sm sm:text-base">
                  You must be 18+ to use this app
                </p>
                <p className="text-gray-600 text-center text-[10px] sm:text-xs">
                  (21+ where required by law)
                </p>
              </div>

              {/* Age Verification Form */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <p className="font-bold text-gray-900 text-sm">Enter your date of birth:</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:border-blue-500"
                  >
                    <option value="">Month</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:border-blue-500"
                  >
                    <option value="">Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {verificationError && (
                  <p className="text-red-600 font-bold text-xs mt-2 text-center">{verificationError}</p>
                )}
              </div>

              <div className="space-y-2 text-[11px] sm:text-xs text-gray-700">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Sports analytics for informational purposes only.</strong> Does not facilitate taking chances.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Gambling problem?</strong> Call <strong>1-800-522-4700</strong>
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    By continuing, you certify you are of legal age and accept our Terms.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleVerify}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm py-3 font-bold shadow-lg"
                >
                  ✅ Verify & Continue
                </Button>

                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="w-full border border-red-400 text-red-700 hover:bg-red-50 text-xs py-2 font-semibold"
                >
                  ❌ I am under 18 / Exit
                </Button>
              </div>

              <p className="text-center text-[9px] sm:text-[10px] text-gray-500">
                Birth date used only for verification, not stored on servers.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}