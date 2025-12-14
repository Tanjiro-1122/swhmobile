import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Crown, Calendar, Sparkles, Settings, Link2, CheckCircle2 } from "lucide-react";
import AppleSignInButton from "@/components/auth/AppleSignInButton";

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
      <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
        <CardHeader className="bg-white/10 border-b border-white/20">
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-6 h-6 text-blue-400" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {currentUser?.full_name || 'User'}
              </h2>
              <div className="flex items-center gap-2 text-white/70 mb-4">
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
        <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-sm text-white/70">Member Since</div>
            <div className="text-lg font-bold text-white">
              {currentUser?.created_date 
                ? new Date(currentUser.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="text-sm text-white/70">Subscription</div>
            <div className="text-lg font-bold text-white">{subscription.label}</div>
          </CardContent>
        </Card>

        <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Settings className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-sm text-white/70">Account Status</div>
            <div className="text-lg font-bold text-green-400">Active</div>
          </CardContent>
        </Card>
      </div>

      {/* Apple Account Linking */}
      <Card className="border border-white/20 bg-white/10 backdrop-blur-sm">
        <CardHeader className="bg-white/10 border-b border-white/20">
          <CardTitle className="flex items-center gap-2 text-white">
            <Link2 className="w-6 h-6 text-blue-400" />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {currentUser?.apple_provider_id ? (
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-white font-semibold">Apple Account</div>
                  <div className="text-white/60 text-sm">
                    {currentUser.apple_is_private_email ? 'Private email relay' : currentUser.apple_provider_email || 'Connected'}
                  </div>
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
          ) : (
            <div className="text-center">
              <p className="text-white/70 mb-4">Link your Apple account to enable easy sign-in and restore purchases from the App Store</p>
              <AppleSignInButton 
                className="mx-auto"
                onSuccess={async (appleUser) => {
                  // Link Apple account to current user
                  await base44.auth.updateMe({
                    apple_provider_id: appleUser.id,
                    apple_provider_email: appleUser.email || '',
                    apple_is_private_email: appleUser.isPrivateEmail,
                    apple_linked_at: new Date().toISOString()
                  });
                  window.location.reload();
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Actions */}
      {currentUser?.subscription_type !== 'legacy' && currentUser?.subscription_type !== 'vip_annual' && (
        <Card className="border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl font-bold text-white mb-2">Upgrade Your Account</h3>
            <p className="text-white/70 mb-4">Get unlimited access and exclusive features with VIP Annual</p>
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