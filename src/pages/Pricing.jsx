import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Crown, Sparkles, Check, Star, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";

export default function Pricing() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIOSApp, setIsIOSApp] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();
    
    // Check if we're in the iOS app - check multiple indicators
    const checkIOSApp = () => {
      // WebToNative detection methods
      const hasWTN = typeof window.WTN !== 'undefined';
      const hasWTNIAP = hasWTN && window.WTN.inAppPurchase;
      // Also check user agent for iOS WebView indicators
      const ua = navigator.userAgent || '';
      const isIOSWebView = /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);
      const isStandalone = window.navigator.standalone === true;
      
      console.log('iOS Detection:', { hasWTN, hasWTNIAP, isIOSWebView, isStandalone, ua });
      
      // Consider it iOS app if WTN exists OR if it's an iOS WebView
      return hasWTN || isIOSWebView || isStandalone;
    };
    
    setIsIOSApp(checkIOSApp());
  }, []);

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
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }

    setIsProcessing(true);

    try {
      // Detect iOS environment more reliably
      const ua = navigator.userAgent || '';
      const isIOSDevice = /iPhone|iPad|iPod/.test(ua);
      
      console.log('Subscribe clicked:', { plan, isIOSDevice, isIOSApp });
      
      // If on iOS device, ONLY use Apple IAP - never Stripe
      if (isIOSDevice || isIOSApp) {
        // Wait for WTN IAP to be available (up to 3 seconds)
        const waitForIAP = () => {
          return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 30; // 3 seconds total
            
            const check = () => {
              if (typeof window.WTN !== 'undefined' && typeof window.WTN.inAppPurchase === 'function') {
                resolve(true);
              } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(check, 100);
              } else {
                resolve(false);
              }
            };
            check();
          });
        };
        
        const iapReady = await waitForIAP();
        
        if (iapReady) {
          // Use Apple In-App Purchase - v3 product IDs
          let productId;
          
          if (plan === 'premium') {
            productId = 'com.sportswagerhelper.premium.monthly.v3';
          } else if (plan === 'vip') {
            productId = 'com.sportswagerhelper.premium.annual.v3';
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
                    alert('Subscription successful! Your account has been upgraded.');
                    window.location.href = '/MyAccount';
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
          // iOS device but IAP not available after waiting - fall back to Stripe web checkout
          console.log('iOS IAP not available, falling back to Stripe');
          
          let priceId;
          let mode;
          
          if (plan === 'premium') {
            priceId = 'price_1SN2OGRrQjRM0rB2u6TnCiP8';
            mode = 'subscription';
          } else if (plan === 'vip') {
            priceId = 'price_1SN2OrRrQjRM0rB2FrP8gDYp';
            mode = 'payment';
          }

          try {
            const response = await base44.functions.invoke('createCheckoutSession', {
              priceId,
              mode
            });

            if (response.data?.url) {
              window.location.href = response.data.url;
            } else {
              throw new Error('No checkout URL returned');
            }
          } catch (stripeError) {
            console.error('Stripe fallback error:', stripeError);
            alert('Unable to process payment. Please try again later or contact support.');
          }
          setIsProcessing(false);
        }
      } else {
        // Web users ONLY - use Stripe
        let priceId;
        let mode;
        
        if (plan === 'premium') {
          priceId = 'price_1SN2OGRrQjRM0rB2u6TnCiP8'; // Premium Monthly $19.99
          mode = 'subscription';
        } else if (plan === 'vip') {
          priceId = 'price_1SN2OrRrQjRM0rB2FrP8gDYp'; // VIP Annual $149.99
          mode = 'payment';
        }

        const response = await base44.functions.invoke('createCheckoutSession', {
          priceId,
          mode
        });

        if (response.data?.url) {
          window.location.href = response.data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start checkout. Please try again or contact support.');
      setIsProcessing(false);
    }
  };

  const features = {
    free: [
      "5 free match predictions",
      "5 free player stats lookups",
      "5 free team analysis",
      "Basic odds calculator",
      "Community access",
      "30-day saved results retention"
    ],
    premium: [
      "Unlimited match predictions",
      "Unlimited player stats",
      "Unlimited team analysis",
      "Live odds comparison",
      "Today's Top Predictions (AI picks)",
      "Multi-pick analyzer",
      "Performance tracker",
      "Budget manager",
      "Insight alerts",
      "Save & track results",
      "Priority support",
      "30-day saved results retention"
    ],
    vip: [
      "Everything in Premium",
      "Annual billing ($149.99/year)",
      "Save $90/year vs monthly",
      "VIP MEMBER badge",
      "Daily AI Insight Briefs",
      "Sharp vs Public Money indicators",
      "Early access to new features",
      "Priority AI processing",
      "Exclusive VIP Discord channel",
      "Lifetime feature updates",
      "UNLIMITED saved results retention"
    ]
  };

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
                <div className="text-sm lg:text-base text-gray-600">5 Free Lookups</div>
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

          {/* Premium Monthly */}
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
                <CardTitle className="text-2xl lg:text-3xl font-black mb-2">Premium Monthly</CardTitle>
                <div className="text-4xl lg:text-5xl font-black text-gray-900 mb-2">$19.99</div>
                <div className="text-sm lg:text-base text-gray-600">/month • Cancel anytime</div>
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
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-base lg:text-lg shadow-lg disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      isAuthenticated ? 'Subscribe Now' : 'Sign Up & Subscribe'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* VIP Annual */}
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
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-6 text-base lg:text-lg shadow-lg disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      isAuthenticated ? 'Upgrade to VIP' : 'Sign Up & Get VIP'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
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
                  {isIOSApp 
                    ? "Payments are processed securely through Apple's App Store using your Apple ID payment method." 
                    : "Payments are processed securely through Apple's App Store (iOS) or Stripe (web)."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Details - Required for Apple App Store */}
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
                  <li><strong>Duration:</strong> 1 year (auto-renewing)</li>
                </ul>
              </div>
              <div className="border-t pt-4 mt-4">
                <p className="text-xs lg:text-sm text-gray-600">
                  • Payment will be charged to your Apple ID account at confirmation of purchase.<br/>
                  • Subscription automatically renews unless canceled at least 24 hours before the end of the current period.<br/>
                  • Your account will be charged for renewal within 24 hours prior to the end of the current period.<br/>
                  • You can manage and cancel your subscriptions by going to your App Store account settings after purchase.
                </p>
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

        {/* Disclaimer */}
        <div className="p-4 lg:p-6 bg-amber-50 border-2 border-amber-200 rounded-xl mb-24">
          <p className="text-sm lg:text-base text-amber-900 text-center">
            <strong>⚠️ Important Notice:</strong> Must be 18+ (21+ where required). All analytics and insights are for informational and entertainment purposes only. 
            If you or someone you know has a problem with gambling, call 1-800-522-4700.
          </p>
        </div>
      </div>
      <FloatingDashboardButton />
    </div>
  );
}