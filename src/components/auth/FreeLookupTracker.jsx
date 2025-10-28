
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, UserPlus, Sparkles, Zap, Crown, Check } from "lucide-react"; // Added Check import
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

export function useFreeLookupTracker() {
  const [lookupsRemaining, setLookupsRemaining] = useState(5);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTier, setUserTier] = useState('free');

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        try {
          const user = await base44.auth.me();
          setUserTier(user.subscription_type || 'free');
          
          // VIP Lifetime and Premium users have unlimited searches
          if (user.subscription_type === 'vip_lifetime' || user.subscription_type === 'premium_monthly') {
            setLookupsRemaining(999); // Unlimited
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      } else {
        const used = parseInt(localStorage.getItem('freeLookups') || '0');
        setLookupsRemaining(Math.max(0, 5 - used));
      }
    };
    
    checkAuth();
  }, []);

  const recordLookup = () => {
    if (userTier === 'vip_lifetime' || userTier === 'premium_monthly') {
      return true; // Unlimited for VIP/Premium
    }
    
    if (!isAuthenticated) {
      const used = parseInt(localStorage.getItem('freeLookups') || '0');
      if (used >= 5) return false;
      
      localStorage.setItem('freeLookups', (used + 1).toString());
      setLookupsRemaining(Math.max(0, 5 - (used + 1)));
      return true;
    }
    
    // For authenticated free users, still track lookups
    return true;
  };

  const canLookup = () => {
    if (userTier === 'vip_lifetime' || userTier === 'premium_monthly') {
      return true; // Unlimited
    }
    
    if (!isAuthenticated) {
      const used = parseInt(localStorage.getItem('freeLookups') || '0');
      return used < 5;
    }
    
    return true; // Authenticated free users can search
  };

  return { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier };
}

export function FreeLookupModal({ show, onClose, lookupsRemaining }) {
  if (!show) return null;

  const handleSignup = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const handleViewPricing = () => {
    window.location.href = '/Pricing';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="max-w-lg w-full border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20">
            <CardHeader className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black mb-2">🔒 Free Lookups Used!</CardTitle>
                  <p className="text-lg text-emerald-100">Upgrade to continue analyzing</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <div className="text-8xl font-black text-gray-200">0/5</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-16 h-16 text-emerald-500 animate-pulse" />
                  </div>
                </div>
                <p className="text-xl text-gray-700 font-semibold">
                  You've used all 5 free lookups!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 text-center">
                  <div className="text-3xl font-black text-purple-600 mb-1">$19.99</div>
                  <div className="text-sm font-semibold text-gray-700">Premium Monthly</div>
                  <div className="text-xs text-gray-500 mt-1">Cancel anytime</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300 text-center relative">
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    SAVE $90
                  </div>
                  <div className="text-3xl font-black text-yellow-600 mb-1">$149.99</div>
                  <div className="text-sm font-semibold text-gray-700">Legacy Annual</div>
                  <div className="text-xs text-gray-500 mt-1">Billed yearly</div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Unlimited match predictions</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Live odds comparison</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Today's Best Bets AI picks</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Parlay Builder & ROI Tracker</span>
                </div>
              </div>

              <Button
                onClick={handleViewPricing}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white text-xl py-8 font-bold shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 mb-3"
              >
                <Crown className="w-6 h-6 mr-3" />
                View Pricing & Subscribe
              </Button>

              <p className="text-center text-sm text-gray-500">
                ✅ 14-day money-back guarantee • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function FreeLookupBanner({ lookupsRemaining, isAuthenticated, userTier }) {
  if (userTier === 'vip_lifetime') {
    return (
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 border-b-4 border-yellow-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            <Crown className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">
              ⭐ LEGACY MEMBER - Unlimited Access Forever! ⭐
            </span>
            <Crown className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  }

  if (userTier === 'premium_monthly') {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 border-b-4 border-purple-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">
              💎 Premium Member - Unlimited Access! 💎
            </span>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Badge className={`${colors.badge} ${colors.text} text-xl font-black px-6 py-3 shadow-lg animate-pulse`}>
                {lookupsRemaining} FREE {lookupsRemaining === 1 ? 'LOOKUP' : 'LOOKUPS'} LEFT!
              </Badge>
              {lookupsRemaining <= 2 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                  HURRY!
                </div>
              )}
            </div>
            <div className={colors.text}>
              <p className="text-lg font-bold">
                {lookupsRemaining === 0 
                  ? "You've used all free lookups!" 
                  : `${lookupsRemaining} free ${lookupsRemaining === 1 ? 'search' : 'searches'} remaining`}
              </p>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <Crown className="w-4 h-4" />
                Sign up now for unlimited access!
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignup}
            size="lg"
            className="bg-white hover:bg-gray-100 text-emerald-700 font-bold text-lg px-8 py-6 shadow-xl hover:scale-105 transition-all"
          >
            <Crown className="w-5 h-5 mr-2" />
            Get Premium Access
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
