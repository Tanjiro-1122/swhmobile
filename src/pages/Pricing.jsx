import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Crown, Sparkles, Check, Zap, Shield, TrendingUp, Target, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Pricing() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();
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

  const handleSubscribe = (plan) => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }

    // Redirect to Stripe checkout
    if (plan === 'legacy') {
      window.location.href = 'https://buy.stripe.com/7sY14p9g14HS43Q2hE8N207';
    } else if (plan === 'premium') {
      window.location.href = 'https://buy.stripe.com/bJe14p1Nza2ceIu2hE8N208';
    }
  };

  const features = {
    free: [
      "5 free match predictions",
      "5 free player stats lookups",
      "5 free team analysis",
      "Basic betting calculator",
      "Community access"
    ],
    premium: [
      "✅ Unlimited match predictions",
      "✅ Unlimited player stats",
      "✅ Unlimited team analysis",
      "✅ Live odds comparison (3 sportsbooks)",
      "✅ Today's Best Bets (AI picks)",
      "✅ Parlay builder",
      "✅ ROI tracker",
      "✅ Bankroll manager",
      "✅ Betting alerts",
      "✅ Save & track results",
      "✅ Priority support"
    ],
    legacy: [
      "🏆 Everything in Premium",
      "🏆 Annual billing ($149.99/year)",
      "🏆 Save $90/year vs monthly",
      "🏆 LEGACY MEMBER badge",
      "🏆 Early access to new features",
      "🏆 Priority AI processing",
      "🏆 Exclusive Discord channel",
      "🏆 Lifetime feature updates"
    ]
  };

  const currentPlan = currentUser?.subscription_type || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-2 mb-4">
            PRICING
          </Badge>
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get unlimited AI-powered sports betting analysis and smart tools to win more bets
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
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
                <div className="text-sm text-gray-600">Forever</div>
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
                <Crown className="w-12 h-12 mx-auto mb-4 text-purple-600" />
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
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg shadow-lg"
                  >
                    {isAuthenticated ? 'Subscribe Now' : 'Sign Up & Subscribe'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Legacy Annual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`border-2 ${currentPlan === 'vip_lifetime' ? 'border-yellow-500 shadow-2xl' : 'border-yellow-200'} relative`}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 text-sm font-bold shadow-lg animate-pulse">
                  💎 BEST VALUE
                </Badge>
              </div>
              <CardHeader className="text-center p-8 bg-gradient-to-br from-yellow-50 to-orange-50">
                <Shield className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                <CardTitle className="text-3xl font-black mb-2">Legacy Annual</CardTitle>
                <div className="text-5xl font-black text-gray-900 mb-2">$149.99</div>
                <div className="text-sm text-gray-600">/year • Save $90/year</div>
                <div className="mt-3">
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Save 37% vs Monthly
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <ul className="space-y-3 mb-8">
                  {features.legacy.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <span className="font-semibold">{feature}</span>
                    </li>
                  ))}
                </ul>
                {currentPlan === 'vip_lifetime' ? (
                  <Button disabled className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-6 cursor-not-allowed opacity-75">
                    ⭐ You're a Legacy Member!
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleSubscribe('legacy')}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-6 text-lg shadow-lg"
                  >
                    {isAuthenticated ? 'Upgrade to Legacy' : 'Sign Up & Get Legacy'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Comparison Table */}
        <Card className="border-2 border-gray-200 mb-16">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-2xl font-bold text-center">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-bold text-gray-900">Feature</th>
                    <th className="text-center py-4 px-4 font-bold text-gray-900">Free</th>
                    <th className="text-center py-4 px-4 font-bold text-purple-600">Premium</th>
                    <th className="text-center py-4 px-4 font-bold text-yellow-600">Legacy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4">Match Predictions</td>
                    <td className="text-center py-4 px-4">5 free</td>
                    <td className="text-center py-4 px-4 text-purple-600 font-bold">Unlimited</td>
                    <td className="text-center py-4 px-4 text-yellow-600 font-bold">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4">Player Stats</td>
                    <td className="text-center py-4 px-4">5 free</td>
                    <td className="text-center py-4 px-4 text-purple-600 font-bold">Unlimited</td>
                    <td className="text-center py-4 px-4 text-yellow-600 font-bold">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4">Live Odds Comparison</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4">Today's Best Bets</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4">Parlay Builder</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4">ROI Tracker</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4">Legacy Member Badge</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4">Priority AI Processing</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">❌</td>
                    <td className="text-center py-4 px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4">Annual Cost</td>
                    <td className="text-center py-4 px-4 font-bold">$0</td>
                    <td className="text-center py-4 px-4 font-bold text-purple-600">$239.88</td>
                    <td className="text-center py-4 px-4 font-bold text-yellow-600">$149.99 💰</td>
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
                <h3 className="text-lg font-bold text-gray-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes! Premium Monthly can be cancelled anytime. Legacy Annual is billed yearly but you can still cancel before the next renewal.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards (Visa, Mastercard, Amex, Discover) through Stripe's secure payment processing.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Is there a refund policy?</h3>
                <p className="text-gray-600">Yes! We offer a 14-day money-back guarantee on all subscriptions. If you're not satisfied, contact support for a full refund.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">How accurate are the AI predictions?</h3>
                <p className="text-gray-600">Our AI analyzes data from StatMuse, ESPN, and official league sources. Historical accuracy varies by sport but averages 65-75%. Check our AI Performance page for live stats.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Can I upgrade from Premium to Legacy?</h3>
                <p className="text-gray-600">Absolutely! Contact support and we'll pro-rate your existing subscription and apply it to the Legacy plan.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
          <p className="text-sm text-amber-900 text-center">
            <strong>⚠️ Responsible Gambling:</strong> Must be 18+ (21+ where required). Predictions are for informational purposes only. 
            Never bet more than you can afford to lose. National Gambling Helpline: 1-800-522-4700
          </p>
        </div>
      </div>
    </div>
  );
}