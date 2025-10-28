import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star, TrendingUp, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Pricing() {
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

  const currentTier = currentUser?.subscription_type || 'free';
  const isLegacy = currentUser?.is_legacy_member || currentTier === 'legacy_lifetime';

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
          </motion.div>
        </div>

        {/* Legacy Member Banner */}
        {isLegacy && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <Card className="border-4 border-purple-400 bg-gradient-to-r from-purple-500 to-pink-500 shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Star className="w-12 h-12 text-white" />
                  <h2 className="text-4xl font-black text-white">Legacy Member</h2>
                  <Star className="w-12 h-12 text-white" />
                </div>
                <p className="text-2xl text-white/90 mb-2">
                  Thank you for being an original supporter!
                </p>
                <p className="text-lg text-white/80">
                  You have complimentary lifetime unlimited access to all features forever 🎉
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
                    <span>Basic betting calculator</span>
                  </li>
                </ul>
                <Button
                  disabled
                  variant="outline"
                  className="w-full border-slate-600 text-slate-400"
                >
                  Current Plan
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* VIP LIFETIME */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm">
                  BEST VALUE
                </Badge>
              </div>
              <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-7 h-7" />
                  <CardTitle className="text-3xl">VIP Lifetime</CardTitle>
                </div>
                <div className="text-5xl font-black mb-2">$149.99</div>
                <div className="text-yellow-100 text-lg">One-time payment • Forever</div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">UNLIMITED match analyses</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">UNLIMITED player & team stats</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Live odds comparison</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Advanced parlay builder</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>ROI & bankroll tracking</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Custom betting alerts</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>AI performance tracking</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-bold text-yellow-700">✨ Lifetime access - NEVER pay again</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleCheckout('vip_lifetime')}
                  disabled={currentTier === 'vip_lifetime' || isLegacy}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white text-lg py-6 font-bold shadow-lg"
                >
                  {currentTier === 'vip_lifetime' ? (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Current Plan
                    </>
                  ) : isLegacy ? (
                    <>
                      <Star className="w-5 h-5 mr-2" />
                      Legacy Member
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Get VIP Lifetime
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-gray-600 mt-3">
                  💰 Pay once, use forever
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* PREMIUM MONTHLY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50 h-full flex flex-col">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-6 h-6" />
                  <CardTitle className="text-2xl">Premium Monthly</CardTitle>
                </div>
                <div className="text-4xl font-black mb-2">$29.99</div>
                <div className="text-purple-100">Per month</div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">UNLIMITED match analyses</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">UNLIMITED player & team stats</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Live odds comparison</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Advanced parlay builder</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>ROI & bankroll tracking</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Custom betting alerts</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>AI performance tracking</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-800">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">Cancel anytime - No commitment</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleCheckout('premium_monthly')}
                  disabled={currentTier === 'premium_monthly' || isLegacy}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-lg py-6 font-bold shadow-lg"
                >
                  {currentTier === 'premium_monthly' ? (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Current Plan
                    </>
                  ) : isLegacy ? (
                    <>
                      <Star className="w-5 h-5 mr-2" />
                      Legacy Member
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Subscribe Monthly
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-gray-600 mt-3">
                  🔄 Cancel anytime from Settings
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Feature Comparison */}
        <Card className="border-2 border-slate-700 bg-slate-800/90 backdrop-blur-xl mb-12">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-4 text-slate-300 font-semibold">Feature</th>
                    <th className="pb-4 text-center text-slate-300 font-semibold">Free</th>
                    <th className="pb-4 text-center text-yellow-400 font-semibold">VIP Lifetime</th>
                    <th className="pb-4 text-center text-purple-400 font-semibold">Premium Monthly</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3">Match Analysis</td>
                    <td className="text-center py-3">5 searches</td>
                    <td className="text-center py-3 text-green-400 font-bold">Unlimited ✓</td>
                    <td className="text-center py-3 text-green-400 font-bold">Unlimited ✓</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3">Player & Team Stats</td>
                    <td className="text-center py-3">Limited</td>
                    <td className="text-center py-3 text-green-400 font-bold">Unlimited ✓</td>
                    <td className="text-center py-3 text-green-400 font-bold">Unlimited ✓</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3">Live Odds Comparison</td>
                    <td className="text-center py-3">❌</td>
                    <td className="text-center py-3 text-green-400">✓</td>
                    <td className="text-center py-3 text-green-400">✓</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3">Advanced Parlay Builder</td>
                    <td className="text-center py-3">❌</td>
                    <td className="text-center py-3 text-green-400">✓</td>
                    <td className="text-center py-3 text-green-400">✓</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3">ROI & Bankroll Tracking</td>
                    <td className="text-center py-3">❌</td>
                    <td className="text-center py-3 text-green-400">✓</td>
                    <td className="text-center py-3 text-green-400">✓</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-3">Custom Alerts</td>
                    <td className="text-center py-3">❌</td>
                    <td className="text-center py-3 text-green-400">✓</td>
                    <td className="text-center py-3 text-green-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold">Total Cost</td>
                    <td className="text-center py-3 font-bold">$0</td>
                    <td className="text-center py-3 font-bold text-yellow-400">$149.99 once</td>
                    <td className="text-center py-3 font-bold text-purple-400">$29.99/month</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Testimonials / Social Proof */}
        <div className="text-center text-slate-400 mb-8">
          <Shield className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <h3 className="text-2xl font-bold text-white mb-2">Secure Payment by Stripe</h3>
          <p>Your payment information is encrypted and secure. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}