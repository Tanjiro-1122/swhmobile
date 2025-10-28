import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md bg-red-500/10 border-red-500/50">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-red-300">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vipUsers = allUsers.filter(u => u.subscription_type === 'vip_lifetime');
  const legacyUsers = allUsers.filter(u => u.subscription_type === 'legacy_lifetime' || u.is_legacy_member);
  const premiumUsers = allUsers.filter(u => u.subscription_type === 'premium_monthly');
  const freeUsers = allUsers.filter(u => !u.subscription_type || u.subscription_type === 'free');

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - FIXED OVERLAPPING */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-sm sm:text-base opacity-80">Manage users, monitor performance, and track revenue</p>
            </div>
          </div>

          {/* Tabs - FIXED FOR MOBILE */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === "users"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "bg-slate-800/50 hover:bg-slate-700/50"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === "analytics"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "bg-slate-800/50 hover:bg-slate-700/50"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("revenue")}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === "revenue"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "bg-slate-800/50 hover:bg-slate-700/50"
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Revenue
            </button>
          </div>
        </motion.div>

        {/* Content */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/90 border-slate-700">
                <CardContent className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{allUsers.length}</div>
                  <div className="text-xs sm:text-sm text-slate-400">Total Users</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50">
                <CardContent className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{legacyUsers.length}</div>
                  <div className="text-xs sm:text-sm text-purple-300">Legacy Members</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50">
                <CardContent className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{vipUsers.length}</div>
                  <div className="text-xs sm:text-sm text-yellow-300">VIP Lifetime</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/90 border-slate-700">
                <CardContent className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{premiumUsers.length}</div>
                  <div className="text-xs sm:text-sm text-slate-400">Premium Monthly</div>
                </CardContent>
              </Card>
            </div>

            {/* User List */}
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                  </div>
                ) : allUsers.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No users found</p>
                ) : (
                  allUsers.map((user) => (
                    <div key={user.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{user.full_name || user.email}</div>
                          <div className="text-sm text-slate-400 truncate">{user.email}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {user.subscription_type === 'legacy_lifetime' || user.is_legacy_member ? (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white whitespace-nowrap">
                              ⭐ Legacy Member
                            </Badge>
                          ) : user.subscription_type === 'vip_lifetime' ? (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white whitespace-nowrap">
                              👑 VIP Lifetime
                            </Badge>
                          ) : user.subscription_type === 'premium_monthly' ? (
                            <Badge className="bg-blue-500 text-white whitespace-nowrap">💎 Premium</Badge>
                          ) : (
                            <Badge variant="outline" className="whitespace-nowrap">Free</Badge>
                          )}
                          {user.role === 'admin' && (
                            <Badge className="bg-red-500 text-white whitespace-nowrap">Admin</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "analytics" && (
          <Card className="bg-slate-800/90 border-slate-700">
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl font-bold mb-2">Analytics Coming Soon</h3>
              <p className="text-slate-400">Detailed usage analytics and metrics will be available here.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === "revenue" && (
          <Card className="bg-slate-800/90 border-slate-700">
            <CardContent className="p-8 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-bold mb-2">Revenue Tracking Coming Soon</h3>
              <p className="text-slate-400">Revenue metrics and payment history will be available here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}