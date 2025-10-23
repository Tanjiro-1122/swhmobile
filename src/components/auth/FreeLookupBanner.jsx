import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function FreeLookupBanner({ lookupsRemaining, isAuthenticated }) {
  if (isAuthenticated || lookupsRemaining === 5) return null;

  const handleSignup = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const getWarningLevel = () => {
    if (lookupsRemaining === 0) return "critical";
    if (lookupsRemaining <= 2) return "warning";
    return "info";
  };

  const warningColors = {
    critical: "from-red-500 to-orange-500",
    warning: "from-orange-500 to-yellow-500",
    info: "from-blue-500 to-purple-500"
  };

  const bgColors = {
    critical: "from-red-50 to-orange-50 border-red-200",
    warning: "from-orange-50 to-yellow-50 border-orange-200",
    info: "from-blue-50 to-purple-50 border-blue-200"
  };

  const level = getWarningLevel();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${bgColors[level]} border-b-2`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {lookupsRemaining === 0 ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${warningColors[level]} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                {lookupsRemaining}
              </div>
            )}
            <div>
              <div className="font-bold text-gray-900">
                {lookupsRemaining === 0 
                  ? "No Free Lookups Remaining" 
                  : `${lookupsRemaining} Free ${lookupsRemaining === 1 ? 'Lookup' : 'Lookups'} Remaining`
                }
              </div>
              <div className="text-sm text-gray-700">
                {lookupsRemaining === 0 
                  ? "Sign up now for unlimited access to all features"
                  : "Sign up for unlimited match analysis, player stats, and team analytics"
                }
              </div>
            </div>
          </div>
          <Button
            onClick={handleSignup}
            className={`bg-gradient-to-r ${warningColors[level]} hover:opacity-90 text-white font-bold shadow-lg`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {lookupsRemaining === 0 ? "Sign Up to Continue" : "Sign Up for Unlimited Access"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}