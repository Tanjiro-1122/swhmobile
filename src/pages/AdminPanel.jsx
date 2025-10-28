import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Crown, Sparkles, Star, Users, TrendingUp, DollarSign, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import RequireAuth from "../components/auth/RequireAuth";

function AdminPanelContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
  });

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      return await base44.entities.User.list('-created_date', 1000);
    },
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }) => {
      return await base44.entities.User.update(userId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });

  const handleSubscriptionChange = async (userId, newTier) => {
    await updateUserMutation.mutateAsync({
      userId,
      updates: { subscription_type: newTier }
    });
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="border-2 border-red-300">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have admin permissions to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = !searchQuery || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = filterTier === 'all' || user.subscription_type === filterTier;
    
    return matchesSearch && matchesTier;
  });

  const tierCounts = {
    free: allUsers.filter(u => !u.subscription_type || u.subscription_type === 'free').length,
    premium_monthly: allUsers.filter(u => u.subscription_type === 'premium_monthly').length,
    vip_annual: allUsers.filter(u => u.subscription_type === 'vip_annual').length,
    legacy: allUsers.filter(u => u.subscription_type === 'legacy').length,
  };

  const totalRevenue = (tierCounts.premium_monthly * 19.99) + (tierCounts.vip_annual * 149.99);

  const getTierBadge = (tier) => {
    switch(tier) {
      case 'legacy':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">👑 LEGACY</Badge>;
      case 'vip_annual':
        return <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">💎 VIP ANNUAL</Badge>;
      case 'premium_monthly':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">⭐ PREMIUM</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const getTierIcon = (tier) => {
    switch(tier) {
      case 'legacy':
        return <Star className="w-4 h-4 text-yellow-600" />;
      case 'vip_annual':
        return <Crown className="w-4 h-4 text-indigo-600" />;
      case 'premium_monthly':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage users and subscriptions</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
                <div className="text-3xl font-black text-gray-900">{allUsers.length}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-2 border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  {getTierIcon('free')}
                </div>
                <div className="text-3xl font-black text-gray-900">{tierCounts.free}</div>
                <div className="text-sm text-gray-600">Free Users</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-2 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  {getTierIcon('premium_monthly')}
                </div>
                <div className="text-3xl font-black text-purple-600">{tierCounts.premium_monthly}</div>
                <div className="text-sm text-gray-600">Premium Monthly</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-2 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  {getTierIcon('vip_annual')}
                </div>
                <div className="text-3xl font-black text-indigo-600">{tierCounts.vip_annual}</div>
                <div className="text-sm text-gray-600">VIP Annual</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-2 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  {getTierIcon('legacy')}
                </div>
                <div className="text-3xl font-black text-yellow-600">{tierCounts.legacy}</div>
                <div className="text-sm text-gray-600">Legacy Members</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Revenue Card */}
        <Card className="border-2 border-green-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DollarSign className="w-12 h-12 text-green-600" />
                <div>
                  <div className="text-4xl font-black text-green-600">${totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Estimated Monthly Revenue</div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div>Premium: ${(tierCounts.premium_monthly * 19.99).toFixed(2)}/mo</div>
                <div>VIP: ${(tierCounts.vip_annual * 149.99 / 12).toFixed(2)}/mo</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium_monthly">Premium Monthly</SelectItem>
                  <SelectItem value="vip_annual">VIP Annual</SelectItem>
                  <SelectItem value="legacy">Legacy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-gray-600">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-600">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{user.full_name || 'No name'}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Joined: {new Date(user.created_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="min-w-32">
                            {getTierBadge(user.subscription_type)}
                          </div>
                          <Select
                            value={user.subscription_type || 'free'}
                            onValueChange={(value) => handleSubscriptionChange(user.id, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="premium_monthly">Premium Monthly ($19.99/mo)</SelectItem>
                              <SelectItem value="vip_annual">VIP Annual ($149.99/yr)</SelectItem>
                              <SelectItem value="legacy">Legacy (Lifetime)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
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