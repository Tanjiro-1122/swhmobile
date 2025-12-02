import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, CreditCard, Calendar, Zap, Check, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SubscriptionContent() {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await base44.functions.invoke('createCustomerPortalSession');
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
    }
    setIsLoadingPortal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const subscriptionType = currentUser?.subscription_type || 'free';
  const isLegacy = subscriptionType === 'legacy';
  const isVIP = subscriptionType === 'vip_annual';
  const isPremium = subscriptionType === 'premium_monthly';
  const isBasic = subscriptionType === 'basic_monthly';
  const isUnlimitedMonth = subscriptionType === 'unlimited_monthly';
  const isUnlimitedYear = subscriptionType === 'unlimited_yearly';
  const isHalfYear = subscriptionType === 'half_year';
  const isFree = subscriptionType === 'free' || !subscriptionType;
  const hasPaidPlan = !isFree;

  const getPlanDetails = () => {
    if (isLegacy) return { name: "Legacy VIP", color: "from-yellow-500 to-orange-500", icon: Crown, features: ["Unlimited Searches", "All Features", "Priority Support", "Lifetime Access"] };
    if (isVIP) return { name: "VIP Annual", color: "from-indigo-500 to-purple-500", icon: Crown, features: ["Unlimited Searches", "All Features", "VIP Discord Access", "Priority Support"] };
    if (isPremium) return { name: "Premium Monthly", color: "from-purple-500 to-pink-500", icon: Zap, features: ["Unlimited Searches", "All Features", "Priority Support"] };
    if (isUnlimitedMonth) return { name: "Unlimited Monthly", color: "from-blue-500 to-indigo-500", icon: Zap, features: ["Unlimited Searches", "All Features"] };
    if (isUnlimitedYear) return { name: "Unlimited Yearly", color: "from-emerald-500 to-teal-500", icon: Crown, features: ["Unlimited Searches", "All Features", "Best Value"] };
    if (isHalfYear) return { name: "Half Year Special", color: "from-green-500 to-emerald-500", icon: Zap, features: ["Unlimited Searches", "All Features", "50% Savings"] };
    if (isBasic) return { name: "Basic", color: "from-gray-500 to-slate-500", icon: Zap, features: ["50 Searches/Month", "Core Features"] };
    return { name: "Free", color: "from-gray-400 to-gray-500", icon: null, features: ["5 Free Lookups", "Basic Features"] };
  };

  const plan = getPlanDetails();

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm shadow-xl">
        <CardHeader className={`bg-gradient-to-r ${plan.color} text-white p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {plan.icon && <plan.icon className="w-8 h-8" />}
              <div>
                <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
                <p className="text-white/80 text-sm mt-1">Your current subscription</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
              {hasPaidPlan ? "Active" : "Free Tier"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-white mb-3">Plan Features:</h4>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/80">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {hasPaidPlan && !isLegacy && (
              <div className="pt-4 border-t border-white/20">
                <Button
                  onClick={handleManageBilling}
                  disabled={isLoadingPortal}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3"
                >
                  {isLoadingPortal ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-5 h-5 mr-2" />
                  )}
                  Manage Billing & Subscription
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-center text-sm text-white/60 mt-2">
                  Update payment method, view invoices, or cancel subscription
                </p>
              </div>
            )}

            {isLegacy && (
              <div className="pt-4 border-t border-white/20">
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 text-center">
                  <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="font-bold text-yellow-300">Legacy VIP Status</p>
                  <p className="text-sm text-yellow-200/80">You have lifetime access - no billing needed!</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Card - Only show for free users */}
      {isFree && (
        <Card className="border border-green-500/30 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="text-center">
              <Zap className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-black text-white mb-2">Upgrade Your Experience</h3>
              <p className="text-white/70 mb-4">
                Get unlimited searches and access to all premium features
              </p>
              <Link to={createPageUrl("Pricing")}>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-3">
                  View Pricing Plans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border border-white/20 bg-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Member Since</p>
              <p className="font-bold text-white">
                {currentUser?.created_date 
                  ? new Date(currentUser.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-white/20 bg-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Lookups</p>
              <p className="font-bold text-white">
                {hasPaidPlan ? "Unlimited" : `${5 - (currentUser?.lookups_used || 0)} remaining`}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}