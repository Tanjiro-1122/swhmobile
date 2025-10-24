
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Search, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminUserManager() {
  const [searchEmail, setSearchEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }) => {
      return await base44.entities.User.update(userId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });

  const updateVIPCounter = async () => {
    try {
      const allUsers = await base44.entities.User.list();
      const vipUsers = allUsers.filter(u => u.vip_member === true || u.subscription_status === 'lifetime_vip');
      const vipCount = vipUsers.length;
      
      // Update or create the VIPCounter
      const counters = await base44.entities.VIPCounter.list();
      if (counters.length > 0) {
        await base44.entities.VIPCounter.update(counters[0].id, {
          current_vip_count: vipCount,
          last_updated: new Date().toISOString()
        });
      } else {
        await base44.entities.VIPCounter.create({
          current_vip_count: vipCount,
          last_updated: new Date().toISOString()
        });
      }
      
      console.log("✅ VIP Counter updated to:", vipCount);
    } catch (error) {
      console.error("Failed to update VIP counter:", error);
    }
  };

  const makeUserVIP = async (user, spotNumber) => {
    await updateUserMutation.mutateAsync({
      userId: user.id,
      updates: {
        subscription_status: 'lifetime_vip',
        subscription_type: 'lifetime',
        vip_member: true,
        vip_spot_number: spotNumber,
        // Explicitly remove date fields
        subscription_start_date: null,
        subscription_end_date: null
      }
    });
    
    // Update the public VIP counter
    await updateVIPCounter();
  };

  const makeUserPremium = async (user) => {
    await updateUserMutation.mutateAsync({
      userId: user.id,
      updates: {
        subscription_status: 'premium',
        subscription_type: 'monthly',
        subscription_start_date: new Date().toISOString(),
        vip_member: false
      }
    });
    
    // Update the public VIP counter
    await updateVIPCounter();
  };

  const makeUserFree = async (user) => {
    await updateUserMutation.mutateAsync({
      userId: user.id,
      updates: {
        subscription_status: 'free',
        subscription_type: 'none',
        vip_member: false,
        subscription_start_date: null,
        subscription_end_date: null,
        vip_spot_number: null
      }
    });
    
    // Update the public VIP counter
    await updateVIPCounter();
  };

  const filteredUsers = users?.filter(user => 
    !searchEmail || user.email?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const vipCount = users?.filter(u => u.vip_member || u.subscription_status === 'lifetime_vip').length || 0;
  const premiumCount = users?.filter(u => u.subscription_status === 'premium').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="border-2 border-purple-500/50 bg-slate-800/50 backdrop-blur-xl mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              User Subscription Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{vipCount}/20</div>
                <div className="text-sm text-yellow-300">VIP Lifetime Members</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{premiumCount}</div>
                <div className="text-sm text-purple-300">Premium Monthly</div>
              </div>
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-400">{users?.length || 0}</div>
                <div className="text-sm text-gray-300">Total Users</div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Search by email..."
                className="pl-10 bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            {/* User List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading users...</div>
              ) : filteredUsers?.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No users found</div>
              ) : (
                filteredUsers?.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-semibold">{user.email}</span>
                          {user.vip_member && (
                            <Badge className="bg-yellow-500 text-black">
                              <Crown className="w-3 h-3 mr-1" />
                              VIP #{user.vip_spot_number}
                            </Badge>
                          )}
                          {user.subscription_status === 'premium' && (
                            <Badge className="bg-purple-500 text-white">
                              <Star className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          {user.subscription_status === 'free' && (
                            <Badge variant="outline" className="text-gray-400">
                              Free (5 searches)
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.full_name || 'No name'} • Joined {new Date(user.created_date).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!user.vip_member && vipCount < 20 && (
                          <Button
                            onClick={() => makeUserVIP(user, vipCount + 1)}
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                          >
                            <Crown className="w-4 h-4 mr-1" />
                            Make VIP #{vipCount + 1}
                          </Button>
                        )}
                        {user.subscription_status !== 'premium' && !user.vip_member && (
                          <Button
                            onClick={() => makeUserPremium(user)}
                            size="sm"
                            className="bg-purple-500 hover:bg-purple-600"
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Make Premium
                          </Button>
                        )}
                        {user.subscription_status !== 'free' && (
                          <Button
                            onClick={() => makeUserFree(user)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Make Free
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-500/10 border-2 border-blue-500/30">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-blue-300 mb-3">💡 Quick Guide:</h3>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400" />
                <span><strong>VIP Lifetime:</strong> First 20 users get unlimited access forever (no dates, no expiration)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400" />
                <span><strong>Premium Monthly:</strong> $9.99/month subscription (has start date, renews monthly)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400" />
                <span><strong>Free:</strong> Limited to 5 searches total</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
