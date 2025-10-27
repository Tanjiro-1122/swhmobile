import React, { useState } from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Users, DollarSign, Search, CheckCircle, XCircle, Trophy, Edit, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

function AdminPanelContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [editingMatch, setEditingMatch] = useState(null);
  const [matchResults, setMatchResults] = useState({
    winner: "",
    final_score: "",
    completed: true
  });
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

  const { data: allMatches, isLoading: matchesLoading } = useQuery({
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

  const updateMatchMutation = useMutation({
    mutationFn: ({ matchId, data }) => base44.entities.Match.update(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
      queryClient.invalidateQueries({ queryKey: ['aiPerformance'] });
      setEditingMatch(null);
      setMatchResults({ winner: "", final_score: "", completed: true });
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

  const pendingMatches = allMatches.filter(m => !m.actual_result?.completed);
  const completedMatches = allMatches.filter(m => m.actual_result?.completed);
  const correctPredictions = completedMatches.filter(m => m.prediction?.winner === m.actual_result?.winner).length;

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

  const handleUpdateMatchResult = async () => {
    if (!matchResults.winner || !matchResults.final_score) {
      alert('Please fill in winner and final score');
      return;
    }

    await updateMatchMutation.mutateAsync({
      matchId: editingMatch.id,
      data: {
        actual_result: matchResults
      }
    });
  };

  const openEditMatchDialog = (match) => {
    setEditingMatch(match);
    if (match.actual_result) {
      setMatchResults(match.actual_result);
    } else {
      setMatchResults({ winner: "", final_score: "", completed: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">Manage users, VIP memberships, and match results</p>
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
                  <Trophy className="w-5 h-5" />
                  AI Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black text-white mb-2">
                  {completedMatches.length > 0 ? ((correctPredictions / completedMatches.length) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-blue-100 text-sm">
                  {correctPredictions}/{completedMatches.length} correct
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
            <TabsTrigger value="matches" className="py-3 text-lg">
              <Trophy className="w-5 h-5 mr-2" />
              Match Results
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
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="bg-orange-500/20 border-orange-500/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Pending Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-black text-white mb-2">
                    {pendingMatches.length}
                  </div>
                  <p className="text-orange-200">
                    Matches waiting for results
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-500/20 border-green-500/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-black text-white mb-2">
                    {completedMatches.length}
                  </div>
                  <p className="text-green-200">
                    Results recorded
                  </p>
                </CardContent>
              </Card>
            </div>

            {matchesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                <p className="text-slate-400 mt-4">Loading matches...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-orange-400" />
                  Pending Matches ({pendingMatches.length})
                </h3>
                
                {pendingMatches.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="py-12 text-center">
                      <p className="text-slate-400">No pending matches</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-slate-800/50 border-slate-700 hover:border-orange-500/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{match.sport}</Badge>
                                {match.league && <Badge variant="outline">{match.league}</Badge>}
                              </div>
                              <div className="text-xl font-bold text-white mb-1">
                                {match.home_team} vs {match.away_team}
                              </div>
                              <div className="text-sm text-slate-400">
                                Predicted Winner: <span className="text-white font-semibold">{match.prediction?.winner}</span>
                                {match.prediction?.predicted_score && ` (${match.prediction.predicted_score})`}
                              </div>
                              {match.match_date && (
                                <div className="text-xs text-slate-500 mt-1">
                                  {new Date(match.match_date).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => openEditMatchDialog(match)}
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Record Result
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}

                <div className="mt-12">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    Completed Matches ({completedMatches.length})
                  </h3>
                  
                  {completedMatches.length === 0 ? (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="py-12 text-center">
                        <p className="text-slate-400">No completed matches yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    completedMatches.slice(0, 10).map((match, index) => {
                      const wasCorrect = match.prediction?.winner === match.actual_result?.winner;
                      return (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="mb-4"
                        >
                          <Card className={`bg-slate-800/50 ${wasCorrect ? 'border-green-500/50' : 'border-red-500/50'}`}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary">{match.sport}</Badge>
                                    {wasCorrect ? (
                                      <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Correct
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-800">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Incorrect
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-lg font-bold text-white mb-1">
                                    {match.home_team} vs {match.away_team}
                                  </div>
                                  <div className="text-sm text-slate-400">
                                    Predicted: <span className="text-white">{match.prediction?.winner}</span> | 
                                    Actual: <span className="text-white font-semibold">{match.actual_result?.winner}</span>
                                    {match.actual_result?.final_score && ` (${match.actual_result.final_score})`}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => openEditMatchDialog(match)}
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-600 text-slate-300"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Match Result Dialog */}
      <Dialog open={!!editingMatch} onOpenChange={() => setEditingMatch(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Record Match Result
            </DialogTitle>
          </DialogHeader>

          {editingMatch && (
            <div className="space-y-6">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">Match</div>
                <div className="text-xl font-bold">{editingMatch.home_team} vs {editingMatch.away_team}</div>
                <div className="text-sm text-slate-400 mt-2">
                  AI Predicted: <span className="text-white font-semibold">{editingMatch.prediction?.winner}</span>
                  {editingMatch.prediction?.predicted_score && ` (${editingMatch.prediction.predicted_score})`}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 mb-2 block">Winner (Enter Exact Team Name)</Label>
                  <Input
                    value={matchResults.winner}
                    onChange={(e) => setMatchResults({...matchResults, winner: e.target.value})}
                    placeholder={`e.g., "${editingMatch.home_team}" or "${editingMatch.away_team}"`}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMatchResults({...matchResults, winner: editingMatch.home_team})}
                      className="border-slate-600 text-slate-300"
                    >
                      {editingMatch.home_team}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMatchResults({...matchResults, winner: editingMatch.away_team})}
                      className="border-slate-600 text-slate-300"
                    >
                      {editingMatch.away_team}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Final Score</Label>
                  <Input
                    value={matchResults.final_score}
                    onChange={(e) => setMatchResults({...matchResults, final_score: e.target.value})}
                    placeholder="e.g., 115-108 or 3-1"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                {matchResults.winner && editingMatch.prediction?.winner && (
                  <div className={`p-4 rounded-lg ${matchResults.winner === editingMatch.prediction.winner ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                    {matchResults.winner === editingMatch.prediction.winner ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">AI Prediction: CORRECT ✓</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-400">
                        <XCircle className="w-5 h-5" />
                        <span className="font-bold">AI Prediction: INCORRECT ✗</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingMatch(null)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMatchResult}
              disabled={updateMatchMutation.isLoading || !matchResults.winner || !matchResults.final_score}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateMatchMutation.isLoading ? 'Saving...' : 'Save Result'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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