import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Crown, Sparkles, Check, Star, Loader2, ExternalLink, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { usePlatform } from '@/components/hooks/usePlatform';

import RestorePurchasesModal from "@/components/hub/RestorePurchasesModal";
import { callNativeIAPWithCallback, submitReceiptToServer } from "@/components/utils/iapBridge";

export default function Pricing() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [processingItem, setProcessingItem] = useState(null);
  
  
  
  const [iapReady, setIapReady] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  
  const iapTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const { isIOSNative, isAndroidNative, isWeb, isNativeApp, isIOSDevice, isAndroidDevice } = usePlatform();

  useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_cancelled') === 'true') {
      setPaymentCancelled(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (iapTimeoutRef.current) {
        clearTimeout(iapTimeoutRef.current);
        iapTimeoutRef.current = null;
      }
      // Clear processing state on unmount
      setProcessingItem(null);
    };
  }, []);

  useEffect(() => {
    // Check if running in native app (not just mobile browser)
    
    
    
    
    // CRITICAL: Only consider it a native app if WTN explicitly sets isNativeApp flag
    // This prevents mobile web browsers from being detected as native apps
    // WebToNative should set window.WTN.isNativeApp = true in native environment
    
    
    
    
    
     

    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      // Check if user just logged in and has a pending Stripe plan (web only)
      if (authenticated && isWeb) {
                    const pendingPlan = localStorage.getItem('pending_stripe_plan');
                    if (pendingPlan === 'premium' || pendingPlan === 'vip') {
                      const withTrial = localStorage.getItem('pending_stripe_trial') === 'true';
                      localStorage.removeItem('pending_stripe_plan');
                      localStorage.removeItem('pending_stripe_trial');
                      // Trigger Stripe checkout directly
                      startStripeCheckout(pendingPlan, withTrial);
                    }
                  }
    };
    checkAuth();
    
    // Only check for IAP readiness if we detected a native app
    if (isNativeApp) {
      const checkIAPReady = () => {
        const wtnExists = typeof window.WTN !== 'undefined';
        const iapExists = wtnExists && typeof window.WTN.inAppPurchase === 'function';
        setIapReady(iapExists);
        return iapExists;
      };
      
      checkIAPReady();
      let attempts = 0;
      const maxAttempts = 30;
      const interval = setInterval(() => {
        attempts++;
        if (checkIAPReady() || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 500);
      
      return () => clearInterval(interval);
    } else {
      // Force Stripe for web browsers
      
    }
  }, []);
  
  // Focus/visibility guard to clear stale processing state
  useEffect(() => {
    const onFocus = () => {
      if (processingItem) {
        // Allow brief delay for real callbacks
        setTimeout(() => {
          if (isMountedRef.current && processingItem) {
            const pending = localStorage.getItem('pending_iap_product');
            if (!pending) {
              setProcessingItem(null);
            }
          }
        }, 1000);
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [processingItem]);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const handleLogin = () => {
    // Use current full URL for redirect after login
    base44.auth.redirectToLogin(window.location.href);
  };

  // Helper function to start Stripe checkout (used after login redirect)
  const startStripeCheckout = async (plan, trial = false) => {
            setProcessingItem(plan);

            try {
              let priceId;
              let mode;

              if (plan === 'premium') {
                priceId = 'price_1SN2OGRrQjRM0rB2u6TnCiP8';
                mode = 'subscription';
              } else if (plan === 'vip') {
                priceId = 'price_1SN2OrRrQjRM0rB2FrP8gDYp';
                mode = 'payment';
              }

              console.log('Creating Stripe checkout session...', { priceId, mode, trial });

              const response = await base44.functions.invoke('createCheckoutSession', {
                priceId,
                mode,
                trial: trial && plan === 'premium',
              });
      
      console.log('Checkout session response:', response);
      
      if (response.data?.url) {
        if (response.data.already_subscribed) {
          alert("You already have an active subscription. You will be redirected to manage it.");
        }
        console.log('Redirecting to Stripe:', response.data.url);
        window.location.href = response.data.url;
      } else if (response.data?.error) {
        console.error('Checkout session error:', response.data.error);
        alert(`Checkout failed: ${response.data.error}`);
        setProcessingItem(null);
      } else {
        console.error('No checkout URL returned:', response);
        alert('Failed to create checkout session. Please try again.');
        setProcessingItem(null);
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      alert(`Error: ${error.message || 'Failed to start checkout'}`);
      setProcessingItem(null);
    }
  };

  // Stripe checkout for web users
  const handleStripeCheckout = async (plan, trial = false) => {
            // If not authenticated, store plan and redirect to login
            if (!isAuthenticated) {
              localStorage.setItem('pending_stripe_plan', plan);
              if (trial) {
                localStorage.setItem('pending_stripe_trial', 'true');
              }
              base44.auth.redirectToLogin(window.location.href);
              return;
            }

            // Already authenticated - go directly to Stripe
            try {
              await startStripeCheckout(plan, trial);
            } catch (err) {
              console.error('Stripe checkout failed:', err);
              alert('Failed to start checkout. Please try again or contact support if the issue persists.');
              setProcessingItem(null);
            }
          };

  // Cancel purchase and clear state
  const cancelPurchase = () => {
    // Try native cancel methods if the bridge exposes one
    try {
      if (typeof window !== 'undefined' && window.WTN) {
        if (typeof window.WTN.cancelPurchase === 'function') {
          window.WTN.cancelPurchase();
        } else if (typeof window.WTN.dismissIAP === 'function') {
          window.WTN.dismissIAP();
        } else if (typeof window.WTN.closePurchase === 'function') {
          window.WTN.closePurchase();
        }
      }
    } catch (err) {
      console.warn('Native cancel call failed or not available', err);
    }

    // Clear safety timeout
    if (iapTimeoutRef.current) {
      clearTimeout(iapTimeoutRef.current);
      iapTimeoutRef.current = null;
    }

    // Clear the UI processing flags
    setProcessingItem(null);
  };

  // IAP for native app users only - ANDROID ONLY (iOS subscriptions removed)
  const handleIAPSubscribe = async (plan) => {
    // iOS: Redirect to web for subscriptions
    if (isIOSNative) {
      alert('iOS subscriptions are not available. Please use credit packs or visit our website for subscriptions.');
      return;
    }

    setProcessingItem(plan);

    // Clear any previous timeout
    if (iapTimeoutRef.current) {
      clearTimeout(iapTimeoutRef.current);
      iapTimeoutRef.current = null;
    }

    // Safety timeout - keep shorter since bridge has its own timeout
    iapTimeoutRef.current = setTimeout(() => {
      iapTimeoutRef.current = null;
      if (isMountedRef.current && processingItem) {
        console.log('Page-level IAP timeout - clearing processing state');
        setProcessingItem(null);
      }
    }, 20000);

    try {
      
      

      // Verify native bridge exists
      const hasNativeIAP = typeof window !== 'undefined' &&
                           typeof window.WTN !== 'undefined' &&
                           typeof window.WTN.inAppPurchase === 'function';

      if (!hasNativeIAP) {
        if (iapTimeoutRef.current) {
          clearTimeout(iapTimeoutRef.current);
          iapTimeoutRef.current = null;
        }
        alert('Native in-app purchase is not available. Please use the mobile app.');
        setProcessingItem(null);
        return;
      }

      let productId;
      if (isAndroidNative) {
        productId = plan === 'premium' 
          ? 'com.sportswagerhelper.premium.monthly'
          : 'com.sportswagerhelper.vip.annual';
      }

      const iapConfig = {
        productId: productId,
        productType: 'SUBS',
        isConsumable: false
      };

      await callNativeIAPWithCallback(iapConfig, function handleIAPCallback(data) {
        // Clear timeout
        if (iapTimeoutRef.current) {
          clearTimeout(iapTimeoutRef.current);
          iapTimeoutRef.current = null;
        }

        // Don't process if component unmounted (user navigated away)
        if (!isMountedRef.current) {
          console.log('IAP callback ignored - component unmounted');
          return;
        }
        
        // Handle success
        if (data.isSuccess && (data.receiptData || data.purchaseToken)) {
          if (data.receiptData) {
            submitReceiptToServer({
              receipt: data.receiptData,
              productId: data.productId || productId,
              platform: 'ios'
            });
          } else if (data.purchaseToken) {
            submitReceiptToServer({
              purchaseToken: data.purchaseToken,
              productId: data.productId || productId,
              platform: 'android'
            });
          }

          // Store minimal markers only
          localStorage.setItem('pending_iap_product', data.productId || productId);
          localStorage.setItem('pending_iap_platform', data.platform || (isAndroidDevice ? 'android' : 'ios'));
          window.location.href = '/PostPurchaseSignIn';
          return;
        }

        // Handle user cancellation (dismiss payment sheet)
        const userCancelled = data.error === 'user_cancelled' || 
                             data.error === 'cancelled' || 
                             data.isCancelled === true ||
                             data.error === 'payment_cancelled' ||
                             data.error === 'User cancelled' ||
                             data.status === 'cancelled';
        if (userCancelled) {
          console.log('User cancelled purchase');
          setProcessingItem(null);
          alert('Purchase cancelled. You can select another plan or try again anytime.');
          return;
        }

        // Clear state on any other error
        console.error('Purchase failed:', data.error);
        setProcessingItem(null);
        if (data.error) {
          alert(`Purchase failed: ${data.error}. Please try again.`);
        }
      });
    } catch (error) {
      if (iapTimeoutRef.current) {
        clearTimeout(iapTimeoutRef.current);
        iapTimeoutRef.current = null;
      }
      console.error('IAP Error:', error);
      setProcessingItem(null);
    }
  };

  // Main subscribe handler - routes to Stripe or IAP based on platform detection
  const handleSubscribe = async (plan, trial = false) => {
            // On web, always use Stripe
            if (isWeb || !isNativeApp) {
              console.log('Using Stripe for web');
              try {
                await handleStripeCheckout(plan, trial);
              } catch (err) {
                console.error('Stripe checkout failed:', err);
                setProcessingItem(null);
              }
              return;
            }

            // Native App IAP Logic
            if (isNativeApp && iapReady) {
                console.log('Using IAP for native app');
                // Note: IAP trial logic is separate and not part of this change.
                await handleIAPSubscribe(plan); 
            } else if (isNativeApp && !iapReady) {
                alert("In-app purchasing is currently unavailable. Please try again later.");
            }
          };

  const handleBuyCredits = async (pack) => {
    // Credit packs are only available on mobile via IAP
    if (!isNativeApp) {
      return;
    }

    setProcessingItem(pack.id);

    try {
      
      

      const iapConfig = {
        productId: pack.productId,
        productType: isAndroidNative ? 'INAPP' : undefined,
        isConsumable: true
      };

      function handleIAPCallback(data) {
        if (data.isSuccess && (data.receiptData || data.purchaseToken)) {
          // Immediately submit to server for verification
          if (data.receiptData) {
            submitReceiptToServer({
              receipt: data.receiptData,
              productId: data.productId || pack.productId,
              platform: 'ios'
            });
          } else if (data.purchaseToken) {
            submitReceiptToServer({
              purchaseToken: data.purchaseToken,
              productId: data.productId || pack.productId,
              platform: 'android'
            });
          }
          
          // Keep small marker only (avoid large base64 in localStorage)
          localStorage.setItem('pending_iap_product', data.productId || pack.productId);
          localStorage.setItem('pending_iap_platform', data.platform || (isAndroidDevice ? 'android' : 'ios'));
          localStorage.setItem('pending_iap_credits', pack.credits.toString());
          window.location.href = '/PostPurchaseSignIn';
        } else {
          // Handle cancellation
          const userCancelled = data.error === 'user_cancelled' || 
                               data.error === 'cancelled' || 
                               data.isCancelled === true ||
                               data.error === 'payment_cancelled' ||
                               data.error === 'User cancelled' ||
                               data.status === 'cancelled';
          if (userCancelled) {
            console.log('User cancelled credit purchase');
            setProcessingItem(null);
            alert('Purchase cancelled. You can select another pack or try again anytime.');
          } else {
            console.error('Credit purchase failed:', data.error);
            setProcessingItem(null);
            if (data.error) {
              alert(`Purchase failed: ${data.error}. Please try again.`);
            }
          }
        }
      }

      await callNativeIAPWithCallback(iapConfig, handleIAPCallback);
    } catch (error) {
      console.error('Credit purchase error:', error);
      setProcessingItem(null);
    }
  };

  const features = {
            free: [
              "Explore AI with limited free match predictions",
              "Get stats on 5 players",
              "Analyze 5 teams for free",
              "Access the basic odds calculator",
              "Join the community forum",
              "30-day saved results retention"
            ],
            premium: [
              "Access immediately",
              "Unlock unlimited AI match predictions",
              "Access unlimited player stats",
              "Deep-dive with unlimited team analysis",
              "Find the best odds with live comparison",
              "Get daily AI Top Predictions",
              "Analyze parlays with the multi-pick tool",
              "Track your performance and ROI",
              "Manage your betting with the budget tool",
              "Save & track unlimited results",
              "Receive priority support"
            ],
            vip: [
              "Everything in Premium, plus:",
              "Huge savings with annual billing",
              "Save $90/year vs monthly plan",
              "Get a VIP MEMBER badge",
              "Receive Daily AI Insight Briefs",
              "Track Sharp vs Public Money indicators",
              "Get early access to new features",
              "Enjoy priority AI processing queue",
              "Join the exclusive VIP Discord channel",
              "Receive lifetime feature updates",
              "Keep your results forever with UNLIMITED retention"
            ]
            };

    const creditPacks = [
    { id: 'small', credits: 25, price: 4.99, productId: 'com.sportswagerhelper.credits.25' },
    { id: 'medium', credits: 60, price: 9.99, productId: 'com.sportswagerhelper.credits.60' },
    { id: 'large', credits: 100, price: 14.99, productId: 'com.sportswagerhelper.credits.100' }
    ];

  const currentPlan = currentUser?.subscription_type || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-16">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-2 mb-4">
            PRICING
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Get unlimited AI-powered sports analytics and smart tools for better insights
          </p>
          <link rel="preload" as="image" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png" fetchpriority="high" />
        {paymentCancelled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-red-100 border-2 border-red-300 text-red-800 p-4 rounded-lg text-center font-semibold"
          >
            Your payment was cancelled. You can try again anytime.
          </motion.div>
        )}
        </div>

        {/* Legacy Member Notice */}
        {currentPlan === 'legacy' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Crown className="w-12 h-12 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl lg:text-2xl font-black text-gray-900">You're a Legacy Member! 👑</h3>
                    <p className="text-gray-700 text-base lg:text-lg">
                      You have lifetime unlimited access as one of our original supporters.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pricing Cards - Improved iPad layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="md:col-span-1"
          >
            <Card className={`h-full border-2 ${currentPlan === 'free' ? 'border-blue-500 shadow-xl' : 'border-gray-200'}`}>
              <CardHeader className="text-center p-6 lg:p-8">
                <Sparkles className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-4 text-blue-500" />
                <CardTitle className="text-2xl lg:text-3xl font-black mb-2">Free</CardTitle>
                <div className="text-4xl lg:text-5xl font-black text-gray-900 mb-2">$0</div>
                <div className="text-sm lg:text-base text-gray-600">Limited Free Access</div>
              </CardHeader>
              <CardContent className="p-6 lg:p-8">
                <ul className="space-y-3 mb-8">
                  {features.free.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm lg:text-base text-gray-700">
                      <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentPlan === 'free' ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-600 cursor-not-allowed py-6 text-base">
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 py-6 text-base"
                    disabled
                  >
                    Already Upgraded
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium Monthly - Hide on iOS */}
          {!isIOSDevice && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-1"
            >
              <Card className={`h-full border-2 ${currentPlan === 'premium_monthly' ? 'border-purple-500 shadow-2xl' : 'border-purple-200'} relative`}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 lg:px-6 py-2 text-xs lg:text-sm font-bold shadow-lg whitespace-nowrap">
                    MOST POPULAR
                  </Badge>
                </div>
                <CardHeader className="text-center p-6 lg:p-8 bg-gradient-to-br from-purple-50 to-pink-50 pt-8">
                  <Star className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-4 text-purple-600" />
                  <CardTitle className="text-2xl lg:text-3xl font-black mb-2">Premium</CardTitle>
                                        <div className="text-4xl lg:text-5xl font-black text-gray-900 mb-2">$19.99<span className="text-base lg:text-xl font-semibold text-gray-600">/month</span></div>
                                        <div className="text-sm lg:text-base text-gray-600">Billed monthly</div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8">
                  <ul className="space-y-3 mb-8">
                    {features.premium.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm lg:text-base text-gray-700">
                        <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {currentPlan === 'premium_monthly' ? (
                    <Button disabled className="w-full bg-gray-200 text-gray-600 cursor-not-allowed py-6 text-base">
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                                                onClick={() => handleSubscribe('premium')}
                                                disabled={processingItem !== null}
                                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-base lg:text-lg shadow-lg disabled:opacity-70"
                                              >
                                                {processingItem === 'premium' ? (
                                                  <div className="flex items-center gap-2">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Processing...
                                                  </div>
                                                ) : (
                                                  'Get Premium'
                                                )}
                                              </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* VIP Annual - Hide on iOS */}
          {!isIOSDevice && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 lg:col-span-1"
            >
              <Card className={`h-full border-2 ${currentPlan === 'vip_annual' ? 'border-yellow-500 shadow-2xl' : 'border-yellow-200'} relative`}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 lg:px-6 py-2 text-xs lg:text-sm font-bold shadow-lg animate-pulse whitespace-nowrap">
                    💎 BEST VALUE
                  </Badge>
                </div>
                <CardHeader className="text-center p-6 lg:p-8 bg-gradient-to-br from-yellow-50 to-orange-50 pt-8">
                  <Crown className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-4 text-yellow-600" />
                  <CardTitle className="text-2xl lg:text-3xl font-black mb-2">VIP Annual</CardTitle>
                  <div className="text-4xl lg:text-5xl font-black text-gray-900 mb-2">$149.99</div>
                  <div className="text-sm lg:text-base text-gray-600">/year • Billed annually</div>
                  <div className="mt-3">
                    <Badge className="bg-green-100 text-green-800 border-green-300 text-sm">
                      Save 37% vs Monthly
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8">
                  <ul className="space-y-3 mb-8">
                    {features.vip.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm lg:text-base text-gray-700">
                        <Check className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {currentPlan === 'vip_annual' ? (
                    <Button disabled className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-6 cursor-not-allowed opacity-75 text-base">
                      ⭐ You're a VIP Member!
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleSubscribe('vip')}
                      disabled={processingItem !== null}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-6 text-base lg:text-lg shadow-lg disabled:opacity-70"
                    >
                      {processingItem === 'vip' ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        'Upgrade to VIP'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Feature Comparison - Better iPad readability */}
        <Card className="border-2 border-gray-200 mb-12 lg:mb-16 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-xl lg:text-2xl font-bold text-center">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-8">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-3 lg:px-4 font-bold text-gray-900 text-sm lg:text-base">Feature</th>
                    <th className="text-center py-4 px-3 lg:px-4 font-bold text-gray-900 text-sm lg:text-base">Free</th>
                    <th className="text-center py-4 px-3 lg:px-4 font-bold text-purple-600 text-sm lg:text-base">Premium</th>
                    <th className="text-center py-4 px-3 lg:px-4 font-bold text-yellow-600 text-sm lg:text-base">VIP</th>
                  </tr>
                </thead>
                <tbody className="text-sm lg:text-base">
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-3 lg:px-4">Match Predictions</td>
                    <td className="text-center py-4 px-3 lg:px-4">5 free</td>
                    <td className="text-center py-4 px-3 lg:px-4 text-purple-600 font-bold">Unlimited</td>
                    <td className="text-center py-4 px-3 lg:px-4 text-yellow-600 font-bold">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-3 lg:px-4">Player & Team Stats</td>
                    <td className="text-center py-4 px-3 lg:px-4">5 free</td>
                    <td className="text-center py-4 px-3 lg:px-4 text-purple-600 font-bold">Unlimited</td>
                    <td className="text-center py-4 px-3 lg:px-4 text-yellow-600 font-bold">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-yellow-50">
                    <td className="py-4 px-3 lg:px-4 font-bold">Saved Results</td>
                    <td className="text-center py-4 px-3 lg:px-4">30 days</td>
                    <td className="text-center py-4 px-3 lg:px-4">30 days</td>
                    <td className="text-center py-4 px-3 lg:px-4 text-yellow-600 font-bold">Forever</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-3 lg:px-4">AI Predictions</td>
                    <td className="text-center py-4 px-3 lg:px-4">❌</td>
                    <td className="text-center py-4 px-3 lg:px-4">✅</td>
                    <td className="text-center py-4 px-3 lg:px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-3 lg:px-4">VIP Features</td>
                    <td className="text-center py-4 px-3 lg:px-4">❌</td>
                    <td className="text-center py-4 px-3 lg:px-4">❌</td>
                    <td className="text-center py-4 px-3 lg:px-4 text-yellow-600 font-bold">✅</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-3 lg:px-4 font-bold">Annual Cost</td>
                    <td className="text-center py-4 px-3 lg:px-4 font-bold">$0</td>
                    <td className="text-center py-4 px-3 lg:px-4 font-bold text-purple-600">$239.88</td>
                    <td className="text-center py-4 px-3 lg:px-4 font-bold text-yellow-600">$149.99</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Search Credit Packs - Only show on mobile */}
        {isNativeApp && (
          <Card className="border-2 border-cyan-200 mb-12 lg:mb-16">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              <CardTitle className="text-xl lg:text-2xl font-bold text-center flex items-center justify-center gap-2">
                <Zap className="w-6 h-6" />
                Search Credit Packs
              </CardTitle>
              <p className="text-center text-white/90 text-sm mt-2">
                Not ready for a subscription? Buy credits as you go!
              </p>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                {creditPacks.map((pack) => (
                  <Card key={pack.id} className="border-2 border-cyan-100 hover:border-cyan-300 transition-all bg-white dark:bg-slate-900">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-black text-cyan-600 dark:text-cyan-400 mb-2">{pack.credits}</div>
                      <div className="text-gray-700 dark:text-gray-300 font-semibold mb-4">Search Credits</div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white mb-4">${pack.price.toFixed(2)}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                        ${(pack.price / pack.credits).toFixed(2)} per search
                      </div>
                      <Button
                        onClick={() => handleBuyCredits(pack)}
                        disabled={processingItem !== null}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold"
                      >
                        {processingItem === pack.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          `Buy ${pack.credits} Credits`
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-center text-gray-500 text-sm mt-6">
                Credits never expire • Use anytime • No subscription required
              </p>
            </CardContent>
          </Card>
        )}

        {/* FAQs - Improved readability */}
        <Card className="border-2 border-gray-200 mb-8">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-xl lg:text-2xl font-bold text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="p-6 lg:p-8">
            <div className="space-y-6 lg:space-y-8">
              <div>
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2">What happens after I use my 5 free lookups?</h3>
                <p className="text-gray-700 text-sm lg:text-base">Your account will be locked and you'll need to subscribe to Premium or VIP to continue using the app.</p>
              </div>
              
              <div>
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-700 text-sm lg:text-base">Yes! Premium Monthly can be cancelled anytime. VIP Annual is billed yearly but you can still cancel before the next renewal.</p>
              </div>

              <div>
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2">What's the difference between Premium and VIP?</h3>
                <p className="text-gray-700 text-sm lg:text-base">Both have unlimited access to all core features. VIP Annual saves you 37% vs Premium Monthly, PLUS you get exclusive perks like Daily AI Insight Briefs, VIP Discord access, and unlimited saved results retention.</p>
              </div>

              <div>
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-700 text-sm lg:text-base">
                  {isIOSDevice 
                    ? "Payments are securely processed through the App Store using your Apple ID."
                    : isAndroidDevice
                    ? "Payments are securely processed through Google Play."
                    : isWeb
                    ? "Payments are securely processed via Stripe for web-based transactions."
                    : "Unsupported platform for payment."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Details */}
        <Card className="border-2 border-gray-200 mb-8">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-lg lg:text-xl font-bold text-center">Subscription Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 text-sm lg:text-base text-gray-700">
              <div>
                <h4 className="font-bold text-gray-900">Sports Wager Helper - Premium Monthly</h4>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Price:</strong> $19.99 per month</li>
                  <li><strong>Duration:</strong> 1 month (auto-renewing)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Sports Wager Helper - VIP Annual</h4>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Price:</strong> $149.99 per year</li>
                  <li><strong>Duration:</strong> 1 year {isNativeApp ? '(auto-renewing)' : '(one-time payment)'}</li>
                </ul>
              </div>
              <div className="border-t pt-4 mt-4">
                {isIOSDevice ? (
                  <p className="text-xs lg:text-sm text-gray-600">
                    • Payment will be charged to your Apple ID account at confirmation of purchase.<br/>
                    • Subscription automatically renews unless canceled at least 24 hours before the end of the current period.<br/>
                    • You can manage and cancel your subscriptions by going to your App Store account settings after purchase.
                  </p>
                ) : isAndroidDevice ? (
                  <p className="text-xs lg:text-sm text-gray-600">
                    • Payment will be charged to your Google Play account at confirmation of purchase.<br/>
                    • Subscription automatically renews unless canceled. <br/>
                    • Manage your subscriptions in your Google Play account settings.
                  </p>
                ) : (
                  <p className="text-xs lg:text-sm text-gray-600">
                    • Web payments are processed securely via Stripe.<br/>
                    • Premium Monthly subscriptions auto-renew. You can manage this from your account settings.<br/>
                    • VIP Annual is a one-time payment for 12 months of access.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
                <Link 
                  to={createPageUrl("TermsOfService")} 
                  className="text-blue-600 hover:underline flex items-center gap-1 text-sm lg:text-base"
                >
                  <ExternalLink className="w-4 h-4" />
                  Terms of Use (EULA)
                </Link>
                <Link 
                  to={createPageUrl("PrivacyPolicy")} 
                  className="text-blue-600 hover:underline flex items-center gap-1 text-sm lg:text-base"
                >
                  <ExternalLink className="w-4 h-4" />
                  Privacy Policy
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restore Purchases Link - Mobile only */}
        {(isNativeApp) && (
          <div className="text-center mb-8">
            <Button
              variant="link"
              onClick={() => setShowRestoreModal(true)}
              className="text-blue-600 hover:text-blue-700 underline text-sm lg:text-base"
            >
              Legacy subscriber? Restore purchases
            </Button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-4 lg:p-6 bg-amber-50 border-2 border-amber-200 rounded-xl mb-24">
          <p className="text-sm lg:text-base text-amber-900 text-center">
            <strong>⚠️ Important Notice:</strong> Must be 18+ (21+ where required). All analytics and insights are for informational and entertainment purposes only. 
            If you or someone you know has a problem with gambling, call 1-800-522-4700.
          </p>
        </div>
      </div>
      
      <RestorePurchasesModal open={showRestoreModal} onOpenChange={setShowRestoreModal} />
    </div>
  );
}