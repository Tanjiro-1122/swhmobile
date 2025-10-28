import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy,
  TrendingUp,
  AlertCircle,
  Filter,
  Edit
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import RequireAuth from "../components/auth/RequireAuth";

function SavedResultsContent() {
  const [filterStatus, setFilterStatus] = useState("all"); // all, completed, pending
  const [filterSport, setFilterSport] = useState("all");
  const queryClient = useQueryClient();

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

  const { data: matches, isLoading } = useQuery({
    queryKey: ['allMatches', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Match.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const updateResultMutation = useMutation({
    mutationFn: ({ id, result }) => base44.entities.Match.update(id, { actual_result: result }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMatches'] });
    },
  });

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const statusMatch = filterStatus === "all" || 
      (filterStatus === "completed" && match.actual_result?.completed) ||
      (filterStatus === "pending" && !match.actual_result?.completed);
    
    const sportMatch = filterSport === "all" || match.sport === filterSport;
    
    return statusMatch && sportMatch;
  });

  // Get unique sports
  const sports = [...new Set(matches.map(m => m.sport))].filter(Boolean);

  // Calculate accuracy
  const completedMatches = matches.filter(m => m.actual_result?.completed);
  const correctPredictions = completedMatches.filter(m => 
    m.actual_result?.winner === m.prediction?.winner
  ).length;
  const accuracy = completedMatches.length > 0 
    ? ((correctPredictions / completedMatches.length) * 100).toFixed(1)
    : 0;

  const isPastDate = (dateString) => {
    if (!dateString) return false;
    try {
      return new Date(dateString) < new Date();
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Match Results & Predictions</h1>
              <p className="text-slate-400">Track AI accuracy and game outcomes</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Total Predictions</span>
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{matches.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Completed</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">{completedMatches.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Pending</span>
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {matches.length - completedMatches.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">AI Accuracy</span>
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">{accuracy}%</div>
              <div className="text-xs text-slate-400 mt-1">
                {correctPredictions}/{completedMatches.length} correct
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-2 border-slate-700 bg-slate-800/50 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-semibold text-white">Filters:</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                  className={filterStatus === "all" ? "bg-blue-600" : ""}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("completed")}
                  className={filterStatus === "completed" ? "bg-green-600" : ""}
                >
                  Completed
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("pending")}
                  className={filterStatus === "pending" ? "bg-yellow-600" : ""}
                >
                  Pending
                </Button>
              </div>

              {sports.length > 0 && (
                <select
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 text-white text-sm border border-slate-600"
                >
                  <option value="all">All Sports</option>
                  {sports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Matches List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading matches...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <Card className="border-2 border-slate-700 bg-slate-800/50">
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
              <p className="text-slate-400">Try adjusting your filters or analyze some matches first.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match, index) => (
              <MatchResultCard
                key={match.id}
                match={match}
                index={index}
                onUpdateResult={(result) => 
                  updateResultMutation.mutate({ id: match.id, result })
                }
                isPastDate={isPastDate(match.match_date)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchResultCard({ match, index, onUpdateResult, isPastDate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [winner, setWinner] = useState(match.actual_result?.winner || "");
  const [finalScore, setFinalScore] = useState(match.actual_result?.final_score || "");

  const isCompleted = match.actual_result?.completed;
  const predictionCorrect = isCompleted && match.actual_result?.winner === match.prediction?.winner;

  const handleSaveResult = () => {
    onUpdateResult({
      winner,
      final_score: finalScore,
      completed: true
    });
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`border-2 ${
        isCompleted 
          ? predictionCorrect 
            ? 'border-green-500 bg-green-900/20' 
            : 'border-red-500 bg-red-900/20'
          : isPastDate
            ? 'border-yellow-500 bg-yellow-900/20'
            : 'border-slate-700 bg-slate-800/50'
      }`}>
        <CardHeader className="bg-slate-800/80">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">{match.sport}</Badge>
                {match.league && <Badge variant="outline" className="text-xs">{match.league}</Badge>}
                {isCompleted ? (
                  predictionCorrect ? (
                    <Badge className="bg-green-600 text-white">✅ Correct</Badge>
                  ) : (
                    <Badge className="bg-red-600 text-white">❌ Incorrect</Badge>
                  )
                ) : isPastDate ? (
                  <Badge className="bg-yellow-600 text-white">⏰ Needs Update</Badge>
                ) : (
                  <Badge className="bg-slate-600 text-white">⏳ Upcoming</Badge>
                )}
              </div>
              <CardTitle className="text-xl text-white">
                {match.home_team} vs {match.away_team}
              </CardTitle>
              {match.match_date && (
                <p className="text-sm text-slate-400 mt-1">
                  {format(new Date(match.match_date), 'PPP')}
                </p>
              )}
            </div>
            {!isCompleted && isPastDate && (
              <Button
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                className="border-yellow-500 text-yellow-500"
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Update Result'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* AI Prediction */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white">AI Prediction</h3>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Predicted Winner</div>
                <div className="text-lg font-bold text-white">{match.prediction?.winner}</div>
              </div>

              {match.prediction?.predicted_score && (
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Predicted Score</div>
                  <div className="text-lg font-bold text-white">{match.prediction.predicted_score}</div>
                </div>
              )}

              {match.prediction?.confidence && (
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Confidence</div>
                  <div className="text-lg font-bold text-white">{match.prediction.confidence}</div>
                </div>
              )}
            </div>

            {/* Actual Result */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-white">Actual Result</h3>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Winner</label>
                    <select
                      value={winner}
                      onChange={(e) => setWinner(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    >
                      <option value="">Select winner...</option>
                      <option value={match.home_team}>{match.home_team}</option>
                      <option value={match.away_team}>{match.away_team}</option>
                      <option value="Draw">Draw</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Final Score</label>
                    <Input
                      value={finalScore}
                      onChange={(e) => setFinalScore(e.target.value)}
                      placeholder="e.g., 115-108"
                      className="bg-slate-700 text-white border-slate-600"
                    />
                  </div>

                  <Button
                    onClick={handleSaveResult}
                    disabled={!winner || !finalScore}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Result
                  </Button>
                </div>
              ) : isCompleted ? (
                <>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Winner</div>
                    <div className="text-lg font-bold text-white">{match.actual_result?.winner}</div>
                  </div>

                  {match.actual_result?.final_score && (
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-1">Final Score</div>
                      <div className="text-lg font-bold text-white">{match.actual_result.final_score}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-slate-900/50 rounded-lg p-8">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">
                      {isPastDate ? 'Result pending - click "Update Result" to add' : 'Match not yet played'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SavedResults() {
  return (
    <RequireAuth pageName="SavedResults">
      <SavedResultsContent />
    </RequireAuth>
  );
}