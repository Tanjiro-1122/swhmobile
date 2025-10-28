
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star, TrendingUp, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Pricing() {
  const [vipSpotsRemaining, setVipSpotsRemaining] = useState(20);

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

  const { data: allUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  useEffect(() => {
    // Count VIP lifetime members
    const vipCount = allUsers.filter(u => u.subscription_type === 'vip_lifetime').length;
    setVipSpotsRemaining(Math.max(0, 20 - vipCount));
  }, [allUsers]);

  const currentTier = currentUser?.subscription_type || 'free';

  const handleCheckout = (tier) => {
    if (!currentUser) {
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }

    if (tier === 'vip_lifetime') {
      // VIP Lifetime - $149.99 one-time
      window.location.href = 'https://buy.stripe.com/8x2bJ3ak5a2caseaOa8N203';
    } else if (tier === 'premium_monthly') {
      // Premium Monthly - $29.99/month recurring
      window.location.href = 'https://buy.stripe.com/4gM14p2RD6Q0dEqaOa8N204';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-black text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-slate-300 mb-6">
              Unlock unlimited AI-powered sports betting insights
            </p>
            {vipSpotsRemaining > 0 && vipSpotsRemaining <= 10 && (
              <div className="inline-block bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg animate-pulse">
                🔥 Only {vipSpotsRemaining} VIP Lifetime Spots Remaining! 🔥
              </div>
            )}
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* FREE TIER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-slate-700 bg-slate-800/50 h-full flex flex-col">
              <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-600 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6" />
                  <CardTitle className="text-2xl">Free</CardTitle>
                </div>
                <div className="text-4xl font-black mb-2">$0</div>
                <div className="text-slate-300">Try it out</div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>5 free match analyses</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Basic player stats</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Team statistics</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Betting calculators</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400">
                    <span className="text-red-400">✗</span>
                    <span>Unlimited searches</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400">
                    <span className="text-red-400">✗</span>
                    <span>Live odds tracking</span>
                  </li>
                </ul>
                {currentTier === 'free' ? (
                  <Badge className="w-full py-3 bg-green-500 text-white justify-center text-base">
                    Current Plan
                  </Badge>
                ) : (
                  <Button disabled className="w-full" size="lg">
                    Current Plan: {currentTier === 'vip_lifetime' ? 'VIP Lifetime' : 'Premium'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* VIP LIFETIME */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 h-full flex flex-col relative overflow-hidden shadow-2xl shadow-yellow-500/50 transform scale-105">
              <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 text-sm font-bold transform rotate-12 translate-x-8 translate-y-2">
                LIMITED!
              </div>
              <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-6 h-6" />
                  <CardTitle className="text-2xl font-black">VIP Lifetime</CardTitle>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">$149.99</span>
                </div>
                <div className="text-yellow-100 font-bold">One-time payment • Forever access</div>
                {vipSpotsRemaining > 0 && (
                  <Badge className="bg-white/20 text-white border-white/30 mt-2">
                    🔥 {vipSpotsRemaining} / 20 spots left
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 mb-4">
                  <div className="text-yellow-900 font-bold text-sm flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    BEST VALUE - Save $210/year vs Premium!
                  </div>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">✨ UNLIMITED everything forever</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Unlimited match analyses</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Unlimited player & team stats</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Live odds tracking (all sportsbooks)</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>AI performance tracking</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Parlay builder</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Bankroll management tools</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">👑 Exclusive VIP member badge</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">🚀 Early access to new features</span>
                  </li>
                </ul>
                {currentTier === 'vip_lifetime' ? (
                  <Badge className="w-full py-3 bg-yellow-500 text-white justify-center text-base">
                    ✨ You're a VIP Member!
                  </Badge>
                ) : vipSpotsRemaining === 0 ? (
                  <Button disabled className="w-full" size="lg">
                    SOLD OUT - All 20 Spots Taken
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout('vip_lifetime')}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-black text-lg py-6 shadow-lg"
                    size="lg"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Claim VIP Lifetime Spot
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* PREMIUM MONTHLY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 h-full flex flex-col">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-6 h-6" />
                  <CardTitle className="text-2xl">Premium Monthly</CardTitle>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">$29.99</span>
                  <span className="text-purple-200">/month</span>
                </div>
                <div className="text-purple-100">Cancel anytime • No commitment</div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">✨ UNLIMITED everything</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Unlimited match analyses</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Unlimited player & team stats</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Live odds tracking (all sportsbooks)</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>AI performance tracking</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Parlay builder</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Bankroll management tools</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <span className="text-gray-400">✗</span>
                    <span>VIP member badge</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <span className="text-gray-400">✗</span>
                    <span>Priority support</span>
                  </li>
                </ul>
                {currentTier === 'premium_monthly' ? (
                  <Badge className="w-full py-3 bg-purple-500 text-white justify-center text-base">
                    Current Plan
                  </Badge>
                ) : currentTier === 'vip_lifetime' ? (
                  <Button disabled className="w-full" size="lg">
                    You Have VIP (Better Plan!)
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout('premium_monthly')}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg py-6"
                    size="lg"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Start Premium
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Comparison Table */}
        <Card className="border-2 border-slate-700 bg-slate-800/50 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="p-4 text-slate-300">Feature</th>
                    <th className="p-4 text-center text-slate-300">Free</th>
                    <th className="p-4 text-center text-yellow-400 font-bold">VIP Lifetime</th>
                    <th className="p-4 text-center text-purple-400">Premium Monthly</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-700">
                    <td className="p-4">Match Analyses</td>
                    <td className="p-4 text-center">5 total</td>
                    <td className="p-4 text-center text-green-400 font-bold">Unlimited ✓</td>
                    <td className="p-4 text-center text-green-400 font-bold">Unlimited ✓</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-4">Player Stats</td>
                    <td className="p-4 text-center">Limited</td>
                    <td className="p-4 text-center text-green-400 font-bold">Unlimited ✓</td>
                    <td className="p-4 text-center text-green-400 font-bold">Unlimited ✓</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-4">Live Odds</td>
                    <td className="p-4 text-center text-red-400">✗</td>
                    <td className="p-4 text-center text-green-400 font-bold">✓</td>
                    <td className="p-4 text-center text-green-400 font-bold">✓</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-4">AI Performance Tracking</td>
                    <td className="p-4 text-center text-red-400">✗</td>
                    <td className="p-4 text-center text-green-400 font-bold">✓</td>
                    <td className="p-4 text-center text-green-400 font-bold">✓</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-4">Parlay Builder</td>
                    <td className="p-4 text-center text-red-400">✗</td>
                    <td className="p-4 text-center text-green-400 font-bold">✓</td>
                    <td className="p-4 text-center text-green-400 font-bold">✓</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-4">VIP Badge</td>
                    <td className="p-4 text-center text-red-400">✗</td>
                    <td className="p-4 text-center text-green-400 font-bold">✓</td>
                    <td className="p-4 text-center text-red-400">✗</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-4">Priority Support</td>
                    <td className="p-4 text-center text-red-400">✗</td>
                    <td className="p-4 text-center text-green-400 font-bold">✓</td>
                    <td className="p-4 text-center text-red-400">✗</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold">Total Cost (1 year)</td>
                    <td className="p-4 text-center">$0</td>
                    <td className="p-4 text-center text-yellow-400 font-bold">$149.99</td>
                    <td className="p-4 text-center">$359.88</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="border-2 border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-slate-300">
            <div>
              <h3 className="font-bold text-white mb-2">Why is VIP Lifetime limited to 20 users?</h3>
              <p>We're rewarding early adopters with lifetime access at a heavily discounted price. Once all 20 spots are gone, this offer will never return.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Can I upgrade from Premium Monthly to VIP Lifetime?</h3>
              <p>Yes! If you're on Premium Monthly and VIP spots are still available, you can upgrade anytime. We'll credit your current month toward the VIP price.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">What payment methods do you accept?</h3>
              <p>We accept all major credit cards (Visa, Mastercard, Amex, Discover), Apple Pay, Google Pay, and more through our secure Stripe checkout.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Is there a refund policy?</h3>
              <p>VIP Lifetime: 14-day money-back guarantee. Premium Monthly: No refunds for partial months, but you can cancel anytime before the next billing cycle.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">How do I cancel my Premium Monthly subscription?</h3>
              <p>Go to Settings → Billing → Cancel Subscription. You'll have access until the end of your current billing period.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">What makes your AI predictions accurate?</h3>
              <p>We use real-time data from StatMuse, ESPN, official league sources, and advanced AI models. Check our AI Performance page to see our historical accuracy rates.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
