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

  const getColorScheme = () => {
    if (lookupsRemaining === 0) return {
      bg: 'bg-gradient-to-r from-red-500 to-orange-500',
      border: 'border-red-300',
      badge: 'bg-red-600',
      text: 'text-white'
    };
    if (lookupsRemaining <= 2) return {
      bg: 'bg-gradient-to-r from-orange-500 to-yellow-500',
      border: 'border-orange-300',
      badge: 'bg-orange-600',
      text: 'text-white'
    };
    return {
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      border: 'border-emerald-300',
      badge: 'bg-emerald-600',
      text: 'text-white'
    };
  };

  const colors = getColorScheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colors.bg} border-b-4 ${colors.border} shadow-lg`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <Badge className={`${colors.badge} ${colors.text} text-base md:text-xl font-black px-3 md:px-6 py-1.5 md:py-3 shadow-lg animate-pulse`}>
                {lookupsRemaining} FREE {lookupsRemaining === 1 ? 'LOOKUP' : 'LOOKUPS'} LEFT!
              </Badge>
              {lookupsRemaining <= 2 && (
                <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full animate-bounce">
                  HURRY!
                </div>
              )}
            </div>
            <div className={`${colors.text} hidden sm:block`}>
              <p className="text-sm md:text-lg font-bold">
                {lookupsRemaining === 0 
                  ? "You've used all free lookups!" 
                  : `${lookupsRemaining} free ${lookupsRemaining === 1 ? 'search' : 'searches'} remaining`}
              </p>
              <p className="text-xs md:text-sm opacity-90">
                Sign up now for unlimited match, player & team analysis!
              </p>
            </div>
            {/* Mobile simplified text */}
            <div className={`${colors.text} sm:hidden`}>
              <p className="text-sm font-bold">
                {lookupsRemaining} free left!
              </p>
              <p className="text-xs opacity-90">
                Sign up for unlimited
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignup}
            size="lg"
            className="bg-white hover:bg-gray-100 text-emerald-700 font-bold text-sm md:text-lg px-4 md:px-8 py-3 md:py-6 shadow-xl hover:scale-105 transition-all whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Sign Up FREE Now</span>
            <span className="sm:hidden">Sign Up</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}