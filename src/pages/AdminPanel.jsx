import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Crown, Sparkles, Star, Users, TrendingUp, DollarSign, Search, Target, RefreshCw, Loader2 } from "lucide-react";
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
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";

function AdminPanelContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [isRefreshingAccuracy, setIsRefreshingAccuracy] = useState(false);
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

  const { data: predictionOutcomes, isLoading: isLoadingAccuracy, refetch: refetchAccuracy } = useQuery({
    queryKey: ['predictionAccuracy'],
    queryFn: async () => {
      return await base44.entities.PredictionOutcome.list('-outcome_recorded_date', 1000);
    },
    initialData: [],
  });

  const handleRefreshAccuracy = async () => {
    setIsRefreshingAccuracy(true);
    await refetchAccuracy();
    setIsRefreshingAccuracy(false);
  };

  // Calculate accuracy stats
  const accuracyStats = React.useMemo(() => {
    if (!predictionOutcomes || predictionOutcomes.length === 0) {
      return { overall: 0, bySport: {}, byConfidence: {}, total: 0, correct: 0, recent: [] };
    }

    const total = predictionOutcomes.length;
    const correct = predictionOutcomes.filter(p => p.was_correct).length;
    const overall = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;

    // By sport
    const bySport = {};
    const sports = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer'];
    sports.forEach(sport => {
      const sportPredictions = predictionOutcomes.filter(p => p.sport?.toLowerCase() === sport.toLowerCase());
      const sportCorrect = sportPredictions.filter(p => p.was_correct).length;
      bySport[sport] = {
        total: sportPredictions.length,
        correct: sportCorrect,
        accuracy: sportPredictions.length > 0 ? ((sportCorrect / sportPredictions.length) * 100).toFixed(1) : 0
      };
    });

    // By confidence
    const byConfidence = {};
    ['High', 'Medium', 'Low'].forEach(conf => {
      const confPredictions = predictionOutcomes.filter(p => p.predicted_confidence === conf);
      const confCorrect = confPredictions.filter(p => p.was_correct).length;
      byConfidence[conf] = {
        total: confPredictions.length,
        correct: confCorrect,
        accuracy: confPredictions.length > 0 ? ((confCorrect / confPredictions.length) * 100).toFixed(1) : 0
      };
    });

    // Recent 10 predictions
    const recent = predictionOutcomes.slice(0, 10);

    return { overall, bySport, byConfidence, total, correct, recent };
  }, [predictionOutcomes]);

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

        {/* Prediction Accuracy Dashboard */}
        <Card className="border-2 border-blue-300 bg-white shadow-md mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-600" />
                <CardTitle className="text-2xl font-black text-gray-900">AI Prediction Accuracy</CardTitle>
              </div>
              <Button 
                onClick={handleRefreshAccuracy} 
                disabled={isRefreshingAccuracy}
                variant="outline"
                className="border-2 border-blue-400 text-blue-700 hover:bg-blue-50 font-bold"
              >
                {isRefreshingAccuracy ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingAccuracy ? (
              <div className="text-center py-8 text-gray-700 text-lg font-semibold">Loading accuracy data...</div>
            ) : accuracyStats.total === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-semibold">No prediction outcomes recorded yet</p>
                <p className="text-sm text-gray-500 mt-1">Outcomes will appear here as predictions are verified</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="text-5xl font-black text-blue-700">{accuracyStats.overall}%</div>
                    <div className="text-sm font-semibold text-gray-700 mt-1">Overall Accuracy</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="text-5xl font-black text-green-700">{accuracyStats.correct}</div>
                    <div className="text-sm font-semibold text-gray-700 mt-1">Correct Predictions</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                    <div className="text-5xl font-black text-gray-700">{accuracyStats.total}</div>
                    <div className="text-sm font-semibold text-gray-700 mt-1">Total Predictions</div>
                  </div>
                </div>

                {/* By Sport */}
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">Accuracy by Sport</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(accuracyStats.bySport).map(([sport, data]) => (
                      <div key={sport} className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-2xl mb-1">
                          {sport === 'NFL' ? '🏈' : sport === 'NBA' ? '🏀' : sport === 'MLB' ? '⚾' : sport === 'NHL' ? '🏒' : '⚽'}
                        </div>
                        <div className="text-lg font-black text-gray-900">{data.accuracy}%</div>
                        <div className="text-xs font-semibold text-gray-600">{sport}</div>
                        <div className="text-xs text-gray-500">{data.correct}/{data.total}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Confidence */}
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">Accuracy by Confidence Level</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {Object.entries(accuracyStats.byConfidence).map(([conf, data]) => (
                      <div key={conf} className={`rounded-lg p-4 border-2 ${
                        conf === 'High' ? 'bg-green-50 border-green-300' :
                        conf === 'Medium' ? 'bg-yellow-50 border-yellow-300' :
                        'bg-red-50 border-red-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-gray-700">{conf} Confidence</div>
                            <div className="text-2xl font-black text-gray-900">{data.accuracy}%</div>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <div>{data.correct} correct</div>
                            <div>{data.total} total</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Predictions */}
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">Recent Prediction Results</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {accuracyStats.recent.map((prediction, idx) => (
                      <div key={prediction.id || idx} className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                        prediction.was_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            prediction.was_correct ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            <span className="text-white font-bold text-sm">{prediction.was_correct ? '✓' : '✗'}</span>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{prediction.predicted_winner || 'Unknown'}</div>
                            <div className="text-xs text-gray-600">{prediction.sport} • {prediction.predicted_confidence} confidence</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={prediction.was_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                            {prediction.was_correct ? 'CORRECT' : 'WRONG'}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {prediction.outcome_recorded_date ? new Date(prediction.outcome_recorded_date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                filteredUsers.map((user) => (
                  <Card key={user.id} className="border-2 border-gray-300 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-lg font-black text-gray-900">{user.full_name || 'No name'}</div>
                          <div className="text-base font-semibold text-gray-700">{user.email}</div>
                          <div className="text-sm font-medium text-gray-600 mt-1">
                            Joined: {new Date(user.created_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="min-w-36">
                            {getTierBadge(user.subscription_type)}
                          </div>
                          <Select
                            value={user.subscription_type || 'free'}
                            onValueChange={(value) => handleSubscriptionChange(user.id, value)}
                          >
                            <SelectTrigger className="w-56 border-2 border-gray-300 text-gray-900 font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free" className="font-semibold">Free</SelectItem>
                              <SelectItem value="premium_monthly" className="font-semibold">Premium Monthly ($19.99/mo)</SelectItem>
                              <SelectItem value="vip_annual" className="font-semibold">VIP Annual ($149.99/yr)</SelectItem>
                              <SelectItem value="legacy" className="font-semibold">Legacy (Lifetime)</SelectItem>
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
        <FloatingDashboardButton />
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