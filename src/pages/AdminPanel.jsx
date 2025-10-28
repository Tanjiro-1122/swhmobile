
import React, { useState } from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Users, DollarSign, Search, CheckCircle, XCircle, Trophy, Edit, Calendar, BarChart3, Clock, CreditCard, TrendingUp, Info } from "lucide-react"; // Added new icons
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Removed Tabs, TabsContent, TabsList, TabsTrigger as they are replaced by custom buttons
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import StripeWebhookGuide from "../components/admin/StripeWebhookGuide";
import { toast, Toaster } from 'react-hot-toast'; // Added toast and Toaster

function AdminPanelContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview"); // Renamed activeTab to selectedTab and default to 'overview'
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
    queryFn: () => base44.entities.Match.list('-created_date', 500), // Sort by creation date descending
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('User updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message || 'Unknown error'}`);
    }
  });

  // Replaced updateMatchMutation with updateMatchResultMutation as per outline and consolidated logic
  const updateMatchResultMutation = useMutation({
    mutationFn: ({ id, result }) => base44.entities.Match.update(id, { actual_result: result }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
      queryClient.invalidateQueries({ queryKey: ['aiPerformance'] });
      setEditingMatch(null);
      setMatchResults({ winner: "", final_score: "", completed: true });
      toast.success('Match result updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update match result: ${error.message || 'Unknown error'}`);
    }
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
  const totalUsers = allUsers.length;

  const completedMatches = allMatches.filter(m => m.actual_result?.completed);
  const correctPredictions = completedMatches.filter(m => m.prediction?.winner === m.actual_result?.winner).length;

  // Filter for overdue pending matches (where match_date is in the past and not yet completed)
  const overduePendingMatches = allMatches.filter(m =>
    !m.actual_result?.completed && m.match_date && new Date(m.match_date) < new Date()
  );

  const filteredUsers = allUsers.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const makeVIPLifetime = async (user) => {
    const currentVIPCount = allUsers.filter(u => u.subscription_type === 'vip_lifetime').length;

    if (currentVIPCount >= 20) {
      toast.error('All 20 VIP Lifetime spots are taken!'); // Changed alert to toast
      return;
    }

    await updateUserMutation.mutateAsync({
      userId: user.id,
      data: {
        subscription_type: 'vip_lifetime',
        vip_member_number: currentVIPCount + 1 // Assign next available VIP number
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
      toast.error('Please fill in winner and final score'); // Changed alert to toast
      return;
    }

    // Now uses the consolidated updateMatchResultMutation
    await updateMatchResultMutation.mutateAsync({
      id: editingMatch.id,
      result: matchResults
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <Toaster position="bottom-right" /> {/* Toaster component for notifications */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">Manage users, VIP memberships, and match results</p>
        </div>

        {/* Tabs - Replaced old Tabs with custom buttons */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-slate-700">
          <Button
            variant={selectedTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('overview')}
            className={selectedTab === 'overview' ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={selectedTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('pending')}
            className={selectedTab === 'pending' ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending Results
            {overduePendingMatches.length > 0 && ( // Use overduePendingMatches here
              <Badge className="ml-2 bg-red-500 text-white">
                {overduePendingMatches.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={selectedTab === 'users' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('users')}
            className={selectedTab === 'users' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </Button>
          <Button
            variant={selectedTab === 'matches' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('matches')}
            className={selectedTab === 'matches' ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            All Matches
          </Button>
          <Button
            variant={selectedTab === 'revenue' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('revenue')}
            className={selectedTab === 'revenue' ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Revenue
          </Button>
          <Button
            variant={selectedTab === 'stripe' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('stripe')}
            className={selectedTab === 'stripe' ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Stripe Setup
          </Button>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          // Stats Overview (existing code moved here)
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
        )}

        {selectedTab === 'pending' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-7 h-7 text-orange-400" /> Overdue Matches Awaiting Results
            </h2>
            <p className="text-slate-400 mb-6">These matches have passed their scheduled date and require result input.</p>

            {matchesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
                <p className="text-slate-400 mt-4">Loading matches...</p>
              </div>
            ) : overduePendingMatches.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center">
                  <Info className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No overdue matches currently waiting for results.</p>
                </CardContent>
              </Card>
            ) : (
              overduePendingMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-slate-800/50 border-orange-500/50 hover:border-orange-400 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{match.sport}</Badge>
                            {match.league && <Badge variant="outline">{match.league}</Badge>}
                            <Badge className="bg-red-500 text-white">OVERDUE</Badge>
                          </div>
                          <div className="text-xl font-bold text-white mb-1">
                            {match.home_team} vs {match.away_team}
                          </div>
                          <div className="text-sm text-slate-400">
                            Predicted Winner: <span className="text-white font-semibold">{match.prediction?.winner || 'N/A'}</span>
                            {match.prediction?.predicted_score && ` (${match.prediction.predicted_score})`}
                          </div>
                          {match.match_date && (
                            <div className="text-xs text-slate-500 mt-1">
                              Scheduled: {new Date(match.match_date).toLocaleString()}
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
          </div>
        )}

        {selectedTab === 'users' && (
          // Users Tab (existing code moved here)
          <div>
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
          </div>
        )}

        {selectedTab === 'matches' && (
          // All Matches Tab - Lists all matches, sorted newest first
          <div>
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-cyan-400" /> All Matches ({allMatches.length})
            </h2>
            <p className="text-slate-400 mb-6">A comprehensive list of all recorded matches, sorted by creation date.</p>

            {matchesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                <p className="text-slate-400 mt-4">Loading matches...</p>
              </div>
            ) : allMatches.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center">
                  <Info className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No matches found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allMatches.map((match, index) => {
                  const isCompleted = match.actual_result?.completed;
                  const isOverduePending = !isCompleted && match.match_date && new Date(match.match_date) < new Date();
                  const wasCorrect = isCompleted && match.prediction?.winner === match.actual_result?.winner;

                  let borderColorClass = 'border-slate-700';
                  if (isOverduePending) {
                    borderColorClass = 'border-red-500/50';
                  } else if (isCompleted) {
                    borderColorClass = wasCorrect ? 'border-green-500/50' : 'border-red-500/50';
                  }

                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`bg-slate-800/50 ${borderColorClass} hover:border-slate-600 transition-colors`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{match.sport}</Badge>
                                {match.league && <Badge variant="outline">{match.league}</Badge>}
                                {isOverduePending && (
                                  <Badge className="bg-red-500 text-white">OVERDUE PENDING</Badge>
                                )}
                                {isCompleted ? (
                                  wasCorrect ? (
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircle className="w-3 h-3 mr-1" /> Correct
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800">
                                      <XCircle className="w-3 h-3 mr-1" /> Incorrect
                                    </Badge>
                                  )
                                ) : (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    <Clock className="w-3 h-3 mr-1" /> Pending
                                  </Badge>
                                )}
                              </div>
                              <div className="text-lg font-bold text-white mb-1">
                                {match.home_team} vs {match.away_team}
                              </div>
                              <div className="text-sm text-slate-400">
                                Predicted: <span className="text-white">{match.prediction?.winner || 'N/A'}</span>
                                {isCompleted && ` | Actual: `}
                                {isCompleted && <span className="text-white font-semibold">{match.actual_result?.winner}</span>}
                                {isCompleted && match.actual_result?.final_score && ` (${match.actual_result.final_score})`}
                              </div>
                              {match.match_date && (
                                <div className="text-xs text-slate-500 mt-1">
                                  {new Date(match.match_date).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => openEditMatchDialog(match)}
                              variant="outline"
                              size="sm"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit Result
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'revenue' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-purple-400" /> Revenue & Subscriptions
            </h2>
            <p className="text-slate-400 mb-6">Detailed revenue information will be displayed here.</p>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <Info className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Revenue insights coming soon!</p>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'stripe' && (
          // Stripe Webhook Guide (existing code moved here)
          <div className="mb-8">
            <StripeWebhookGuide />
          </div>
        )}
      </div>

      {/* Edit Match Result Dialog (existing code, now using updateMatchResultMutation) */}
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
                  AI Predicted: <span className="text-white font-semibold">{editingMatch.prediction?.winner || 'N/A'}</span>
                  {editingMatch.prediction?.predicted_score && ` (${editingMatch.prediction.predicted_score})`}
                </div>
                {editingMatch.match_date && (
                  <div className="text-xs text-slate-500 mt-1">
                    Scheduled: {new Date(editingMatch.match_date).toLocaleString()}
                  </div>
                )}
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
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {editingMatch.home_team}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMatchResults({...matchResults, winner: editingMatch.away_team})}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
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
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMatchResult}
              disabled={updateMatchResultMutation.isLoading || !matchResults.winner || !matchResults.final_score}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updateMatchResultMutation.isLoading ? 'Saving...' : 'Save Result'}
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
