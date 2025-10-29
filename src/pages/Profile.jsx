import React, { useState } from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Crown, Mail, Calendar, Shield, Edit2, Save, X, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

function ProfileContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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

  const handleEditClick = () => {
    setEditedName(currentUser?.full_name || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate({ full_name: editedName });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName("");
  };

  const getSubscriptionBadge = (type) => {
    const badges = {
      legacy: { color: "bg-gradient-to-r from-yellow-500 to-orange-500", text: "LEGACY MEMBER", icon: Crown },
      vip_annual: { color: "bg-gradient-to-r from-indigo-500 to-purple-500", text: "VIP ANNUAL", icon: Crown },
      premium_monthly: { color: "bg-gradient-to-r from-purple-500 to-pink-500", text: "PREMIUM", icon: Sparkles },
      free: { color: "bg-gray-400", text: "FREE", icon: User }
    };
    return badges[type] || badges.free;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const subscriptionBadge = getSubscriptionBadge(currentUser?.subscription_type);
  const BadgeIcon = subscriptionBadge.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and subscription</p>
        </div>

        {updateSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              ✅ Profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-indigo-200 shadow-lg mb-6">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <User className="w-10 h-10" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-black">{currentUser?.full_name || 'User'}</CardTitle>
                    <p className="text-indigo-100">{currentUser?.email}</p>
                  </div>
                </div>
                <Badge className={`${subscriptionBadge.color} text-white px-4 py-2 text-lg font-bold`}>
                  <BadgeIcon className="w-5 h-5 mr-2" />
                  {subscriptionBadge.text}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Full Name
                  </label>
                  {isEditing ? (
                    <div className="flex gap-3">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1"
                        placeholder="Enter your full name"
                      />
                      <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancel} variant="outline">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <span className="text-lg font-semibold text-gray-900">
                        {currentUser?.full_name || 'Not set'}
                      </span>
                      <Button onClick={handleEditClick} variant="outline" size="sm">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Email Address
                  </label>
                  <div className="flex items-center bg-gray-50 rounded-lg p-4">
                    <Mail className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-lg text-gray-900">{currentUser?.email}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Account Created */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Member Since
                  </label>
                  <div className="flex items-center bg-gray-50 rounded-lg p-4">
                    <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-lg text-gray-900">
                      {new Date(currentUser?.created_date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Account Role
                  </label>
                  <div className="flex items-center bg-gray-50 rounded-lg p-4">
                    <Shield className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-lg text-gray-900 capitalize">{currentUser?.role || 'user'}</span>
                    {currentUser?.role === 'admin' && (
                      <Badge className="ml-3 bg-red-100 text-red-800">Administrator</Badge>
                    )}
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Subscription Details</h3>
                  
                  {currentUser?.subscription_type === 'legacy' && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <Crown className="w-5 h-5 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Legacy Member #{currentUser?.legacy_member_number || 'N/A'}</strong>
                        <br />
                        You have lifetime unlimited access to all features as one of our original supporters!
                      </AlertDescription>
                    </Alert>
                  )}

                  {currentUser?.subscription_type === 'vip_annual' && (
                    <Alert className="bg-purple-50 border-purple-200">
                      <Crown className="w-5 h-5 text-purple-600" />
                      <AlertDescription className="text-purple-800">
                        <strong>VIP Annual Member</strong>
                        <br />
                        Unlimited access to all features + exclusive VIP benefits
                        {currentUser?.subscription_end_date && (
                          <p className="mt-2">Renews: {new Date(currentUser.subscription_end_date).toLocaleDateString()}</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {currentUser?.subscription_type === 'premium_monthly' && (
                    <Alert className="bg-pink-50 border-pink-200">
                      <Sparkles className="w-5 h-5 text-pink-600" />
                      <AlertDescription className="text-pink-800">
                        <strong>Premium Monthly Member</strong>
                        <br />
                        Unlimited access to all core features
                      </AlertDescription>
                    </Alert>
                  )}

                  {currentUser?.subscription_type === 'free' && (
                    <Alert className="bg-gray-50 border-gray-200">
                      <AlertDescription className="text-gray-800">
                        <strong>Free Account</strong>
                        <br />
                        Limited to 5 free lookups. Upgrade to Premium or VIP for unlimited access!
                        <Button 
                          className="mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          onClick={() => window.location.href = '/Pricing'}
                        >
                          View Pricing Plans
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Usage Stats */}
                {currentUser?.search_count !== undefined && (
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Usage Statistics</h3>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Total Searches Performed:</span>
                        <span className="text-2xl font-bold text-indigo-600">{currentUser.search_count}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Section */}
        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              For support or questions about your account, contact us at:
            </p>
            <a href="mailto:support@sportswagerhelper.com" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              support@sportswagerhelper.com
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <RequireAuth pageName="Profile">
      <ProfileContent />
    </RequireAuth>
  );
}