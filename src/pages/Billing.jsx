import React from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Crown, 
  Zap, 
  Calendar, 
  TrendingUp, 
  Shield,
  ExternalLink,
  CheckCircle
} from "lucide-react";

function BillingContent() {
  const navigate = useNavigate();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading billing information...</div>
      </div>
    );
  }

  const subscriptionType = currentUser?.subscription_type || 'free';
  const vipMemberNumber = currentUser?.vip_member_number;

  const tierInfo = {
    free: {
      name: "Free Plan",
      icon: Shield,
      color: "from-slate-600 to-slate-700",
      badgeColor: "bg-slate-500",
      description: "Limited to 5 searches"
    },
    vip_lifetime: {
      name: "VIP Lifetime",
      icon: Crown,
      color: "from-yellow-500 to-orange-500",
      badgeColor: "bg-yellow-500",
      description: "Unlimited access forever"
    },
    premium_monthly: {
      name: "Premium Monthly",
      icon: Zap,
      color: "from-purple-600 to-indigo-600",
      badgeColor: "bg-purple-500",
      description: "Unlimited access • Cancel anytime"
    }
  };

  const currentTier = tierInfo[subscriptionType];
  const Icon = currentTier.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Billing & Subscription</h1>
              <p className="text-slate-400">Manage your account and payments</p>
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <Card className={`border-2 border-slate-700 mb-6 overflow-hidden`}>
          <div className={`bg-gradient-to-r ${currentTier.color} p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-white/80 text-sm mb-1">Current Plan</div>
                  <div className="text-3xl font-black text-white">{currentTier.name}</div>
                  <div className="text-white/90 text-sm mt-1">{currentTier.description}</div>
                </div>
              </div>
              <Badge className={`${currentTier.badgeColor} text-white text-lg px-4 py-2`}>
                {subscriptionType === 'free' ? 'Free' : 'Active'}
              </Badge>
            </div>
          </div>
          <CardContent className="p-6 bg-slate-800/50">
            {subscriptionType === 'vip_lifetime' && vipMemberNumber && (
              <Alert className="bg-yellow-500/10 border-yellow-500/30 mb-4">
                <Crown className="w-5 h-5 text-yellow-500" />
                <AlertDescription className="text-yellow-200 ml-2">
                  You are VIP Lifetime Member #{vipMemberNumber} of 20. Thank you for being an early supporter!
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {subscriptionType === 'free' && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300">Searches Used</span>
                    <span className="text-white font-bold">Check Dashboard</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Upgrade to get unlimited searches and unlock all premium features
                  </p>
                </div>
              )}

              {subscriptionType === 'vip_lifetime' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-slate-300">Status</span>
                      </div>
                      <div className="text-white font-bold">Lifetime Access</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        <span className="text-slate-300">Searches</span>
                      </div>
                      <div className="text-white font-bold">Unlimited Forever</div>
                    </div>
                  </div>
                  <Alert className="bg-blue-500/10 border-blue-500/30">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <AlertDescription className="text-blue-200 ml-2">
                      As a VIP Lifetime member, you have unlimited access to all features forever. No recurring payments needed.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {subscriptionType === 'premium_monthly' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <span className="text-slate-300">Billing Cycle</span>
                      </div>
                      <div className="text-white font-bold">Monthly</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-green-400" />
                        <span className="text-slate-300">Amount</span>
                      </div>
                      <div className="text-white font-bold">$29.99/month</div>
                    </div>
                  </div>
                  <Alert className="bg-yellow-500/10 border-yellow-500/30">
                    <AlertDescription className="text-yellow-200">
                      To manage your subscription (view invoices, update payment method, or cancel), please visit the Stripe customer portal.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={() => window.open('https://billing.stripe.com/p/login/test_XXXXX', '_blank')}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Manage Subscription on Stripe
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Options */}
        {subscriptionType === 'free' && (
          <Card className="border-2 border-slate-700 bg-slate-800/50 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Upgrade Your Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-xl font-bold text-white">VIP Lifetime</h3>
                  </div>
                  <div className="text-3xl font-black text-white mb-2">$149.99</div>
                  <p className="text-slate-300 mb-4">One-time payment • Unlimited forever</p>
                  <Button
                    onClick={() => navigate(createPageUrl("Pricing"))}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    Get VIP Lifetime
                  </Button>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-2 border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">Premium Monthly</h3>
                  </div>
                  <div className="text-3xl font-black text-white mb-2">$29.99<span className="text-lg text-slate-400">/mo</span></div>
                  <p className="text-slate-300 mb-4">Cancel anytime • Unlimited access</p>
                  <Button
                    onClick={() => navigate(createPageUrl("Pricing"))}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    Start Premium
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {subscriptionType === 'premium_monthly' && (
          <Card className="border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                Upgrade to VIP Lifetime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">
                Save $210/year by switching to VIP Lifetime! Get the same unlimited access but pay only once.
              </p>
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Premium Monthly (1 year)</span>
                  <span className="text-white font-bold">$359.88</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">VIP Lifetime (forever)</span>
                  <span className="text-green-400 font-bold">$149.99</span>
                </div>
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">You Save</span>
                    <span className="text-green-400 font-bold text-xl">$209.89</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate(createPageUrl("Pricing"))}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 font-bold"
                size="lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to VIP Lifetime
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Security */}
        <Card className="border-2 border-slate-700 bg-slate-800/50 mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-bold text-white">Payment Security</h3>
            </div>
            <p className="text-slate-300 text-sm">
              All payments are processed securely through Stripe. We never store your payment information on our servers. 
              Your data is encrypted and protected by industry-leading security measures.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Billing() {
  return (
    <RequireAuth pageName="Billing">
      <BillingContent />
    </RequireAuth>
  );
}