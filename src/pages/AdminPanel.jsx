
import React, { useState } from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Users, DollarSign, Search, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

function AdminPanelContent() {
  const [searchQuery, setSearchQuery] = useState("");
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

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });

  // Check if current user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
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
  const totalUsers = allUsers.length;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">Manage user accounts and VIP memberships</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  VIP Lifetime Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-white mb-2">
                  {vipLifetimeUsers}/20
                </div>
                <p className="text-yellow-100 text-sm">
                  {20 - vipLifetimeUsers} spots remaining
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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
        </div>

        {/* Search Bar */}
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

        {/* Users List */}
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
                            <XCircle className="w-4 h-4 mr-1" />
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
