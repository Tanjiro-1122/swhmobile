import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  TrendingUp, 
  CheckCircle, 
  Edit2, 
  Save, 
  X,
  ExternalLink,
  Shield,
  Sparkles,
  BarChart3,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      return await base44.auth.me();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    },
  });

  const handleStartEdit = () => {
    setEditedName(currentUser?.full_name || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedName.trim()) {
      updateProfileMutation.mutate({ full_name: editedName.trim() });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Unable to load profile. Please try logging in again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const subscriptionType = currentUser.subscription_type || 'free';
  const isLegacy = subscriptionType === 'legacy';
  const isVIP = subscriptionType === 'vip_annual';
  const isPremium = subscriptionType === 'premium_monthly';
  const isFree = subscriptionType === 'free';

  const subscriptionConfig = {
    legacy: {
      name: "Legacy Member",
      icon: Crown,
      gradient: "from-yellow-500 to-orange-500",
      badge: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
      description: "Lifetime Unlimited Access - Original Supporter",
      features: ["Unlimited searches", "All premium features", "VIP Discord access", "Lifetime updates"]
    },
    vip_annual: {
      name: "VIP Annual",
      icon: Crown,
      gradient: "from-indigo-500 to-purple-500",
      badge: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
      description: "$149.99/year - Best Value",
      features: ["Unlimited searches", "Daily AI Briefs", "VIP Discord access", "Priority support", "Sharp money indicators"]
    },
    premium_monthly: {
      name: "Premium Monthly",
      icon: Sparkles,
      gradient: "from-purple-500 to-pink-500",
      badge: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      description: "$19.99/month - Cancel anytime",
      features: ["Unlimited searches", "All betting tools", "ROI tracking", "Live alerts", "Priority support"]
    },
    free: {
      name: "Free Tier",
      icon: Zap,
      gradient: "from-gray-400 to-gray-600",
      badge: "bg-gray-500 text-white",
      description: "5 Free Lookups",
      features: ["5 match predictions", "5 player stats", "5 team analyses", "Basic calculator", "Community access"]
    }
  };

  const config = subscriptionConfig[subscriptionType];
  const Icon = config.icon;

  // Calculate search usage
  const searchCount = currentUser.search_count || 0;
  const maxFreeSearches = 5;
  const searchesRemaining = isFree ? Math.max(0, maxFreeSearches - searchCount) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">My Profile</h1>
          <p className="text-gray-400 text-lg">Manage your account and subscription</p>
        </motion.div>

        {updateSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Alert className="bg-green-500/10 border-green-500/50 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>Profile updated successfully!</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-slate-700 bg-slate-800/50 backdrop-blur-xl">
            <CardHeader className={`bg-gradient-to-r ${config.gradient} text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
                    <span className="text-4xl font-black">
                      {currentUser.full_name?.charAt(0)?.toUpperCase() || currentUser.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-2xl md:text-3xl font-black mb-1">
                      {currentUser.full_name || 'User'}
                    </CardTitle>
                    <Badge className={`${config.badge} text-sm font-bold px-3 py-1`}>
                      <Icon className="w-4 h-4 mr-2" />
                      {config.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  Account Information
                </h3>

                {/* Full Name - Editable */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <label className="text-sm text-gray-400 mb-2 block">Full Name</label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 bg-slate-800 border-slate-700 text-white"
                        placeholder="Enter your name"
                      />
                      <Button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending || !editedName.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-lg">
                        {currentUser.full_name || 'Not set'}
                      </span>
                      <Button
                        onClick={handleStartEdit}
                        size="sm"
                        variant="ghost"
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email - Read Only */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <label className="text-sm text-gray-400 mb-2 block">Email Address</label>
                  <div className="flex items-center gap-3 text-white">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-lg">{currentUser.email}</span>
                  </div>
                </div>

                {/* Member Since */}
                {currentUser.created_date && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <label className="text-sm text-gray-400 mb-2 block">Member Since</label>
                    <div className="flex items-center gap-3 text-white">
                      <Calendar className="w-5 h-5 text-green-400" />
                      <span className="font-semibold text-lg">
                        {new Date(currentUser.created_date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Subscription Details */}
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Subscription Details
                </h3>

                <div className="bg-slate-900/50 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-2xl font-black text-white mb-1">{config.name}</div>
                      <div className="text-gray-400">{config.description}</div>
                    </div>
                    <Icon className={`w-12 h-12 ${config.gradient.replace('from-', 'text-').replace('to-', '').split(' ')[0]}`} />
                  </div>

                  <div className="space-y-2 mb-4">
                    {config.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Subscription-specific info */}
                  {isLegacy && currentUser.legacy_member_number && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm font-bold">
                        👑 Legacy Member #{currentUser.legacy_member_number} - Lifetime Access
                      </p>
                    </div>
                  )}

                  {(isVIP || isPremium) && (
                    <div className="mt-4 space-y-3">
                      {currentUser.subscription_start_date && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Subscription Started:</span>
                          <span className="text-white font-semibold">
                            {new Date(currentUser.subscription_start_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {isVIP && currentUser.subscription_end_date && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Next Billing Date:</span>
                          <span className="text-white font-semibold">
                            {new Date(currentUser.subscription_end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <Button
                        onClick={() => window.open('https://billing.stripe.com/p/login/test_00g6pw6Kydx41jqcMM', '_blank')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage Subscription in Stripe
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Update payment method, view invoices, or cancel subscription
                      </p>
                    </div>
                  )}

                  {isFree && (
                    <div className="mt-4">
                      <Button
                        onClick={() => window.location.href = '/Pricing'}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Usage Statistics
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <label className="text-sm text-gray-400 mb-2 block">Total Searches</label>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                      <span className="text-3xl font-black text-white">{searchCount}</span>
                      {!isFree && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Unlimited</Badge>}
                    </div>
                  </div>

                  {isFree && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <label className="text-sm text-gray-400 mb-2 block">Searches Remaining</label>
                      <div className="flex items-center gap-3">
                        <Zap className="w-6 h-6 text-yellow-400" />
                        <span className={`text-3xl font-black ${searchesRemaining === 0 ? 'text-red-500' : 'text-white'}`}>
                          {searchesRemaining}
                        </span>
                        <span className="text-gray-400">/ {maxFreeSearches}</span>
                      </div>
                      {searchesRemaining === 0 && (
                        <p className="text-red-400 text-sm mt-2">
                          ⚠️ Account locked. Please upgrade to continue.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Help & Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-slate-700 bg-slate-800/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Help & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-400 text-sm">
                  Need help? Have questions? We're here for you.
                </p>
                <Button
                  onClick={() => window.location.href = 'mailto:support@sportswagerhelper.com'}
                  variant="outline"
                  className="w-full border-slate-700 text-white hover:bg-slate-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <Button
                  onClick={() => window.location.href = '/Community'}
                  variant="outline"
                  className="w-full border-slate-700 text-white hover:bg-slate-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Community Forum
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-slate-700 bg-slate-800/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-400 text-sm mb-4">
                  Manage your account settings and preferences
                </p>
                <Button
                  onClick={() => base44.auth.logout()}
                  variant="outline"
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
                <p className="text-xs text-gray-500 text-center mt-4">
                  To delete your account, please contact support@sportswagerhelper.com
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}