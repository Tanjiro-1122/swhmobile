
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, UserPlus, Sparkles, Zap, CreditCard, Star, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

export function useFreeLookupTracker() {
  const [lookupsRemaining, setLookupsRemaining] = useState(5);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isVIP, setIsVIP] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Check if user has premium/VIP subscription
        const user = await base44.auth.me();
        
        // VIP members (lifetime, first 20) or premium monthly subscribers
        const hasVIP = user.vip_member === true || user.subscription_status === 'lifetime_vip';
        const hasPremium = user.subscription_status === 'premium' || hasVIP;
        
        setIsVIP(hasVIP);
        setIsPremium(hasPremium);
        
        if (!hasPremium) {
          // Still track lookups for authenticated free users
          const used = parseInt(localStorage.getItem('freeLookups') || '0');
          setLookupsRemaining(Math.max(0, 5 - used));
        }
      } else {
        const used = parseInt(localStorage.getItem('freeLookups') || '0');
        setLookupsRemaining(Math.max(0, 5 - used));
      }
    };
    
    checkAuth();
  }, []);

  const recordLookup = () => {
    // Premium users (VIP or monthly) have unlimited lookups
    if (isPremium) return true;
    
    const used = parseInt(localStorage.getItem('freeLookups') || '0');
    if (used >= 5) return false;
    
    localStorage.setItem('freeLookups', (used + 1).toString());
    setLookupsRemaining(Math.max(0, 5 - (used + 1)));
    return true;
  };

  const canLookup = () => {
    // Premium users (VIP or monthly) can always lookup
    if (isPremium) return true;
    
    const used = parseInt(localStorage.getItem('freeLookups') || '0');
    return used < 5;
  };

  return { lookupsRemaining, isAuthenticated, isPremium, isVIP, recordLookup, canLookup };
}

export function FreeLookupModal({ show, onClose, lookupsRemaining }) {
  const [totalUsers, setTotalUsers] = React.useState(0);

  React.useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const users = await base44.entities.User.list();
        setTotalUsers(users.length);
      } catch (error) {
        console.log("Could not fetch user count");
      }
    };
    
    if (show) {
      fetchUserCount();
    }
  }, [show]);

  if (!show) return null;

  const spotsRemaining = Math.max(0, 20 - totalUsers);
  const isLifetimeAvailable = spotsRemaining > 0;

  const handleUpgrade = () => {
    // Open Stripe payment link in new tab
    window.open('https://buy.stripe.com/3cIcN74ZLa2c8k68G28N200', '_blank');
  };

  const handleSignup = () => {
    base44.auth.redirectToLogin(window.location.pathname);
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
          className="max-w-2xl w-full"
        >
          <Card className="border-2 border-yellow-500 shadow-2xl shadow-yellow-500/20">
            <CardHeader className="bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black mb-2">🔒 Free Lookups Used!</CardTitle>
                  <p className="text-lg text-yellow-100">Upgrade to continue analyzing</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <div className="text-8xl font-black text-gray-200">0/5</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-16 h-16 text-yellow-500 animate-pulse" />
                  </div>
                </div>
                <p className="text-xl text-gray-700 font-semibold">
                  You've used all your free lookups!
                </p>
              </div>

              {/* Pricing Options */}
              <div className="space-y-4 mb-8">
                {/* Free Account */}
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold">Free Account</span>
                    <Badge className="bg-gray-600">Current</Badge>
                  </div>
                  <p className="text-sm text-gray-600">5 searches, then locked</p>
                </div>

                {/* Lifetime VIP or Monthly Subscription */}
                {isLifetimeAvailable ? (
                  <div className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 rounded-xl border-2 border-green-400 shadow-lg relative overflow-hidden">
                    {/* Animated sparkles background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200 to-green-200 rounded-full blur-3xl opacity-30 animate-pulse" />
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Crown className="w-6 h-6 text-green-600" />
                          <span className="text-2xl font-black text-gray-900">LIFETIME VIP ACCESS</span>
                        </div>
                        <Badge className="bg-green-600 text-white text-lg px-3 py-1 animate-bounce">
                          {spotsRemaining} LEFT
                        </Badge>
                      </div>
                      <div className="text-center mb-4">
                        <div className="text-5xl font-black text-green-600 mb-1">FREE</div>
                        <div className="text-sm text-gray-600 font-semibold">First 20 users only! No subscription dates, no expiration!</div>
                      </div>
                      <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold">Unlimited Match Analysis</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold">Unlimited Player Stats</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold">Unlimited Team Analysis</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold">Save Unlimited Results</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold">VIP Badge</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold">Priority Support</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleSignup}
                        className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white text-lg py-6 font-bold shadow-lg shadow-green-500/30"
                      >
                        <Crown className="w-5 h-5 mr-2" />
                        CLAIM VIP SPOT #{totalUsers + 1}
                      </Button>
                      <p className="text-center text-xs text-gray-500 mt-3">
                        ⏰ Hurry! Only {spotsRemaining} VIP spots left! No credit card, no expiration!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-400 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-600" />
                        <span className="text-2xl font-black text-gray-900">Premium Monthly</span>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-yellow-600">$9.99</div>
                        <div className="text-sm text-gray-600">/month</div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold">Unlimited Match Analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold">Unlimited Player Stats</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold">Unlimited Team Analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold">Save Unlimited Results</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold">Priority Support</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleUpgrade}
                      className="w-full bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 hover:from-yellow-700 hover:via-orange-700 hover:to-yellow-700 text-white text-lg py-6 font-bold shadow-lg shadow-yellow-500/30"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Subscribe for $9.99/month
                    </Button>
                    <p className="text-center text-xs text-gray-500 mt-3">
                      💳 Secure payment via Stripe • Cancel anytime
                    </p>
                  </div>
                )}
              </div>

              {!isLifetimeAvailable && (
                <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-sm text-red-800 font-semibold">
                    😢 Sorry! All 20 lifetime VIP spots have been claimed.
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Monthly subscription is now the only option available.
                  </p>
                </div>
              )}

              {isLifetimeAvailable && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">
                    Don't have an account yet?
                  </p>
                  <Button
                    onClick={handleSignup}
                    variant="outline"
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Free Account First
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function FreeLookupBanner({ lookupsRemaining, isAuthenticated, isPremium, isVIP }) {
  if (isPremium) {
    return (
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 border-b-4 border-yellow-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            {isVIP ? (
              <>
                <Crown className="w-5 h-5 text-white" />
                <span className="text-white font-bold">👑 VIP LIFETIME MEMBER - Unlimited Access Forever</span>
                <Crown className="w-5 h-5 text-white" />
              </>
            ) : (
              <>
                <Star className="w-5 h-5 text-white" />
                <span className="text-white font-bold">⭐ Premium Member - Unlimited Access</span>
                <Star className="w-5 h-5 text-white" />
              </>
            )}
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
                  ? "Upgrade to continue!" 
                  : `${lookupsRemaining} free ${lookupsRemaining === 1 ? 'search' : 'searches'} remaining`}
              </p>
              <p className="text-sm opacity-90">
                {lookupsRemaining === 0 
                  ? "Get unlimited access starting at $9.99/month"
                  : "Sign up for free or upgrade for unlimited!"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignup}
            size="lg"
            className="bg-white hover:bg-gray-100 text-gray-900 font-bold text-lg px-8 py-6 shadow-xl hover:scale-105 transition-all"
          >
            {lookupsRemaining === 0 ? (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Upgrade Now
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Sign Up FREE
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
