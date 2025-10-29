import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Mail, 
  Crown, 
  Calendar, 
  Search, 
  CreditCard,
  Sparkles,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const { data: currentUser, isLoading, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      setFullName(user.full_name || "");
      return user;
    },
  });

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    setUpdateMessage(null);
    
    try {
      await base44.auth.updateMe({ full_name: fullName });
      await refetch();
      setIsEditing(false);
      setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Update error:', error);
      setUpdateMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    }
    
    setIsUpdating(false);
  };

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await base44.functions.invoke('createCustomerPortalSession', {
        return_url: window.location.href
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        setUpdateMessage({ 
          type: 'error', 
          text: response.data.error || 'Failed to open subscription portal' 
        });
        setIsLoadingPortal(false);
      }
    } catch (error) {
      console.error('Portal error:', error);
      setUpdateMessage({ 
        type: 'error', 
        text: 'Unable to access subscription portal. Please contact support@sportswagerhelper.com' 
      });
      setIsLoadingPortal(false);
    }
  };

  const getSubscriptionBadge = (tier) => {
    const badges = {
      legacy: {
        color: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
        icon: Crown,
        text: "LEGACY MEMBER"
      },
      vip_annual: {
        color: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
        icon: Crown,
        text: "VIP ANNUAL"
      },
      premium_monthly: {
        color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
        icon: Sparkles,
        text: "PREMIUM MONTHLY"
      },
      free: {
        color: "bg-gray-200 text-gray-800",
        icon: User,
        text: "FREE"
      }
    };
    
    return badges[tier] || badges.free;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const subscriptionType = currentUser?.subscription_type || 'free';
  const badge = getSubscriptionBadge(subscriptionType);
  const BadgeIcon = badge.icon;
  const searchCount = currentUser?.search_count || 0;
  const lookupsRemaining = subscriptionType === 'free' ? Math.max(0, 5 - searchCount) : '∞';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your account and subscription</p>
            </div>
          </div>

          {updateMessage && (
            <Alert className={`mb-6 ${updateMessage.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
              <AlertDescription className="flex items-center gap-2">
                {updateMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={updateMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {updateMessage.text}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Account Information */}
          <Card className="border-2 border-purple-200 mb-6">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Full Name</label>
                {isEditing ? (
                  <div className="flex gap-3">
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={isUpdating}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFullName(currentUser?.full_name || "");
                      }}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-900 font-medium">{currentUser?.full_name || "Not set"}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-900 font-medium">{currentUser?.email}</span>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className="border-2 border-purple-200 mb-6">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Current Plan</label>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center gap-3">
                    <BadgeIcon className="w-8 h-8 text-purple-600" />
                    <div>
                      <Badge className={`${badge.color} text-sm font-bold px-4 py-1.5`}>
                        {badge.text}
                      </Badge>
                      {subscriptionType === 'legacy' && (
                        <p className="text-xs text-gray-600 mt-1">Lifetime unlimited access • Original supporter</p>
                      )}
                      {subscriptionType === 'vip_annual' && (
                        <p className="text-xs text-gray-600 mt-1">$149.99/year • Unlimited access • VIP perks</p>
                      )}
                      {subscriptionType === 'premium_monthly' && (
                        <p className="text-xs text-gray-600 mt-1">$19.99/month • Unlimited access • Cancel anytime</p>
                      )}
                      {subscriptionType === 'free' && (
                        <p className="text-xs text-gray-600 mt-1">5 free lookups • Upgrade for unlimited</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search Usage
                </label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">Total Searches</span>
                    <span className="text-2xl font-bold text-purple-600">{searchCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Lookups Remaining</span>
                    <span className="text-2xl font-bold text-purple-600">{lookupsRemaining}</span>
                  </div>
                </div>
              </div>

              {/* Manage Subscription Button */}
              {(subscriptionType === 'premium_monthly' || subscriptionType === 'vip_annual') && (
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleManageSubscription}
                    disabled={isLoadingPortal}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg"
                  >
                    {isLoadingPortal ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading Portal...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Manage Subscription
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Update payment method, view billing history, or cancel subscription
                  </p>
                </div>
              )}

              {subscriptionType === 'legacy' && (
                <Alert className="bg-yellow-50 border-yellow-300">
                  <Crown className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Legacy Member:</strong> You have lifetime unlimited access as one of our original supporters. Thank you!
                  </AlertDescription>
                </Alert>
              )}

              {subscriptionType === 'free' && (
                <Alert className="bg-blue-50 border-blue-300">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Upgrade to Premium:</strong> Get unlimited searches, live odds, AI briefs, and more!
                    <Button
                      onClick={() => window.location.href = '/Pricing'}
                      size="sm"
                      className="ml-3 bg-blue-600 hover:bg-blue-700"
                    >
                      View Plans
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-900">Account Secured</div>
                    <div className="text-sm text-green-700">Your account is protected by Base44 authentication</div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  For security concerns or to delete your account, please contact{' '}
                  <a href="mailto:support@sportswagerhelper.com" className="text-purple-600 hover:underline font-semibold">
                    support@sportswagerhelper.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}