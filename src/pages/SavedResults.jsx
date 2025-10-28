
import React, { useState } from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // New import
import { Label } from "@/components/ui/label"; // New import
// Updated Lucide icons: removed Bookmark, Shield, Trophy from general list, added specific ones, kept User, Trash2
import { TrendingUp, Calendar, Trophy, Trash2, Edit, CheckCircle, XCircle, User } from "lucide-react"; // New/updated imports
// Dialog imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // New imports
import { motion } from "framer-motion";
import { format } from "date-fns"; // New import
// Removed specific component imports that are no longer used
// import MatchCard from "../components/sports/MatchCard";
// import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
// import TeamStatsDisplay from "../components/team/TeamStatsDisplay";

// Renamed component from SavedResultsContent to UserPredictionsContent
function UserPredictionsContent() {
  // Removed activeTab state as tabs are no longer used
  const [editingMatch, setEditingMatch] = useState(null); // New state
  const [showDialog, setShowDialog] = useState(false); // New state
  const [resultForm, setResultForm] = useState({ // New state
    winner: '',
    final_score: '',
    completed: true // Matches are considered completed when actual_result is filled
  });
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch only the current user's matches (now referred to as predictions)
  const { data: matches, isLoading } = useQuery({ // Renamed isLoading from matchesLoading
    queryKey: ['userMatches', currentUser?.email], // Updated query key
    queryFn: async () => {
      if (!currentUser?.email) return [];
      // Filter matches by created_by to show only user's own matches
      return await base44.entities.Match.filter(
        { created_by: currentUser.email },
        '-created_date',
        500 // Limit to 500 records
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  // Removed fetch user's saved players and teams queries
  // const { data: players, isLoading: playersLoading } = useQuery({ ... });
  // const { data: teams, isLoading: teamsLoading } = useQuery({ ... });

  // Mutation to update a match's actual result
  const updateMatchMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Match.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMatches'] });
      queryClient.invalidateQueries({ queryKey: ['aiPerformanceMatches'] }); // Invalidate other relevant queries
      setShowDialog(false);
      setEditingMatch(null);
    },
  });

  // Mutation to delete a match
  const deleteMatchMutation = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMatches'] });
    },
  });

  // Removed deletePlayerMutation and deleteTeamMutation
  // const deletePlayerMutation = useMutation({ ... });
  // const deleteTeamMutation = useMutation({ ... });

  // Removed clearAllMatches, clearAllPlayers, clearAllTeams functions
  // const clearAllMatches = async () => { ... };
  // const clearAllPlayers = async () => { ... };
  // const clearAllTeams = async () => { ... };

  // New function to handle editing a match's result
  const handleEditResult = (match) => {
    setEditingMatch(match);
    setResultForm({
      winner: match.actual_result?.winner || '',
      final_score: match.actual_result?.final_score || '',
      completed: match.actual_result?.completed || true // Default to true if actual_result exists
    });
    setShowDialog(true);
  };

  // New function to submit the updated result
  const handleSubmitResult = () => {
    if (!editingMatch) return;

    updateMatchMutation.mutate({
      id: editingMatch.id,
      data: {
        actual_result: resultForm
      }
    });
  };

  // Logic for user stats
  const completedMatches = matches.filter(m => m.actual_result && m.actual_result.completed);
  const pendingMatches = matches.filter(m => !m.actual_result || !m.actual_result.completed);

  const correctPredictions = completedMatches.filter(match => {
    const predictedWinner = match.prediction?.winner?.toLowerCase();
    const actualWinner = match.actual_result?.winner?.toLowerCase();
    return predictedWinner && actualWinner && predictedWinner === actualWinner;
  });

  const userWinRate = completedMatches.length > 0
    ? ((correctPredictions.length / completedMatches.length) * 100).toFixed(1)
    : 0;

  // Removed totalSaved calculation and related badges as only matches are displayed
  // const totalSaved = (matches?.length || 0) + (players?.length || 0) + (teams?.length || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-10 h-10 text-blue-400" /> {/* Changed icon and color */}
            <h1 className="text-4xl font-bold text-white">My Saved Results</h1> {/* Updated title */}
          </div>
          <p className="text-slate-300">
            Track and update your match predictions and results
          </p>
        </div>

        {/* User Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">My Total Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white mb-1">{matches.length}</div>
              <p className="text-blue-100 text-xs">
                {completedMatches.length} with results, {pendingMatches.length} pending
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${
            parseFloat(userWinRate) >= 60 ? 'from-green-500 to-emerald-600' :
            parseFloat(userWinRate) >= 50 ? 'from-yellow-500 to-orange-600' :
            'from-red-500 to-pink-600'
          } border-0`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">My Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white mb-1">{userWinRate}%</div>
              <p className="text-white/80 text-xs">
                {correctPredictions.length} correct / {completedMatches.length} completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Pending Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white mb-1">{pendingMatches.length}</div>
              <p className="text-purple-100 text-xs">
                Matches needing results
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area - No longer uses Tabs */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="text-slate-400 mt-4">Loading your predictions...</p>
          </div>
        ) : matches.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-bold text-white mb-2">No Predictions Yet</h3>
              <p className="text-slate-400 mb-6">
                Start analyzing matches to see them here!
              </p>
              <Button
                onClick={() => window.location.href = '/Dashboard'} // Navigate to dashboard
                className="bg-blue-600 hover:bg-blue-700"
              >
                Analyze Your First Match
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match, index) => {
              const hasResult = match.actual_result && match.actual_result.completed;
              const isCorrect = hasResult &&
                match.prediction?.winner?.toLowerCase() === match.actual_result?.winner?.toLowerCase();

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border-2 ${
                    hasResult ? (isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5') : 'border-slate-700 bg-slate-800/50'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {hasResult ? (
                              isCorrect ? (
                                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                              )
                            ) : (
                              <Calendar className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            )}
                            <div>
                              <div className="font-bold text-white text-lg">
                                {match.home_team} vs {match.away_team}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Badge variant="outline" className="border-slate-600 text-slate-400">{match.sport}</Badge>
                                {match.match_date && (
                                  <span>{format(new Date(match.match_date), 'MMM d, yyyy')}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 ml-9 mt-4">
                            <div>
                              <div className="text-xs text-slate-500 mb-1">AI Predicted</div>
                              <div className="font-semibold text-white">{match.prediction?.winner}</div>
                              <div className="text-xs text-slate-400">{match.prediction?.predicted_score}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Actual Result</div>
                              {hasResult ? (
                                <>
                                  <div className="font-semibold text-white">{match.actual_result.winner}</div>
                                  <div className="text-xs text-slate-400">{match.actual_result.final_score}</div>
                                </>
                              ) : (
                                <div className="text-slate-500 italic">Not updated yet</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditResult(match)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMatchMutation.mutate(match.id)}
                            className="hover:bg-red-500/20 hover:text-red-400 text-slate-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Update Result Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Update Match Result</DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingMatch && `${editingMatch.home_team} vs ${editingMatch.away_team}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="winner" className="text-white">Winner</Label>
                <Input
                  id="winner"
                  value={resultForm.winner}
                  onChange={(e) => setResultForm({...resultForm, winner: e.target.value})}
                  placeholder={editingMatch ? `${editingMatch.home_team} or ${editingMatch.away_team}` : "Winning team name"}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="score" className="text-white">Final Score</Label>
                <Input
                  id="score"
                  value={resultForm.final_score}
                  onChange={(e) => setResultForm({...resultForm, final_score: e.target.value})}
                  placeholder="115-108"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitResult}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!resultForm.winner || !resultForm.final_score}
                >
                  Save Result
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function SavedResults() {
  return (
    <RequireAuth pageName="My Predictions"> {/* Updated pageName */}
      <UserPredictionsContent /> {/* Render the renamed component */}
    </RequireAuth>
  );
}
