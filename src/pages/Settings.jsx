import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings as SettingsIcon, User, Bell, Shield, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import ThemeToggle from "../components/mobile/ThemeToggle";

export default function Settings() {
  const [fullName, setFullName] = React.useState("");
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateSuccess, setUpdateSuccess] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
  });

  React.useEffect(() => {
    if (currentUser?.full_name) {
      setFullName(currentUser.full_name);
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSuccess(false);

    try {
      await base44.auth.updateMe({ full_name: fullName });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    }

    setIsUpdating(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="max-w-md bg-slate-800/90 border-slate-700">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-slate-400 mb-6">Please sign in to access settings.</p>
            <Button
              onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-slate-400">Manage your account and preferences</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="bg-slate-900 border-slate-700 text-slate-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Subscription Tier</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {currentUser.subscription_type === 'vip_lifetime' && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-lg">
                          <Shield className="w-4 h-4 text-white" />
                          <span className="font-bold text-white">VIP LIFETIME MEMBER</span>
                        </div>
                      )}
                      {currentUser.subscription_type === 'premium_monthly' && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 rounded-lg">
                          <Shield className="w-4 h-4 text-white" />
                          <span className="font-bold text-white">PREMIUM MONTHLY</span>
                        </div>
                      )}
                      {currentUser.subscription_type === 'free' && (
                        <div className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg">
                          <span className="font-bold text-slate-300">FREE TIER</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {updateSuccess && (
                    <Alert className="bg-green-500/10 border-green-500/50">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <AlertDescription className="text-green-300">
                        Profile updated successfully!
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Theme</h3>
                    <p className="text-sm text-slate-400">Switch between light and dark mode</p>
                  </div>
                  <ThemeToggle variant="switch" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}