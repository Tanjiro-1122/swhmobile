import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Crown, Sparkles, Star, Users, DollarSign, Search, Upload, Image, Loader2, Check } from "lucide-react";
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
  const [mascotUrl, setMascotUrl] = useState(localStorage.getItem('sal_mascot_url') || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleMascotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMascotUrl(file_url);
      localStorage.setItem('sal_mascot_url', file_url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const clearMascot = () => {
    setMascotUrl('');
    localStorage.removeItem('sal_mascot_url');
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
  };

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

        {/* S.A.L. Mascot Upload Card */}
        <Card className="border-2 border-purple-300 bg-white shadow-md mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-cyan-100 border-b-2 border-gray-200">
            <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Image className="w-5 h-5" />
              S.A.L. Mascot Animation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Preview */}
              <div className="w-32 h-32 rounded-2xl bg-slate-900 border-2 border-purple-400/50 flex items-center justify-center overflow-hidden">
                {mascotUrl ? (
                  mascotUrl.endsWith('.mp4') || mascotUrl.includes('video') ? (
                    <video src={mascotUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={mascotUrl} alt="S.A.L. Mascot" className="w-full h-full object-cover" />
                  )
                ) : (
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                    alt="Default S.A.L."
                    className="w-full h-full object-cover opacity-50"
                  />
                )}
              </div>
              
              {/* Upload controls */}
              <div className="flex-1 space-y-3">
                <p className="text-gray-600 text-sm">
                  Upload a GIF, video (MP4), or image to use as the animated S.A.L. mascot in the AI Assistant.
                </p>
                <div className="flex flex-wrap gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/mp4,.gif"
                    onChange={handleMascotUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isUploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : uploadSuccess ? (
                      <><Check className="w-4 h-4 mr-2" /> Uploaded!</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Upload File</>
                    )}
                  </Button>
                  {mascotUrl && (
                    <Button variant="outline" onClick={clearMascot}>
                      Reset to Default
                    </Button>
                  )}
                </div>
                {mascotUrl && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ Custom mascot active
                  </p>
                )}
              </div>
            </div>
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