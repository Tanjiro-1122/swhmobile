import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Crown, Sparkles, Check, Zap, Shield, TrendingUp, Target, BarChart3, Star, Loader2, ExternalLink } from "lucide-react";
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
    
    // Check if we're in the iOS app
    setIsIOSApp(typeof window.WTN !== 'undefined' && window.WTN.inAppPurchase);
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
      // Check if we're in the iOS app with IAP support
      if (typeof window.WTN !== 'undefined' && window.WTN.inAppPurchase) {
        // Use Apple In-App Purchase for iOS mobile app
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
        // Use Stripe for web users
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
      "✅ Unlimited match predictions",
      "✅ Unlimited player stats",
      "✅ Unlimited team analysis",
      "✅ Live odds comparison",
      "✅ Today's Top Predictions (AI picks)",
      "✅ Multi-pick analyzer",
      "✅ Performance tracker",
      "✅ Budget manager",
      "✅ Insight alerts",
      "✅ Save & track results",
      "✅ Priority support",
      "✅ 30-day saved results retention"
    ],
    vip: [
      "🏆 Everything in Premium",
      "🏆 Annual billing ($149.99/year)",
      "🏆 Save $90/year vs monthly",
      "🏆 VIP MEMBER badge",
      "🏆 Daily AI Insight Briefs",
      "🏆 Sharp vs Public Money indicators",
      "🏆 Early access to new features",
      "🏆 Priority AI processing",
      "🏆 Exclusive VIP Discord channel",
      "🏆 Lifetime feature updates",
      "🏆 UNLIMITED saved results retention (forever!)"
    ]
  };

  const currentPlan = currentUser?.subscription_type || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-2 mb-4">
            PRICING
          </Badge>
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                  <Crown className="w-12 h-12 text-yellow-600" />
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">You're a Legacy Member! 👑</h3>
                    <p className="text-gray-700">
                      You have lifetime unlimited access as one of our original supporters. Thank you for being with us from the start!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className={`border-2 ${currentPlan === 'free' ? 'border-blue-500 shadow-xl' : 'border-gray-200'}`}>
              <CardHeader className="text-center p-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <CardTitle className="text-3xl font-black mb-2">Free</CardTitle>
                <div className="text-5xl font-black text-gray-900 mb-2">$0</div>
                <div className="text-sm text-gray-600">5 Free Lookups</div>
              </CardHeader>
              <CardContent className="p-8">
                <ul className="space-y-3 mb-8">
                  {features.free.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentPlan === 'free' ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-600 cursor-not-allowed">
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                    disabled
                  >
                    Already Upgraded
                  </Button>
                )}
                <p className="text-xs text-gray-500 mt-3 text-center">
                  ⚠️ Account locks after 5 free lookups
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Premium Monthly */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`border-2 ${currentPlan === 'premium_monthly' ? 'border-purple-500 shadow-2xl' : 'border-purple-200'} relative`}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 text-sm font-bold shadow-lg">
                  MOST POPULAR
                </Badge>
              </div>
              <CardHeader className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50">
                <Star className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <CardTitle className="text-3xl font-black mb-2">Premium Monthly</CardTitle>
                <div className="text-5xl font-black text-gray-900 mb-2">$19.99</div>
                <div className="text-sm text-gray-600">/month • Cancel anytime</div>
              </CardHeader>
              <CardContent className="p-8">
                <ul className="space-y-3 mb-8">
                  {features.premium.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentPlan === 'premium_monthly' ? (
                  <Button disabled className="w-full bg-gray-200 text-gray-600 cursor-not-allowed">
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleSubscribe('premium')}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg shadow-lg disabled:opacity-70"
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
          >
            <Card className={`border-2 ${currentPlan === 'vip_annual' ? 'border-yellow-500 shadow-2xl' : 'border-yellow-200'} relative`}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 text-sm font-bold shadow-lg animate-pulse">
                  💎 BEST VALUE
                </Badge>
              </div>
              <CardHeader className="text-center p-8 bg-gradient-to-br from-yellow-50 to-orange-50">
                <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                <CardTitle className="text-3xl font-black mb-2">VIP Annual</CardTitle>
                <div className="text-5xl font-black text-gray-900 mb-2">$149.99</div>
                <div className="text-sm text-gray-600">/year • Billed annually</div>
                <div className="mt-3">
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Save 37% vs Monthly
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <ul className="space-y-3 mb-8">
                  {features.vip.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <span className="font-semibold">{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentPlan === 'vip_annual' ? (
                  <Button disabled className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-6 cursor-not-allowed opacity-75">
                    ⭐ You're a VIP Member!
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleSubscribe('vip')}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-6 text-lg shadow-lg disabled:opacity-70"
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

        {/* Comparison Table */}
        <Card className="border-2 border-gray-200 mb-16 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-bold text-gray-900 text-xs sm:text-sm">Feature</th>
                    <th className="text-center py-3 sm:py-4 px-2 sm:px-4 font-bold text-gray-900 text-xs sm:text-sm">Free</th>
                    <th className="text-center py-3 sm:py-4 px-2 sm:px-4 font-bold text-purple-600 text-xs sm:text-sm">Premium</th>
                    <th className="text-center py-3 sm:py-4 px-2 sm:px-4 font-bold text-yellow-600 text-xs sm:text-sm">VIP</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Match Predictions</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">5 free</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-purple-600 font-bold">Unlimited</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-yellow-600 font-bold">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Player & Team Stats</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">5 free</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-purple-600 font-bold">Unlimited</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-yellow-600 font-bold">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-yellow-50">
                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold">📁 Saved Results</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">30 days</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">30 days</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-yellow-600 font-bold">♾️ Forever</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Live Odds</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">5 free</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-purple-600 font-bold">Unlimited</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-yellow-600 font-bold">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Odds Calculator</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">AI Predictions</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Multi-Pick Analyzer</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Performance Tracker</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Budget Manager</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Insight Alerts</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Priority Support</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">AI Insight Briefs</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-yellow-600 font-bold">VIP</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Sharp Money Indicators</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 text-yellow-600 font-bold">VIP</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">VIP Badge</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">Early Access</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 sm:py-4 px-2 sm:px-4">VIP Discord</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">❌</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold">Annual Cost</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 font-bold">$0</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 font-bold text-purple-600">$239.88</td>
                    <td className="text-center py-3 sm:py-4 px-2 sm:px-4 font-bold text-yellow-600">$149.99</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-2xl font-bold text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">What happens after I use my 5 free lookups?</h3>
                <p className="text-gray-600">Your account will be locked and you'll need to subscribe to Premium or VIP to continue using the app. Don't worry - you can upgrade anytime!</p>
              </div>
              
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-amber-900 mb-2">📁 What happens to my saved results?</h3>
                <div className="text-amber-800 space-y-2">
                  <p><strong>Free & Premium Monthly users:</strong> Your saved results (match predictions, player stats, team analysis) are automatically deleted after 30 days. This keeps your saved results page clean and focused on recent activity.</p>
                  <p className="font-bold text-amber-900">
                    <span className="text-yellow-600">👑 VIP Annual & Legacy members:</span> Enjoy UNLIMITED retention! Your saved results are stored forever, allowing you to track long-term trends, analyze performance over seasons, and access your complete history anytime.
                  </p>
                  <p className="mt-2 text-sm">
                    💡 <strong>Why this matters:</strong> Serious sports enthusiasts need historical data to refine strategies, track ROI over time, and identify long-term patterns. VIP Annual gives you that edge.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes! Premium Monthly can be cancelled anytime. VIP Annual is billed yearly but you can still cancel before the next renewal.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">What's the difference between Premium and VIP?</h3>
                <p className="text-gray-600">Both have unlimited access to all core features. VIP Annual saves you 37% ($90/year) vs Premium Monthly, PLUS you get exclusive perks: Daily AI Insight Briefs, Sharp vs Public Money indicators, VIP Discord access, unlimited saved results retention, and a VIP badge.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">What is the VIP Discord channel?</h3>
                <p className="text-gray-600 mb-2">VIP Annual and Legacy members get exclusive access to our private Discord community where you can:</p>
                <ul className="list-disc pl-6 space-y-1 text-gray-600">
                  <li>Share advanced strategies with other serious sports enthusiasts</li>
                  <li>Get priority support from our team</li>
                  <li>Receive exclusive picks and insights</li>
                  <li>Network with experienced members</li>
                  <li>Influence future feature development</li>
                </ul>
                <p className="text-gray-600 mt-2">
                  <strong>Note:</strong> All users (Free, Premium, VIP) can join our public Reddit community at <a href="https://www.reddit.com/r/sportswagerhelper/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">r/sportswagerhelper</a> for general discussions and support.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">
                  {isIOSApp 
                    ? "Payments are processed securely through Apple's App Store using your Apple ID payment method." 
                    : "We accept all major credit cards (Visa, Mastercard, Amex, Discover) through Stripe's secure payment processing."}
                </p>
              </div>
              
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-amber-900 mb-2">⚠️ What is your refund policy?</h3>
                <div className="text-amber-800 space-y-2">
                  <p className="font-semibold">VIP Annual: 14-day refund window with usage limit</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Refunds ONLY if you've used <strong>fewer than 20 searches</strong> (match predictions + player stats + team stats combined)</li>
                    <li>Must request within 14 days of purchase</li>
                    <li>After 20 searches, no refunds available</li>
                  </ul>
                  <p className="mt-2 font-semibold">Premium Monthly: No partial month refunds</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Cancel anytime before next billing cycle</li>
                    <li>Keep access until end of current billing period</li>
                  </ul>
                  <p className="mt-2 text-sm">
                    💡 <strong>Why 20 searches?</strong> This ensures fair usage. If you've tried our AI predictions 20+ times, you've significantly utilized the service.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">What is a Legacy Member?</h3>
                <p className="text-gray-600">Legacy Members are our original supporters who received lifetime unlimited access. This tier is no longer available for new users.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Details - Required for Apple App Store */}
        <Card className="border-2 border-gray-200 mb-8">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-xl font-bold text-center">Subscription Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-bold text-gray-900">Sports Wager Helper - Premium Monthly</h4>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Price:</strong> $19.99 per month</li>
                  <li><strong>Duration:</strong> 1 month (auto-renewing)</li>
                  <li><strong>Content:</strong> Unlimited AI predictions, player/team stats, live odds, multi-pick analyzer, performance tracker, budget manager, and insight alerts</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Sports Wager Helper - VIP Annual</h4>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Price:</strong> $149.99 per year ($12.50/month)</li>
                  <li><strong>Duration:</strong> 1 year (auto-renewing)</li>
                  <li><strong>Content:</strong> Everything in Premium plus Daily AI Insight Briefs, Sharp Money indicators, VIP Discord access, unlimited saved results retention, and early access to new features</li>
                </ul>
              </div>
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-gray-600">
                  • Payment will be charged to your Apple ID account at confirmation of purchase.<br/>
                  • Subscription automatically renews unless canceled at least 24 hours before the end of the current period.<br/>
                  • Your account will be charged for renewal within 24 hours prior to the end of the current period.<br/>
                  • You can manage and cancel your subscriptions by going to your App Store account settings after purchase.<br/>
                  • Any unused portion of a free trial period will be forfeited when you purchase a subscription.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
                <Link 
                  to={createPageUrl("TermsOfService")} 
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Terms of Use (EULA)
                </Link>
                <Link 
                  to={createPageUrl("PrivacyPolicy")} 
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Privacy Policy
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl mb-24">
          <p className="text-sm text-amber-900 text-center">
            <strong>⚠️ Important Notice:</strong> Must be 18+ (21+ where required). All analytics and insights are for informational and entertainment purposes only. 
            This app does not facilitate or encourage taking chances. If you or someone you know has a problem with gambling, call 1-800-522-4700.
          </p>
        </div>
      </div>
      <FloatingDashboardButton />
    </div>
  );
}