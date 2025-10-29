import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, UserPlus, Sparkles, Zap, Crown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

export function useFreeLookupTracker() {
  const [lookupsRemaining, setLookupsRemaining] = useState(5);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTier, setUserTier] = useState('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          try {
            const user = await base44.auth.me();
            const tier = user.subscription_type || 'free';
            setUserTier(tier);
            
            // Legacy, VIP Annual, and Premium Monthly users have UNLIMITED searches
            if (tier === 'legacy' || tier === 'vip_annual' || tier === 'premium_monthly') {
              setLookupsRemaining(999); // Unlimited
              // Clear any localStorage restrictions for paid users
              localStorage.removeItem('freeLookups');
            } else {
              // Free users - check their usage
              const used = parseInt(localStorage.getItem('freeLookups') || '0');
              setLookupsRemaining(Math.max(0, 5 - used));
            }
          } catch (error) {
            console.error('Error fetching user:', error);
            // If error fetching user, treat as free
            const used = parseInt(localStorage.getItem('freeLookups') || '0');
            setLookupsRemaining(Math.max(0, 5 - used));
          }
        } else {
          // Not authenticated - check localStorage
          const used = parseInt(localStorage.getItem('freeLookups') || '0');
          setLookupsRemaining(Math.max(0, 5 - used));
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const recordLookup = () => {
    // NEVER count lookups for paid tiers
    if (userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly') {
      return true;
    }
    
    // For free users only
    const used = parseInt(localStorage.getItem('freeLookups') || '0');
    if (used >= 5) return false;
    
    localStorage.setItem('freeLookups', (used + 1).toString());
    setLookupsRemaining(Math.max(0, 5 - (used + 1)));
    return true;
  };

  const canLookup = () => {
    // ALWAYS allow paid tiers - this is the critical fix
    if (userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly') {
      return true;
    }
    
    // Check free lookups only for free users
    const used = parseInt(localStorage.getItem('freeLookups') || '0');
    return used < 5;
  };

  return { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier, isLoading };
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
          <Card className="max-w-lg w-full border-2 border-red-500 shadow-2xl shadow-red-500/20">
            <CardHeader className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black mb-2">🔒 Account Locked</CardTitle>
                  <p className="text-lg text-red-100">Subscribe to continue using the app</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <div className="text-8xl font-black text-gray-200">0/5</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-16 h-16 text-red-500 animate-pulse" />
                  </div>
                </div>
                <p className="text-xl text-gray-900 font-bold mb-2">
                  You've used all 5 free lookups!
                </p>
                <p className="text-gray-600">
                  Subscribe now to unlock unlimited access to all features
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 text-center">
                  <div className="text-3xl font-black text-purple-600 mb-1">$19.99</div>
                  <div className="text-sm font-semibold text-gray-900">Premium Monthly</div>
                  <div className="text-xs text-gray-500 mt-1">Cancel anytime</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300 text-center relative">
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    SAVE 37%
                  </div>
                  <div className="text-3xl font-black text-yellow-600 mb-1">$149.99</div>
                  <div className="text-sm font-semibold text-gray-900">VIP Annual</div>
                  <div className="text-xs text-gray-500 mt-1">Billed yearly</div>
                </div>
              </div>

              <div className="space-y-2 mb-6 bg-gray-50 rounded-lg p-4">
                <div className="font-bold text-gray-900 mb-2">With Premium or VIP:</div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Unlimited match predictions</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Unlimited player & team stats</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Live odds comparison</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>AI betting insights & alerts</span>
                </div>
              </div>

              <Button
                onClick={handleViewPricing}
                className="w-full bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 hover:from-red-700 hover:via-orange-700 hover:to-yellow-700 text-white text-xl py-8 font-bold shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40 mb-3"
              >
                <Crown className="w-6 h-6 mr-3" />
                View Plans & Subscribe
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
  // Legacy members - original lifetime VIP
  if (userTier === 'legacy') {
    return (
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 border-b-4 border-yellow-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            <Crown className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">
              👑 LEGACY MEMBER - Lifetime Unlimited Access! 👑
            </span>
            <Crown className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  }

  // VIP Annual members
  if (userTier === 'vip_annual') {
    return (
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 border-b-4 border-indigo-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            <Crown className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">
              💎 VIP ANNUAL MEMBER - Unlimited Access! 💎
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Premium Monthly members
  if (userTier === 'premium_monthly') {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 border-b-4 border-purple-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">
              ⭐ Premium Member - Unlimited Access! ⭐
            </span>
          </div>
        </div>
      </div>
    );
  }

  // IMPORTANT: If user is on any paid tier, don't show free user banner
  // This prevents the "999 free lookups" bug for paid users
  if (userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly') {
    return null;
  }

  // Don't show banner if user has all lookups remaining (hasn't used any yet)
  if (lookupsRemaining === 5) return null;

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
              <Badge className={`${colors.badge} ${colors.text} text-xl font-black px-6 py-3 shadow-lg ${lookupsRemaining <= 2 ? 'animate-pulse' : ''}`}>
                {lookupsRemaining} FREE {lookupsRemaining === 1 ? 'LOOKUP' : 'LOOKUPS'} LEFT!
              </Badge>
              {lookupsRemaining === 0 && (
                <div className="absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                  LOCKED
                </div>
              )}
            </div>
            <div className={colors.text}>
              <p className="text-lg font-bold">
                {lookupsRemaining === 0 
                  ? "Account locked! Subscribe to continue" 
                  : `${lookupsRemaining} free ${lookupsRemaining === 1 ? 'lookup' : 'lookups'} remaining`}
              </p>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <Crown className="w-4 h-4" />
                {lookupsRemaining === 0 ? 'Choose a plan to unlock all features' : 'Subscribe for unlimited access'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignup}
            size="lg"
            className="bg-white hover:bg-gray-100 text-gray-900 font-bold text-lg px-8 py-6 shadow-xl hover:scale-105 transition-all"
          >
            <Crown className="w-5 h-5 mr-2" />
            {lookupsRemaining === 0 ? 'Subscribe Now' : 'Upgrade to Premium'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}