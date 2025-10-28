import React, { useState } from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Users, DollarSign, Search, TrendingUp, BarChart3, Activity, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import StripeWebhookGuide from "../components/admin/StripeWebhookGuide";

function AdminPanelContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: allMatches } = useQuery({
    queryKey: ['allMatches'],
    queryFn: () => base44.entities.Match.list('-created_date', 500),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });

  // Check if current user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Access Denied. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const vipLifetimeUsers = allUsers.filter(u => u.subscription_type === 'vip_lifetime').length;
  const premiumMonthlyUsers = allUsers.filter(u => u.subscription_type === 'premium_monthly').length;
  const freeUsers = allUsers.filter(u => !u.subscription_type || u.subscription_type === 'free').length;
  const totalUsers = allUsers.length;

  // Calculate revenue (estimated)
  const estimatedLifetimeRevenue = vipLifetimeUsers * 149.99;
  const estimatedMonthlyRevenue = premiumMonthlyUsers * 29.99;
  const estimatedTotalRevenue = estimatedLifetimeRevenue + estimatedMonthlyRevenue;

  // User activity stats
  const usersWithSearches = allUsers.filter(u => u.search_count > 0).length;
  const totalSearches = allUsers.reduce((sum, u) => sum + (u.search_count || 0), 0);
  const avgSearchesPerUser = totalUsers > 0 ? (totalSearches / totalUsers).toFixed(1) : 0;

  // User growth (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersLast7Days = allUsers.filter(u => new Date(u.created_date) > sevenDaysAgo).length;

  const filteredUsers = allUsers.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const makeVIPLifetime = async (user) => {
    const currentVIPCount = allUsers.filter(u => u.subscription_type === 'vip_lifetime').length;
    
    if (currentVIPCount >= 20) {
      alert('All 20 VIP Lifetime spots are taken!');
      return;
    }

    const vipNumber = currentVIPCount + 1;
    await updateUserMutation.mutateAsync({
      userId: user.id,
      data: {
        subscription_type: 'vip_lifetime',
        vip_member_number: vipNumber
      }
    });
  };

  const makeFree = async (user) => {
    await updateUserMutation.mutateAsync({
      userId: user.id,
      data: {
        subscription_type: 'free',
        vip_member_number: null
      }
    });
  };

  const makePremium = async (user) => {
    await updateUserMutation.mutateAsync({
      userId: user.id,
      data: {
        subscription_type: 'premium_monthly',
        vip_member_number: null
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">Manage users, subscriptions, and view analytics</p>
        </div>

        {/* Add Webhook Guide at the top */}
        <div className="mb-8">
          <StripeWebhookGuide />
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  VIP Lifetime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-white mb-2">
                  {vipLifetimeUsers}/20
                </div>
                <p className="text-yellow-100 text-sm">
                  {20 - vipLifetimeUsers} spots left
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Premium Monthly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-white mb-2">
                  {premiumMonthlyUsers}
                </div>
                <p className="text-purple-100 text-sm">
                  Active subscriptions
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-white mb-2">
                  {totalUsers}
                </div>
                <p className="text-emerald-100 text-sm">
                  Registered accounts
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  New Users (7d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-white mb-2">
                  {newUsersLast7Days}
                </div>
                <p className="text-blue-100 text-sm">
                  Last 7 days
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-auto bg-slate-800">
            <TabsTrigger value="users" className="py-3 text-lg">
              <Users className="w-5 h-5 mr-2" />
              Manage Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="py-3 text-lg">
              <BarChart3 className="w-5 h-5 mr-2" />
              Analytics & Revenue
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 mb-6">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by email or name..."
                    className="pl-12 h-14 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-lg"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" />
                  <p className="text-slate-400 mt-4">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-12 text-center">
                    <p className="text-slate-400">No users found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-lg font-bold text-white">{user.email}</div>
                              {user.subscription_type === 'vip_lifetime' && (
                                <Badge className="bg-yellow-500 text-white">
                                  <Crown className="w-3 h-3 mr-1" />
                                  VIP #{user.vip_member_number}
                                </Badge>
                              )}
                              {user.subscription_type === 'premium_monthly' && (
                                <Badge className="bg-purple-500 text-white">
                                  Premium
                                </Badge>
                              )}
                              {user.subscription_type === 'free' && (
                                <Badge variant="outline" className="text-slate-400 border-slate-600">
                                  Free
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-slate-400">
                              {user.full_name || 'No name'} • Joined {new Date(user.created_date).toLocaleDateString()}
                            </div>
                            {user.search_count > 0 && (
                              <div className="text-xs text-slate-500 mt-1">
                                {user.search_count} searches performed
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {user.subscription_type !== 'vip_lifetime' && vipLifetimeUsers < 20 && (
                              <Button
                                onClick={() => makeVIPLifetime(user)}
                                size="sm"
                                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                disabled={updateUserMutation.isLoading}
                              >
                                <Crown className="w-4 h-4 mr-1" />
                                Make VIP
                              </Button>
                            )}
                            {user.subscription_type !== 'premium_monthly' && (
                              <Button
                                onClick={() => makePremium(user)}
                                size="sm"
                                className="bg-purple-500 hover:bg-purple-600 text-white"
                                disabled={updateUserMutation.isLoading}
                              >
                                Make Premium
                              </Button>
                            )}
                            {user.subscription_type !== 'free' && (
                              <Button
                                onClick={() => makeFree(user)}
                                size="sm"
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                disabled={updateUserMutation.isLoading}
                              >
                                Make Free
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              {/* Revenue Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-green-500/20 border-green-500/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Total Revenue (Est.)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-white mb-2">
                      ${estimatedTotalRevenue.toFixed(2)}
                    </div>
                    <p className="text-green-200 text-sm">
                      Lifetime + Monthly
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-500/20 border-yellow-500/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Lifetime Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-white mb-2">
                      ${estimatedLifetimeRevenue.toFixed(2)}
                    </div>
                    <p className="text-yellow-200 text-sm">
                      {vipLifetimeUsers} x $149.99
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-purple-500/20 border-purple-500/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Monthly Revenue (Est.)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-white mb-2">
                      ${estimatedMonthlyRevenue.toFixed(2)}/mo
                    </div>
                    <p className="text-purple-200 text-sm">
                      {premiumMonthlyUsers} x $29.99
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* User Activity Stats */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-6 h-6" />
                    User Activity Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Active Users</div>
                      <div className="text-3xl font-bold text-white">{usersWithSearches}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {((usersWithSearches / totalUsers) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Total Searches</div>
                      <div className="text-3xl font-bold text-white">{totalSearches}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        All time
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Avg Searches/User</div>
                      <div className="text-3xl font-bold text-white">{avgSearchesPerUser}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Per user average
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Total Matches</div>
                      <div className="text-3xl font-bold text-white">{allMatches.length}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Analyzed matches
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Breakdown */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Subscription Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-white">VIP Lifetime</div>
                          <div className="text-sm text-slate-400">${estimatedLifetimeRevenue.toFixed(2)} total</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{vipLifetimeUsers}</div>
                        <div className="text-xs text-slate-400">{((vipLifetimeUsers / totalUsers) * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-white">Premium Monthly</div>
                          <div className="text-sm text-slate-400">${estimatedMonthlyRevenue.toFixed(2)}/month</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{premiumMonthlyUsers}</div>
                        <div className="text-xs text-slate-400">{((premiumMonthlyUsers / totalUsers) * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
                          <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-white">Free Users</div>
                          <div className="text-sm text-slate-400">Potential customers</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{freeUsers}</div>
                        <div className="text-xs text-slate-400">{((freeUsers / totalUsers) * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Growth Stats */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-slate-400 mb-2">New Users (Last 7 Days)</div>
                      <div className="text-4xl font-bold text-white mb-2">{newUsersLast7Days}</div>
                      <div className="text-sm text-slate-400">
                        {(newUsersLast7Days / 7).toFixed(1)} per day average
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Conversion Rate</div>
                      <div className="text-4xl font-bold text-white mb-2">
                        {(((vipLifetimeUsers + premiumMonthlyUsers) / totalUsers) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">
                        Free → Paid conversion
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <RequireAuth pageName="Admin Panel">
      <AdminPanelContent />
    </RequireAuth>
  );
}