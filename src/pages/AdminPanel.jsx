import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Crown, Sparkles, Star, Users, DollarSign, Search, Clock, AlertTriangle, Video, Play, Loader2, CheckCircle, Copy } from "lucide-react";
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
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import RequireAuth from "../components/auth/RequireAuth";


function AdminPanelContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [videoTaskId, setVideoTaskId] = useState("");
  const [videoStatus, setVideoStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

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
        const updates = { subscription_type: newTier };

        // If setting to influencer, automatically set expiry to 7 days from now
        if (newTier === 'influencer') {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7);
          updates.subscription_expiry_date = expiryDate.toISOString().split('T')[0];
        }

        await updateUserMutation.mutateAsync({
          userId,
          updates
        });
      };

      const handleGenerateVideo = async () => {
        setIsGenerating(true);
        setVideoStatus(null);
        try {
          const response = await base44.functions.invoke('generateLogoVideo', { action: 'generate' });
          if (response.data?.task_id) {
            setVideoTaskId(response.data.task_id);
            setVideoStatus({ status: 'started', message: 'Video generation started! Check status in 2-3 minutes.' });
          } else {
            setVideoStatus({ status: 'error', message: response.data?.error || 'Failed to start generation' });
          }
        } catch (error) {
          setVideoStatus({ status: 'error', message: error.message });
        }
        setIsGenerating(false);
      };

      const handleCheckStatus = async () => {
        if (!videoTaskId) return;
        setIsCheckingStatus(true);
        try {
          const response = await base44.functions.invoke('generateLogoVideo', { action: 'status', taskId: videoTaskId });
          setVideoStatus(response.data);
        } catch (error) {
          setVideoStatus({ status: 'error', message: error.message });
        }
        setIsCheckingStatus(false);
      };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="border-2 border-red-300 bg-white">
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
    influencer: allUsers.filter(u => u.subscription_type === 'influencer').length,
  };

  // Get influencer accounts with countdown info
  const influencerAccounts = allUsers.filter(u => u.subscription_type === 'influencer').map(user => {
    const now = new Date();
    let expiryDate;
    
    if (user.subscription_expiry_date) {
      expiryDate = new Date(user.subscription_expiry_date);
    } else {
      // Fallback: 7 days from created_date
      expiryDate = new Date(user.created_date);
      expiryDate.setDate(expiryDate.getDate() + 7);
    }
    
    const diffMs = expiryDate - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      ...user,
      expiryDate,
      isExpired: diffMs <= 0,
      timeRemaining: diffMs > 0 ? { days: diffDays, hours: diffHours, minutes: diffMinutes } : null
    };
  });

  const totalRevenue = (tierCounts.premium_monthly * 19.99) + (tierCounts.vip_annual * 149.99);

  const getTierBadge = (tier) => {
    switch(tier) {
      case 'legacy':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold">👑 LEGACY</Badge>;
      case 'vip_annual':
        return <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold">💎 VIP ANNUAL</Badge>;
      case 'premium_monthly':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">⭐ PREMIUM</Badge>;
      case 'influencer':
        return <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold">🌟 INFLUENCER</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 font-semibold">Free</Badge>;
    }
  };

  const getTierIcon = (tier) => {
    switch(tier) {
      case 'legacy':
        return <Star className="w-8 h-8 text-yellow-600" />;
      case 'vip_annual':
        return <Crown className="w-8 h-8 text-indigo-600" />;
      case 'premium_monthly':
        return <Sparkles className="w-8 h-8 text-purple-600" />;
      default:
        return <Users className="w-8 h-8 text-gray-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-gray-900">Admin Panel</h1>
              <p className="text-xl text-gray-700 font-medium">Manage users and subscriptions</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 border-gray-300 bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-10 h-10 text-gray-700" />
                </div>
                <div className="text-4xl font-black text-gray-900">{allUsers.length}</div>
                <div className="text-sm font-semibold text-gray-700 mt-1">Total Users</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-2 border-gray-300 bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  {getTierIcon('free')}
                </div>
                <div className="text-4xl font-black text-gray-900">{tierCounts.free}</div>
                <div className="text-sm font-semibold text-gray-700 mt-1">Free Users</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-2 border-purple-300 bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  {getTierIcon('premium_monthly')}
                </div>
                <div className="text-4xl font-black text-purple-700">{tierCounts.premium_monthly}</div>
                <div className="text-sm font-semibold text-gray-700 mt-1">Premium Monthly</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-2 border-indigo-300 bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  {getTierIcon('vip_annual')}
                </div>
                <div className="text-4xl font-black text-indigo-700">{tierCounts.vip_annual}</div>
                <div className="text-sm font-semibold text-gray-700 mt-1">VIP Annual</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-2 border-yellow-300 bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  {getTierIcon('legacy')}
                </div>
                <div className="text-4xl font-black text-yellow-700">{tierCounts.legacy}</div>
                <div className="text-sm font-semibold text-gray-700 mt-1">Legacy Members</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Influencer Countdown Card */}
        {influencerAccounts.length > 0 && (
          <Card className="border-2 border-pink-300 bg-gradient-to-r from-pink-50 to-rose-50 shadow-md mb-8">
            <CardHeader className="bg-gradient-to-r from-pink-100 to-rose-100 border-b-2 border-pink-200">
              <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-pink-600" />
                🌟 Influencer Account Countdowns ({influencerAccounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {influencerAccounts.map(user => (
                  <div 
                    key={user.id} 
                    className={`p-4 rounded-lg border-2 ${user.isExpired ? 'bg-red-50 border-red-300' : 'bg-white border-pink-200'}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-gray-900">{user.full_name || 'No name'}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Expires: {user.expiryDate.toLocaleDateString()} at {user.expiryDate.toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {user.isExpired ? (
                          <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold">
                            <AlertTriangle className="w-5 h-5" />
                            EXPIRED - Switch to Free
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg font-bold text-center min-w-[180px]">
                            <div className="text-lg">
                              {user.timeRemaining.days}d {user.timeRemaining.hours}h {user.timeRemaining.minutes}m
                            </div>
                            <div className="text-xs opacity-90">remaining</div>
                          </div>
                        )}
                        {user.isExpired && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSubscriptionChange(user.id, 'free')}
                            className="font-bold"
                          >
                            Set to Free
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logo Video Generator Card */}
                    <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-md mb-8">
                      <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 border-b-2 border-purple-200">
                        <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                          <Video className="w-6 h-6 text-purple-600" />
                          🎬 Animated Logo Video Generator (PixVerse AI)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {/* Preview Section */}
                        <div className="mb-6 p-4 bg-white rounded-lg border-2 border-purple-200">
                          <h3 className="font-bold text-gray-900 mb-3">📋 Video Concept Preview:</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-700 mb-2"><strong>Starting Image:</strong></p>
                              <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e31dbf618_logo2.png" 
                                alt="Logo Preview" 
                                className="w-48 h-auto rounded-lg border shadow-sm"
                              />
                            </div>
                            <div>
                              <p className="text-sm text-gray-700 mb-2"><strong>Animation Sequence:</strong></p>
                              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                                <li>Scene opens with packed stadium, green grass, roaring crowd</li>
                                <li>Soccer player appears on left, kicks ball to the right</li>
                                <li>Quarterback appears on right, throws football to the left</li>
                                <li>Stats/numbers float briefly above each player</li>
                                <li>⚡ Balls collide in center - dramatic explosion!</li>
                                <li>Letters "SWH" emerge boldly from the explosion</li>
                              </ol>
                              <p className="text-xs text-purple-600 mt-3 italic">
                                Note: The marquee text "Sports Wager Helper...The Evolution of betting is Here!" 
                                will need to be added as overlay after generation.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Generate Button */}
                        <div className="flex flex-wrap gap-4 items-center mb-4">
                          <Button 
                            onClick={handleGenerateVideo}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold"
                          >
                            {isGenerating ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                            ) : (
                              <><Play className="w-4 h-4 mr-2" /> Generate Video</>
                            )}
                          </Button>

                          <div className="flex items-center gap-2">
                            <Input 
                              placeholder="Task ID" 
                              value={videoTaskId}
                              onChange={(e) => setVideoTaskId(e.target.value)}
                              className="w-64 border-2 border-gray-300"
                            />
                            <Button 
                              onClick={handleCheckStatus}
                              disabled={isCheckingStatus || !videoTaskId}
                              variant="outline"
                              className="border-2 border-purple-300"
                            >
                              {isCheckingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check Status'}
                            </Button>
                          </div>
                        </div>

                        {/* Status Display */}
                        {videoStatus && (
                          <div className={`p-4 rounded-lg border-2 ${
                            videoStatus.Resp?.status === 'successful' || videoStatus.status === 'started' 
                              ? 'bg-green-50 border-green-300' 
                              : videoStatus.status === 'error' 
                              ? 'bg-red-50 border-red-300'
                              : 'bg-yellow-50 border-yellow-300'
                          }`}>
                            {videoStatus.Resp?.status === 'successful' && videoStatus.Resp?.url ? (
                              <div>
                                <div className="flex items-center gap-2 text-green-700 font-bold mb-3">
                                  <CheckCircle className="w-5 h-5" /> Video Ready!
                                </div>
                                <video 
                                  src={videoStatus.Resp.url} 
                                  controls 
                                  className="w-full max-w-lg rounded-lg shadow-lg mb-3"
                                />
                                <div className="flex items-center gap-2">
                                  <Input value={videoStatus.Resp.url} readOnly className="flex-1 text-xs" />
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      navigator.clipboard.writeText(videoStatus.Resp.url);
                                      alert('URL copied!');
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : videoStatus.Resp?.status === 'processing' ? (
                              <div className="flex items-center gap-2 text-yellow-700">
                                <Loader2 className="w-5 h-5 animate-spin" /> Still processing... check again in a minute.
                              </div>
                            ) : videoStatus.status === 'started' ? (
                              <div className="text-green-700">{videoStatus.message}</div>
                            ) : (
                              <div className="text-sm">
                                <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(videoStatus, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Revenue Card */}
                    <Card className="border-2 border-green-300 bg-white shadow-md mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-10 h-10 text-green-700" />
                </div>
                <div>
                  <div className="text-5xl font-black text-green-700">${totalRevenue.toFixed(2)}</div>
                  <div className="text-base font-semibold text-gray-700 mt-1">Estimated Monthly Revenue</div>
                </div>
              </div>
              <div className="text-right text-base font-semibold text-gray-700">
                <div className="mb-2">Premium: <span className="text-purple-700">${(tierCounts.premium_monthly * 19.99).toFixed(2)}/mo</span></div>
                <div>VIP: <span className="text-indigo-700">${(tierCounts.vip_annual * 149.99 / 12).toFixed(2)}/mo</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8 border-2 border-gray-300 bg-white shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 border-b-2 border-gray-200">
            <CardTitle className="text-2xl font-black text-gray-900">User Management</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-2 border-gray-300 text-gray-900 text-base font-medium"
                  />
                </div>
              </div>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-48 border-2 border-gray-300 text-gray-900 font-semibold">
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
                <div className="text-center py-8 text-gray-700 text-lg font-semibold">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-700 text-lg font-semibold">No users found</div>
              ) : (
                filteredUsers.filter(user => !user.email?.toLowerCase().includes('test')).map((user) => (
                  <Card key={user.id} className="border-2 border-gray-300 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-lg font-black text-gray-900">{user.full_name || 'No name'}</div>
                          <div className="text-base font-semibold text-gray-700">{user.email}</div>
                          <div className="text-sm font-medium text-gray-600 mt-1">
                            Joined: {new Date(user.created_date).toLocaleDateString()}
                          </div>
                          <div className="mt-2 lg:hidden">
                            {getTierBadge(user.subscription_type)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4">
                          <div className="hidden lg:block min-w-36">
                            {getTierBadge(user.subscription_type)}
                          </div>
                          <Select
                            value={user.subscription_type || 'free'}
                            onValueChange={(value) => handleSubscriptionChange(user.id, value)}
                          >
                            <SelectTrigger className="w-full sm:w-56 border-2 border-gray-300 text-gray-900 font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free" className="font-semibold">Free</SelectItem>
                              <SelectItem value="premium_monthly" className="font-semibold">Premium Monthly ($19.99/mo)</SelectItem>
                              <SelectItem value="vip_annual" className="font-semibold">VIP Annual ($149.99/yr)</SelectItem>
                              <SelectItem value="legacy" className="font-semibold">Legacy (Lifetime)</SelectItem>
                              <SelectItem value="influencer" className="font-semibold">🌟 Influencer (7-day VIP)</SelectItem>
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