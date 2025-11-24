import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AgeGate() {
  const [isVerified, setIsVerified] = useState(true);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('age_verified');
    if (!verified) {
      setIsVerified(false);
      setShowGate(true);
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem('age_verified', 'true');
    setIsVerified(true);
    setTimeout(() => setShowGate(false), 300);
  };

  const handleDecline = () => {
    window.location.href = 'https://www.ncpgambling.org/help-treatment/national-helpline-1-800-522-4700/';
  };

  if (isVerified || !showGate) {
    return null;
  }

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

              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>This app provides sports betting analysis and predictions.</strong> You must be of legal gambling age in your jurisdiction.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Gambling can be addictive.</strong> If you have a gambling problem, please seek help immediately by calling <strong>1-800-522-4700</strong>.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    By continuing, you certify that you are of legal gambling age and understand the risks associated with sports betting.
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
                  ✅ I am 18+ and understand the risks
                </Button>

                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="w-full border-2 border-red-400 text-red-700 hover:bg-red-50 text-xs sm:text-base py-3 sm:py-5 font-semibold"
                >
                  ❌ I am under 18 / Do not agree
                </Button>
              </div>

              <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4">
                By clicking "I am 18+", you confirm you meet the age requirements and accept our Terms of Service
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}