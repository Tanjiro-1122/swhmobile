import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function FreeLookupBanner({ lookupsRemaining, isAuthenticated }) {
  if (isAuthenticated || lookupsRemaining === 5) return null;

  const handleSignup = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const getColorScheme = () => {
    if (lookupsRemaining === 0) return {
      bg: 'bg-gradient-to-r from-red-600 via-orange-600 to-red-600',
      text: 'text-white',
      badge: 'bg-red-500'
    };
    if (lookupsRemaining <= 2) return {
      bg: 'bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-600',
      text: 'text-white',
      badge: 'bg-orange-500'
    };
    return {
      bg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600',
      text: 'text-white',
      badge: 'bg-emerald-500'
    };
  };

  const colors = getColorScheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colors.bg} border-b border-white/10 shadow-2xl`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Badge className={`${colors.badge} ${colors.text} text-lg sm:text-xl font-black px-4 sm:px-6 py-2 sm:py-3 shadow-xl animate-pulse`}>
                {lookupsRemaining} FREE {lookupsRemaining === 1 ? 'LOOKUP' : 'LOOKUPS'} LEFT!
              </Badge>
              {lookupsRemaining <= 2 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                  HURRY!
                </div>
              )}
            </div>
            <div className={`${colors.text} hidden sm:block`}>
              <p className="text-base sm:text-lg font-bold">
                {lookupsRemaining === 0 
                  ? "You've used all free lookups!" 
                  : `${lookupsRemaining} free ${lookupsRemaining === 1 ? 'search' : 'searches'} remaining`}
              </p>
              <p className="text-sm opacity-90">
                Sign up now for unlimited match, player & team analysis!
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignup}
            size="lg"
            className="bg-white hover:bg-slate-100 text-emerald-700 font-bold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 shadow-2xl hover:scale-105 transition-all"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Sign Up FREE Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}