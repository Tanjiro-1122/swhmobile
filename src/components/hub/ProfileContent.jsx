import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Crown, Calendar, Sparkles, Settings } from "lucide-react";

export default function ProfileContent() {
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const getSubscriptionBadge = (type) => {
    switch (type) {
      case 'legacy':
        return { label: 'LEGACY', color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' };
      case 'vip_annual':
        return { label: 'VIP ANNUAL', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' };
      case 'premium_monthly':
        return { label: 'PREMIUM', color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' };
      default:
        return { label: 'FREE', color: 'bg-gray-200 text-gray-700' };
    }
  };

  const subscription = getSubscriptionBadge(currentUser?.subscription_type);

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-200">
          <CardTitle className="flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {currentUser?.full_name || 'User'}
              </h2>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <Mail className="w-4 h-4" />
                {currentUser?.email}
              </div>
              <Badge className={`${subscription.color} px-4 py-2 text-sm font-bold`}>
                <Crown className="w-4 h-4 mr-2" />
                {subscription.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 border-blue-200">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-sm text-gray-600">Member Since</div>
            <div className="text-lg font-bold text-gray-900">
              {currentUser?.created_date 
                ? new Date(currentUser.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-sm text-gray-600">Subscription</div>
            <div className="text-lg font-bold text-gray-900">{subscription.label}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardContent className="p-6 text-center">
            <Settings className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-sm text-gray-600">Account Status</div>
            <div className="text-lg font-bold text-green-600">Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Actions */}
      {currentUser?.subscription_type !== 'legacy' && currentUser?.subscription_type !== 'vip_annual' && (
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upgrade Your Account</h3>
            <p className="text-gray-600 mb-4">Get unlimited access and exclusive features with VIP Annual</p>
            <Button 
              onClick={() => window.location.href = '/Pricing'}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
            >
              <Crown className="w-4 h-4 mr-2" />
              View Pricing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}