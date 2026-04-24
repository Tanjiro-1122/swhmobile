import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Crown, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { usePlatform } from "@/components/hooks/usePlatform";
import { triggerAppleSignIn } from "@/components/utils/iapBridge";


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
  const [lookupsRemaining, setLookupsRemaining] = useState(() => { try { const u = parseInt(localStorage.getItem("swh_guest_lookups_used") || "0", 10); return Math.max(0, 5 - u); } catch { return 5; } });
  const [searchCredits, setSearchCredits] = useState(0);
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

        // Mobile fallback: if Base44 SDK session is gone but swh_user is in localStorage, use that
        let localUser = null;
        try {
          const stored = localStorage.getItem('swh_user');
          if (stored) localUser = JSON.parse(stored);
        } catch {}

        const isAuth = authenticated || (localUser?.id != null);
        setIsAuthenticated(isAuth);

        if (isAuth) {
          try {
            let user = authenticated ? await base44.auth.me() : localUser;

            // ✅ FRESH INSTALL / DELETE-AND-REINSTALL RECOVERY
            // If we have an apple_user_id but swh_user credits look like the default (≤5)
            // or the object is sparse, do a DB sync to recover real credits + tier.
            const appleUserId = localStorage.getItem('swh_apple_user_id') || user?.apple_user_id || '';
            const localCredits = parseInt(localStorage.getItem('swh_search_credits') || '0', 10);
            const looksLikeFreshInstall = appleUserId && (!localUser || localCredits <= 5);

            if (looksLikeFreshInstall) {
              try {
                const resp = await fetch('/api/lookupAccount', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ appleUserId }),
                });
                const dbData = await resp.json();
                if (dbData?.success && dbData?.user) {
                  const dbUser = dbData.user;
                  const dbCredits = dbUser.search_credits ?? dbUser.credits ?? 0;
                  // Merge DB data into local user — DB is the source of truth
                  user = { ...user, ...dbUser };
                  // Update localStorage so future reads are correct
                  localStorage.setItem('swh_search_credits', String(dbCredits));
                  try {
                    const stored = localStorage.getItem('swh_user');
                    const merged = stored ? { ...JSON.parse(stored), ...dbUser } : dbUser;
                    localStorage.setItem('swh_user', JSON.stringify(merged));
                  } catch {}
                  console.log('[FreeLookupTracker] ✅ DB sync on fresh install — credits:', dbCredits);
                }
              } catch (syncErr) {
                console.warn('[FreeLookupTracker] DB sync failed (non-fatal):', syncErr.message);
              }
            }

            setCurrentUser(user);
            // Admin users always get unlimited
            const email = user.email || localStorage.getItem('swh_email') || '';
            const isAdmin = email.toLowerCase().includes('huertasfam');
            if (isAdmin) {
              setUserTier('legacy');
              setLookupsRemaining(999);
              setIsLoading(false);
              return;
            }
            const tier = user.subscription_type || 'free';
            setUserTier(tier);

            // Check if VIP annual has expired.
            const vipExpiry = user.subscription_expiry_date || user.subscription_expires_at;
            if (tier === 'vip_annual' && vipExpiry) {
              const expiryDate = new Date(vipExpiry);
              if (new Date() > expiryDate) {
                setUserTier('free');
              } else {
                setLookupsRemaining(999);
                setIsLoading(false);
                return;
              }
            } else if (tier === 'influencer') {
              const influencerExpiry = user.subscription_expiry_date || user.subscription_expires_at;
              if (influencerExpiry) {
                const expiryDate = new Date(influencerExpiry);
                if (new Date() > expiryDate) {
                  setUserTier('free');
                } else {
                  setLookupsRemaining(999);
                  setIsLoading(false);
                  return;
                }
              } else {
                setLookupsRemaining(999);
                setIsLoading(false);
                return;
              }
            } else if (
              tier === 'legacy' || tier === 'vip_annual' || tier === 'premium_monthly' ||
              tier === 'influencer' || tier === 'unlimited_monthly' || tier === 'unlimited_yearly' ||
              tier === 'half_year' || tier === 'basic_monthly'
            ) {
              setLookupsRemaining(999);
              setIsLoading(false);
              return;
            }

            // Free user logic - check monthly renewable lookups
            let monthlyUsed = user.monthly_free_lookups_used || 0;
            const resetDate = user.free_lookups_reset_date;

            if (shouldResetMonthlyLookups(resetDate)) {
              monthlyUsed = 0;
              const newResetDate = getNextMonthResetDate();
              await base44.auth.updateMe({
                monthly_free_lookups_used: 0,
                free_lookups_reset_date: newResetDate
              });
            }

            const credits = user.search_credits || 0;
            setSearchCredits(credits);
            setLookupsRemaining(Math.max(0, 5 - monthlyUsed) + credits);

          } catch (error) {
            console.error('Error fetching user:', error);
            const used = parseInt(localStorage.getItem('freeLookups') || '0');
            setLookupsRemaining(Math.max(0, 5 - used));
          }
        } else {
          // ✅ GUEST FRESH INSTALL RECOVERY
          // Not signed in but we have an apple_user_id in localStorage from wrapper session restore
          const appleUserId = localStorage.getItem('swh_apple_user_id') || '';
          if (appleUserId) {
            try {
              const resp = await fetch('/api/lookupAccount', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appleUserId }),
              });
              const dbData = await resp.json();
              if (dbData?.success && dbData?.user) {
                const dbUser = dbData.user;
                const dbCredits = dbUser.search_credits ?? dbUser.credits ?? 0;
                localStorage.setItem('swh_search_credits', String(dbCredits));
                localStorage.setItem('swh_user', JSON.stringify(dbUser));
                setIsAuthenticated(true);
                setCurrentUser(dbUser);
                setUserTier(dbUser.subscription_type || 'free');
                const monthlyUsed = dbUser.monthly_free_lookups_used || 0;
                setLookupsRemaining(Math.max(0, 5 - monthlyUsed) + dbCredits);
                setIsLoading(false);
                return;
              }
            } catch {}
          }
          const guestUsed = parseInt(localStorage.getItem("swh_guest_lookups_used") || "0", 10); setLookupsRemaining(Math.max(0, 5 - guestUsed));
        }
      } catch (error) {
        console.error('Auth check error:', error);
        const guestUsed3 = parseInt(localStorage.getItem("swh_guest_lookups_used") || "0", 10); setLookupsRemaining(Math.max(0, 5 - guestUsed3));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const recordLookup = async () => {
    // NEVER count lookups for paid tiers
    if (
      userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly' ||
      userTier === 'influencer' || userTier === 'unlimited_monthly' || userTier === 'unlimited_yearly' ||
      userTier === 'half_year' || userTier === 'basic_monthly'
    ) {
      return true;
    }
    
    // For authenticated free users - update server-side counter
    if (isAuthenticated && currentUser) {
      const currentUsed = currentUser.monthly_free_lookups_used || 0;
      const currentCredits = currentUser.search_credits || 0;

      // Use a free monthly lookup first; fall back to purchased credits
      if (currentUsed < 5) {
        try {
          await base44.auth.updateMe({
            monthly_free_lookups_used: currentUsed + 1
          });
          const newUsed = currentUsed + 1;
          setLookupsRemaining(Math.max(0, 5 - newUsed) + currentCredits);
          setCurrentUser(prev => ({
            ...prev,
            monthly_free_lookups_used: newUsed
          }));
          return true;
        } catch (error) {
          console.error('Error updating lookup count:', error);
          return false;
        }
      } else if (currentCredits > 0) {
        // Monthly free lookups exhausted — consume a purchased credit
        const newCredits = currentCredits - 1;
        try {
          await base44.auth.updateMe({
            search_credits: newCredits
          });
          setSearchCredits(newCredits);
          // Free monthly slots are exhausted at this point, so remaining = credits only
          setLookupsRemaining(newCredits);
          setCurrentUser(prev => ({
            ...prev,
            search_credits: newCredits
          }));
          return true;
        } catch (error) {
          console.error('Error consuming search credit:', error);
          return false;
        }
      }

      return false;
    }
    
    // For guest users — decrement local counter
    const used = parseInt(localStorage.getItem('swh_guest_lookups_used') || '0', 10);
    if (used >= 5) return false;
    localStorage.setItem('swh_guest_lookups_used', String(used + 1));
    setLookupsRemaining(prev => Math.max(0, prev - 1));
    return true;
  };

  const canLookup = () => {
    // Debug logging to help diagnose issues
    console.log('[FreeLookupTracker] canLookup check:', { 
      userTier, 
      isAuthenticated, 
      isLoading,
      currentUser: currentUser ? { 
        subscription_type: currentUser.subscription_type,
        monthly_free_lookups_used: currentUser.monthly_free_lookups_used,
        search_credits: currentUser.search_credits
      } : null 
    });
    
    // ALWAYS allow paid tiers
    if (
      userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly' ||
      userTier === 'influencer' || userTier === 'unlimited_monthly' || userTier === 'unlimited_yearly' ||
      userTier === 'half_year' || userTier === 'basic_monthly'
    ) {
      console.log('[FreeLookupTracker] Paid tier detected, allowing lookup');
      return true;
    }
    
    // For authenticated free users - check monthly counter and purchased credits
    if (isAuthenticated && currentUser) {
      const currentUsed = currentUser.monthly_free_lookups_used || 0;
      const currentCredits = currentUser.search_credits || 0;
      console.log('[FreeLookupTracker] Free user, used:', currentUsed, 'credits:', currentCredits);
      return currentUsed < 5 || currentCredits > 0;
    }
    
    // For non-authenticated users - let them try; backend enforces IP limit
    console.log('[FreeLookupTracker] Not authenticated — IP-based limit applies');
    return lookupsRemaining > 0;
  };

  return { lookupsRemaining, searchCredits, isAuthenticated, recordLookup, canLookup, userTier, isLoading, isMobileApp };
}

const CREDIT_PACKS = [
  { id: "small",  credits: 25,  price: 4.99,  productId: "com.sportswagerhelper.credits.25",  label: "Starter",    emoji: "⚡" },
  { id: "medium", credits: 60,  price: 9.99,  productId: "com.sportswagerhelper.credits.60",  label: "Popular",    emoji: "🔥", highlight: true },
  { id: "large",  credits: 100, price: 14.99, productId: "com.sportswagerhelper.credits.100", label: "Best Value", emoji: "👑" },
];

export function FreeLookupModal({ show, onClose, isAuthenticated: isAuthProp }) {
  const [isProcessing, setIsProcessing] = useState(null); // pack id being processed
  const [isAuthenticated, setIsAuthenticated] = useState(isAuthProp ?? false);
  const [isAppleSignInLoading, setIsAppleSignInLoading] = useState(false);
  const [creditsGranted, setCreditsGranted] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const { isIOSNative } = usePlatform();

  useEffect(() => {
    if (isAuthProp === undefined) {
      base44.auth.isAuthenticated().then(setIsAuthenticated).catch(() => setIsAuthenticated(false));
    } else {
      setIsAuthenticated(isAuthProp);
    }
  }, [isAuthProp]);

  if (!show) return null;

  const handleClose = () => {
    if (typeof onClose === 'function') onClose();
  };

  const addCreditsLocally = (amt) => {
    try {
      const existing = parseInt(localStorage.getItem("swh_search_credits") || "0", 10);
      const newTotal = existing + amt;
      localStorage.setItem("swh_search_credits", String(newTotal));
      const stored = localStorage.getItem('swh_user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('swh_user', JSON.stringify({ ...u, search_credits: newTotal }));
      }
    } catch {}
  };

  const handleBuyPack = async (pack) => {
    if (isProcessing) return;
    setIsProcessing(pack.id);
    try {
      const { triggerRevenueCatPurchase, persistCreditsToDB } = await import('@/components/utils/iapBridge');
      const result = await triggerRevenueCatPurchase(pack.productId);
      if (result.success) {
        addCreditsLocally(pack.credits);
        setCreditsGranted(pack.credits);
        setShowSuccess(true);
        const appleUserId = localStorage.getItem('swh_apple_user_id') || '';
        if (appleUserId) persistCreditsToDB(appleUserId, pack.credits, pack.productId).catch(() => {});
      } else if (result.error !== 'user_cancelled') {
        alert(`Purchase failed: ${result.error || 'Unknown error'}. Please try again.`);
      }
    } catch (e) {
      alert('Purchase failed. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleSignInLoading(true);
    try {
      const result = await triggerAppleSignIn();
      if (!result.success) {
        if (result.error !== 'user_cancelled') alert('Apple Sign In failed. Please try again.');
        return;
      }
      const resp = await fetch('/api/handleAppleSignIn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'nativeSignIn',
          identityToken: result.identityToken,
          authorizationCode: result.authorizationCode,
          user: result.user,
          email: result.email,
          fullName: result.fullName,
        }),
      });
      const data = await resp.json();
      if (data?.success) {
        localStorage.setItem('swh_user', JSON.stringify(data.user));
        localStorage.setItem('swh_apple_user_id', data.user.apple_user_id || '');
        localStorage.setItem('swh_search_credits', String(data.user.search_credits ?? 5));
        if (data.sessionToken) { try { await base44.auth.setToken(data.sessionToken); } catch {} }
        if (window.ReactNativeWebView && data.user?.id) {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SAVE_SESSION',
              data: { userId: data.user.id, email: data.user.email || '', isPremium: data.user.subscription_status === 'active', plan: data.user.subscription_type || 'free' }
            }));
          } catch {}
        }
        window.location.reload();
      } else {
        alert(data?.error || 'Sign in failed. Please try again.');
      }
    } catch {
      alert('Apple Sign In failed. Please try again.');
    } finally {
      setIsAppleSignInLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gray-900 border border-cyan-500/40 rounded-3xl p-8 text-center w-full max-w-sm"
          >
            <div className="text-5xl mb-4">⚡️</div>
            <h2 className="text-2xl font-black text-white mb-2">Credits Added!</h2>
            <p className="text-gray-400 text-sm mb-6">
              <span className="text-cyan-400 font-black text-xl">{creditsGranted}</span> search credits added to your account.
            </p>
            <button
              onClick={() => { setShowSuccess(false); handleClose(); window.location.reload(); }}
              className="w-full py-3 rounded-2xl bg-cyan-500 text-gray-950 font-black text-sm"
            >
              Start Searching →
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm"
        >
          <div className="bg-gray-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-lime-500 to-emerald-600 p-6 text-center relative">
              <button onClick={handleClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
                <span className="text-xl font-bold">✕</span>
              </button>
              <div className="text-4xl mb-2">⚡</div>
              <h2 className="text-2xl font-black text-white">Out of Free Searches</h2>
              <p className="text-white/80 text-sm mt-1">
                {isAuthenticated ? "Buy a credit pack — they never expire." : "Sign in to get 5 free/month or buy credits."}
              </p>
            </div>

            <div className="p-5 space-y-3">
              {/* Credit Packs */}
              {CREDIT_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handleBuyPack(pack)}
                  disabled={!!isProcessing}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all disabled:opacity-60 ${
                    pack.highlight
                      ? 'border-lime-500 bg-lime-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div>
                    {pack.highlight && (
                      <span className="text-[10px] font-black bg-lime-500 text-gray-950 px-2 py-0.5 rounded-full uppercase tracking-wide mr-2">Most Popular</span>
                    )}
                    <div className="text-white font-black text-lg mt-1">
                      {pack.emoji} {pack.credits} Credits <span className="text-gray-400 font-semibold text-sm">· ${pack.price}</span>
                    </div>
                    <div className="text-gray-400 text-xs">${(pack.price / pack.credits).toFixed(2)} per search · Never expire</div>
                  </div>
                  {isProcessing === pack.id ? (
                    <Loader2 className="w-6 h-6 text-lime-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${pack.highlight ? 'bg-lime-500' : 'bg-white/10'}`}>
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}

              <div className="border-t border-white/10 pt-3 space-y-2">
                {!isAuthenticated && isIOSNative && (
                  <button
                    onClick={handleAppleSignIn}
                    disabled={isAppleSignInLoading}
                    className="w-full py-3 rounded-2xl bg-black border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2"
                  >
                    {isAppleSignInLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-lg"></span>}
                    Sign in with Apple
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-2xl text-gray-500 text-sm font-medium hover:text-gray-300 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


export function FreeLookupBanner({ lookupsRemaining, userTier }) {

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
  // Don't show banner if user has extra credits beyond the free monthly allowance
  // (they've purchased credits and don't need an upgrade prompt)
  if (lookupsRemaining > 5 && userTier === 'free') return null;

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
