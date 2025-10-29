import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Crown, 
  DollarSign, 
  TrendingUp, 
  Shield,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react";

export default function AdminPanel() {
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefStatus, setBriefStatus] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      try {
        return await base44.entities.User.list();
      } catch {
        return [];
      }
    },
    enabled: currentUser?.role === 'admin',
  });

  const { data: todaysBrief, refetch: refetchBrief } = useQuery({
    queryKey: ['todaysBrief'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const briefs = await base44.entities.BettingBrief.filter({ brief_date: today });
      return briefs.length > 0 ? briefs[0] : null;
    },
    enabled: currentUser?.role === 'admin',
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <Shield className="w-4 h-4" />
          <AlertDescription>
            Access denied. This page is only available to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleGenerateDailyBrief = async () => {
    setIsGeneratingBrief(true);
    setBriefStatus(null);
    
    try {
      const response = await base44.functions.invoke('generateDailyBrief', {});
      
      if (response.data.success) {
        setBriefStatus({
          type: 'success',
          message: `✅ Daily brief generated successfully! ${response.data.brief?.top_picks?.length || 0} picks included.`
        });
        refetchBrief();
      } else {
        setBriefStatus({
          type: 'error',
          message: `⚠️ ${response.data.message || 'Brief generation failed'}`
        });
      }
    } catch (error) {
      console.error('Generate brief error:', error);
      setBriefStatus({
        type: 'error',
        message: `❌ Error: ${error.message || 'Failed to generate daily brief'}`
      });
    }
    
    setIsGeneratingBrief(false);
  };

  const userStats = {
    total: users?.length || 0,
    free: users?.filter(u => u.subscription_type === 'free' || !u.subscription_type).length || 0,
    premium: users?.filter(u => u.subscription_type === 'premium_monthly').length || 0,
    vip: users?.filter(u => u.subscription_type === 'vip_annual').length || 0,
    legacy: users?.filter(u => u.subscription_type === 'legacy').length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-purple-400" />
          <div>
            <h1 className="text-4xl font-black text-white">Admin Panel</h1>
            <p className="text-gray-400">System management and monitoring</p>
          </div>
        </div>

        {/* Daily Brief Management */}
        <Card className="mb-8 border-2 border-purple-500/30 bg-slate-800/50">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Daily Betting Brief Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Generate Today's Brief</h3>
                  <p className="text-sm text-gray-400">
                    Manually trigger AI-powered daily betting brief generation
                  </p>
                </div>
                <Button
                  onClick={handleGenerateDailyBrief}
                  disabled={isGeneratingBrief}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                  size="lg"
                >
                  {isGeneratingBrief ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Brief
                    </>
                  )}
                </Button>
              </div>

              {briefStatus && (
                <Alert 
                  variant={briefStatus.type === 'success' ? 'default' : 'destructive'}
                  className={briefStatus.type === 'success' ? 'bg-green-500/10 border-green-500/50' : ''}
                >
                  {briefStatus.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <AlertDescription className={briefStatus.type === 'success' ? 'text-green-400' : ''}>
                    {briefStatus.message}
                  </AlertDescription>
                </Alert>
              )}

              {todaysBrief && (
                <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-400">Today's Brief Status:</span>
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Generated
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-300">
                    <div><strong>Title:</strong> {todaysBrief.title}</div>
                    <div><strong>Top Picks:</strong> {todaysBrief.top_picks?.length || 0}</div>
                    <div><strong>Injury Updates:</strong> {todaysBrief.injury_updates?.length || 0}</div>
                    <div><strong>Generated:</strong> {new Date(todaysBrief.created_date).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {!todaysBrief && !isGeneratingBrief && (
                <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">No brief generated for today yet</span>
                  </div>
                  <p className="text-sm text-yellow-300/80 mt-1">
                    Click "Generate Brief" to create today's betting analysis
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-blue-500/30 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Users</p>
                  <p className="text-3xl font-black text-white">{userStats.total}</p>
                </div>
                <Users className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-500/30 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Free Users</p>
                  <p className="text-3xl font-black text-white">{userStats.free}</p>
                </div>
                <Users className="w-10 h-10 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-500/30 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Premium</p>
                  <p className="text-3xl font-black text-white">{userStats.premium}</p>
                </div>
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-500/30 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">VIP + Legacy</p>
                  <p className="text-3xl font-black text-white">{userStats.vip + userStats.legacy}</p>
                </div>
                <Crown className="w-10 h-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <Card className="border-2 border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="text-center py-8 text-gray-400">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Subscription</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4 text-sm text-white">{user.full_name || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-300">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                            {user.role || 'user'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            user.subscription_type === 'legacy' ? 'bg-yellow-500' :
                            user.subscription_type === 'vip_annual' ? 'bg-indigo-500' :
                            user.subscription_type === 'premium_monthly' ? 'bg-purple-500' :
                            'bg-gray-500'
                          }>
                            {user.subscription_type === 'legacy' ? '👑 Legacy' :
                             user.subscription_type === 'vip_annual' ? '💎 VIP' :
                             user.subscription_type === 'premium_monthly' ? '⭐ Premium' :
                             'Free'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {new Date(user.created_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}