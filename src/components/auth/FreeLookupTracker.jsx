import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Crown, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";


// Helper to get the first day of next month
const getNextMonthResetDate = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
};

// Helper to check if we should reset the monthly lookups
const shouldResetMonthlyLookups = (resetDateStr) => {
  if (!resetDateStr) return true; // No reset date set, needs initialization
  const today = new Date();
  const resetDate = new Date(resetDateStr);
  return today >= resetDate;
};

export function useFreeLookupTracker() {
  const [lookupsRemaining, setLookupsRemaining] = useState(5);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTier, setUserTier] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if running in mobile app - comprehensive detection
    const checkMobileApp = () => {
      const hasWTN = typeof window.WTN !== 'undefined';
      const ua = navigator.userAgent || '';
      const isIOSWebView = /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);
      const isAndroidWebView = /Android/.test(ua) && /wv/.test(ua);
      const isStandalone = window.navigator.standalone === true;
      return hasWTN || isIOSWebView || isAndroidWebView || isStandalone;
    };
    setIsMobileApp(checkMobileApp());

    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          try {
            const user = await base44.auth.me();
            setCurrentUser(user);
            const tier = user.subscription_type || 'free';
            setUserTier(tier);
            
            // Check if VIP annual has expired
            if (tier === 'vip_annual' && user.subscription_expiry_date) {
              const expiryDate = new Date(user.subscription_expiry_date);
              if (new Date() > expiryDate) {
                // VIP expired, treat as free user
                setUserTier('free');
                // Continue to free user logic below
              } else {
                setLookupsRemaining(999); // Unlimited - still valid
                setIsLoading(false);
                return;
              }
            } else if (tier === 'influencer' && user.subscription_expiry_date) {
              // Check if influencer access has expired (7 days)
              const expiryDate = new Date(user.subscription_expiry_date);
              if (new Date() > expiryDate) {
                // Influencer expired, treat as free user
                setUserTier('free');
                // Continue to free user logic below
              } else {
                setLookupsRemaining(999); // Unlimited - still valid
                setIsLoading(false);
                return;
              }
            } else if (tier === 'legacy' || tier === 'vip_annual' || tier === 'premium_monthly' || tier === 'influencer') {
              // Legacy, VIP Annual (no expiry set), Premium Monthly, and Influencer users have UNLIMITED searches
              setLookupsRemaining(999); // Unlimited
              setIsLoading(false);
              return;
            }
            
            // Free user logic - check monthly renewable lookups
            let monthlyUsed = user.monthly_free_lookups_used || 0;
            const resetDate = user.free_lookups_reset_date;
            
            // Check if we need to reset monthly lookups
            if (shouldResetMonthlyLookups(resetDate)) {
              // Reset the counter for the new month
              monthlyUsed = 0;
              const newResetDate = getNextMonthResetDate();
              await base44.auth.updateMe({
                monthly_free_lookups_used: 0,
                free_lookups_reset_date: newResetDate
              });
            }
            
            setLookupsRemaining(Math.max(0, 5 - monthlyUsed));
          } catch (error) {
            console.error('Error fetching user:', error);
            // If error fetching user, treat as free with localStorage fallback
            const used = parseInt(localStorage.getItem('freeLookups') || '0');
            setLookupsRemaining(Math.max(0, 5 - used));
          }
        } else {
          // Not authenticated - use localStorage (non-renewable for guests)
          const used = parseInt(localStorage.getItem('freeLookups') || '0');
          setLookupsRemaining(Math.max(0, 5 - used));
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Fallback to localStorage
        const used = parseInt(localStorage.getItem('freeLookups') || '0');
        setLookupsRemaining(Math.max(0, 5 - used));
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const recordLookup = async () => {
    // NEVER count lookups for paid tiers
    if (userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly' || userTier === 'influencer') {
      return true;
    }
    
    // For authenticated free users - update server-side counter
    if (isAuthenticated && currentUser) {
      const currentUsed = currentUser.monthly_free_lookups_used || 0;
      if (currentUsed >= 5) return false;
      
      try {
        await base44.auth.updateMe({
          monthly_free_lookups_used: currentUsed + 1
        });
        setLookupsRemaining(Math.max(0, 5 - (currentUsed + 1)));
        setCurrentUser(prev => ({
          ...prev,
          monthly_free_lookups_used: currentUsed + 1
        }));
        return true;
      } catch (error) {
        console.error('Error updating lookup count:', error);
        return false;
      }
    }
    
    // For non-authenticated users - use localStorage (one-time, non-renewable)
    const used = parseInt(localStorage.getItem('freeLookups') || '0');
    if (used >= 5) return false;
    
    localStorage.setItem('freeLookups', (used + 1).toString());
    setLookupsRemaining(Math.max(0, 5 - (used + 1)));
    return true;
  };

  const canLookup = () => {
    // ALWAYS allow paid tiers
    if (userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly' || userTier === 'influencer') {
      return true;
    }
    
    // For authenticated free users - check server-side counter
    if (isAuthenticated && currentUser) {
      const currentUsed = currentUser.monthly_free_lookups_used || 0;
      return currentUsed < 5;
    }
    
    // For non-authenticated users - check localStorage
    const used = parseInt(localStorage.getItem('freeLookups') || '0');
    return used < 5;
  };

  return { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier, isLoading, isMobileApp };
}

export function FreeLookupModal({ show, onClose, lookupsRemaining, isAuthenticated: isAuthProp }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(isAuthProp ?? false);
  
  useEffect(() => {
    // Check auth if not passed as prop
    if (isAuthProp === undefined) {
      base44.auth.isAuthenticated().then(setIsAuthenticated).catch(() => setIsAuthenticated(false));
    } else {
      setIsAuthenticated(isAuthProp);
    }
  }, [isAuthProp]);

  useEffect(() => {
    const checkMobileApp = () => {
      const hasWTN = typeof window.WTN !== 'undefined';
      const ua = navigator.userAgent || '';
      const isIOSWebView = /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);
      const isAndroidWebView = /Android/.test(ua) && /wv/.test(ua);
      const isStandalone = window.navigator.standalone === true;
      return hasWTN || isIOSWebView || isAndroidWebView || isStandalone;
    };
    setIsMobileApp(checkMobileApp());
  }, []);

  if (!show) return null;

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleSubscribe = async (plan) => {
    setIsProcessing(true);

    try {
      // Check if we're in the iOS/Android app with IAP support
      if (typeof window.WTN !== 'undefined' && window.WTN.inAppPurchase) {
        let productId;
        
        if (plan === 'premium') {
          productId = 'com.sportswagerhelper.premium.monthly';
        } else if (plan === 'vip') {
          productId = 'com.sportswagerhelper.vip.annual';
        }

        window.WTN.inAppPurchase({
          productId: productId,
          callback: async function(data) {
            if (data.isSuccess && data.receiptData) {
              try {
                const response = await base44.functions.invoke('handleAppleIAP', {
                  receipt: data.receiptData,
                  productId: productId
                });

                if (response.data.success) {
                  alert('🎉 Subscription successful! Your account has been upgraded.');
                  // Clear free lookup restrictions
                  localStorage.removeItem('freeLookups');
                  window.location.reload();
                } else {
                  alert('Receipt verification failed. Please contact support.');
                }
              } catch (error) {
                console.error('IAP verification error:', error);
                alert('Failed to verify purchase. Please contact support.');
              }
            } else {
              alert('Purchase was not completed.');
            }
            setIsProcessing(false);
          }
        });
      } else {
        // Web user - redirect to pricing page for Stripe
        window.location.href = '/Pricing';
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="modal-ipad px-4 w-full max-w-lg"
        >
          <Card className="w-full border-2 border-red-500 shadow-2xl shadow-red-500/20 dark:bg-slate-900 dark:border-red-600">
            <CardHeader className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-black mb-1">🔒 Limit Reached</CardTitle>
                  <p className="text-sm sm:text-base text-red-100">Subscribe to continue</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-3">
                  <div className="text-6xl sm:text-7xl font-black text-gray-200">0/5</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-12 h-12 sm:w-14 sm:h-14 text-red-500 animate-pulse" />
                  </div>
                </div>
                <p className="text-lg sm:text-xl text-gray-900 font-bold mb-1">
                  You've used all 5 free lookups!
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  {isAuthenticated 
                    ? "Your 5 free searches reset next month! Subscribe for unlimited." 
                    : "Create a free account to get 5 renewable searches/month, or subscribe for unlimited."}
                </p>
              </div>

              {/* Pricing Options */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleSubscribe('premium')}
                  disabled={isProcessing}
                  className="w-full p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300 hover:border-purple-500 transition-all text-left flex items-center justify-between group disabled:opacity-70"
                >
                  <div>
                    <div className="text-2xl font-black text-purple-600">$19.99<span className="text-sm font-semibold text-gray-500">/month</span></div>
                    <div className="text-sm font-semibold text-gray-900">Premium Monthly</div>
                    <div className="text-xs text-gray-500">Cancel anytime</div>
                  </div>
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleSubscribe('vip')}
                  disabled={isProcessing}
                  className="w-full p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-400 hover:border-yellow-500 transition-all text-left flex items-center justify-between group relative disabled:opacity-70"
                >
                  <div className="absolute -top-2 left-4 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    SAVE 37%
                  </div>
                  <div>
                    <div className="text-2xl font-black text-yellow-600">$149.99<span className="text-sm font-semibold text-gray-500">/year</span></div>
                    <div className="text-sm font-semibold text-gray-900">VIP Annual</div>
                    <div className="text-xs text-gray-500">Best value • Unlimited storage</div>
                  </div>
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6 bg-gray-50 rounded-lg p-4">
                <div className="font-bold text-gray-900 text-sm mb-2">What you get:</div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Unlimited searches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Save & track results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>AI predictions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Live odds</span>
                  </div>
                </div>
              </div>

              {/* Sign up option for unauthenticated users */}
              {!isAuthenticated && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-700 mb-3">
                    <strong>Or create a free account</strong> to get 5 renewable searches every month!
                  </p>
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    variant="outline"
                    className="w-full border-2 border-green-500 text-green-700 hover:bg-green-50"
                  >
                    Create Free Account (5 searches/month)
                  </Button>
                </div>
              )}

              <p className="text-center text-xs text-gray-500 mt-4">
                ✅ 14-day money-back guarantee • Secure payment
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function FreeLookupBanner({ lookupsRemaining, isAuthenticated, userTier }) {
  const [isMobileApp, setIsMobileApp] = useState(false);

  useEffect(() => {
    const checkMobileApp = () => {
      const hasWTN = typeof window.WTN !== 'undefined';
      const ua = navigator.userAgent || '';
      const isIOSWebView = /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);
      const isAndroidWebView = /Android/.test(ua) && /wv/.test(ua);
      const isStandalone = window.navigator.standalone === true;
      return hasWTN || isIOSWebView || isAndroidWebView || isStandalone;
    };
    setIsMobileApp(checkMobileApp());
  }, []);

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

  // Influencer members
  if (userTier === 'influencer') {
    return (
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 border-b-4 border-pink-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">
                🌟 YOU'VE BEEN CHOSEN! 🌟
              </span>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/90 text-sm text-center">
              Enjoy a unique 7-day VIP experience with full access to all features. Thank you for reviewing us!
            </p>
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

  // Don't show banner if user has all lookups remaining (hasn't used any yet)
  if (lookupsRemaining === 5 && userTier === 'free') return null;

  const handleUpgrade = () => {
    window.location.href = '/Pricing';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Badge className={`${colors.badge} ${colors.text} text-base sm:text-xl font-black px-3 sm:px-6 py-2 sm:py-3 shadow-lg ${lookupsRemaining <= 2 ? 'animate-pulse' : ''}`}>
              {lookupsRemaining} FREE LEFT
            </Badge>
            <div className={colors.text}>
              <p className="text-sm sm:text-lg font-bold">
                {lookupsRemaining === 0 
                  ? "Limit reached! Subscribe to continue" 
                  : `${lookupsRemaining} free ${lookupsRemaining === 1 ? 'lookup' : 'lookups'} remaining`}
              </p>
            </div>
          </div>
          <Button
            onClick={handleUpgrade}
            size="sm"
            className="bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-4 shadow-xl hover:scale-105 transition-all"
          >
            <Crown className="w-4 h-4 mr-1 sm:mr-2" />
            {lookupsRemaining === 0 ? 'Subscribe' : 'Upgrade'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}