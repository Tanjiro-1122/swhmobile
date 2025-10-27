import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, TrendingUp, CheckCircle, XCircle, Minus, Calendar, Target, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import RequireAuth from "../components/auth/RequireAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function AIPerformanceContent() {
  const [filterSport, setFilterSport] = useState("all");
  const queryClient = useQueryClient();

  // Fetch all matches (predictions) from the current user
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

  const { data: allMatches, isLoading } = useQuery({
    queryKey: ['aiPerformance', currentUser?.email],
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
    mutationFn: ({ id, result }) => base44.entities.Match.update(id, { prediction_result: result }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiPerformance'] });
    },
  });

  // Filter matches by sport
  const filteredMatches = filterSport === "all" 
    ? allMatches 
    : allMatches.filter(m => m.sport?.toLowerCase() === filterSport.toLowerCase());

  // Calculate statistics
  const wonPredictions = filteredMatches.filter(m => m.prediction_result === 'won').length;
  const lostPredictions = filteredMatches.filter(m => m.prediction_result === 'lost').length;
  const pushPredictions = filteredMatches.filter(m => m.prediction_result === 'push').length;
  const pendingPredictions = filteredMatches.filter(m => !m.prediction_result || m.prediction_result === 'pending').length;
  
  const totalCompleted = wonPredictions + lostPredictions;
  const winRate = totalCompleted > 0 ? ((wonPredictions / totalCompleted) * 100).toFixed(1) : 0;

  // Group by sport for breakdown
  const sportBreakdown = allMatches.reduce((acc, match) => {
    const sport = match.sport || 'Unknown';
    if (!acc[sport]) {
      acc[sport] = { total: 0, won: 0, lost: 0, push: 0 };
    }
    acc[sport].total++;
    if (match.prediction_result === 'won') acc[sport].won++;
    if (match.prediction_result === 'lost') acc[sport].lost++;
    if (match.prediction_result === 'push') acc[sport].push++;
    return acc;
  }, {});

  const handleUpdateResult = (matchId, result) => {
    updateResultMutation.mutate({ id: matchId, result });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">AI Performance Tracker</h1>
              <p className="text-gray-600">Track and verify prediction accuracy</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading predictions...</p>
          </div>
        ) : (
          <>
            {/* Overall Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-green-700 font-semibold">Win Rate</div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-4xl font-black text-green-700">{winRate}%</div>
                  <div className="text-xs text-green-600 mt-1">{wonPredictions} wins / {totalCompleted} completed</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-blue-700 font-semibold">Total Predictions</div>
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-4xl font-black text-blue-700">{filteredMatches.length}</div>
                  <div className="text-xs text-blue-600 mt-1">{pendingPredictions} pending results</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-purple-700 font-semibold">Wins</div>
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-4xl font-black text-purple-700">{wonPredictions}</div>
                  <div className="text-xs text-purple-600 mt-1">Correct predictions</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-red-700 font-semibold">Losses</div>
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-4xl font-black text-red-700">{lostPredictions}</div>
                  <div className="text-xs text-red-600 mt-1">{pushPredictions} pushes</div>
                </CardContent>
              </Card>
            </div>

            {/* Sport Breakdown */}
            {Object.keys(sportBreakdown).length > 0 && (
              <Card className="mb-8 border-2 border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                    Performance by Sport
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(sportBreakdown).map(([sport, stats]) => {
                      const completed = stats.won + stats.lost;
                      const sportWinRate = completed > 0 ? ((stats.won / completed) * 100).toFixed(1) : 0;
                      return (
                        <div key={sport} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                          <div className="text-lg font-bold text-gray-900 mb-2">{sport}</div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Win Rate:</span>
                              <span className="font-bold text-green-700">{sportWinRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Record:</span>
                              <span className="font-semibold">{stats.won}-{stats.lost}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-semibold">{stats.total}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filter */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Predictions</h2>
              <Select value={filterSport} onValueChange={setFilterSport}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="soccer">Soccer</SelectItem>
                  <SelectItem value="baseball">Baseball</SelectItem>
                  <SelectItem value="hockey">Hockey</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Predictions List */}
            {filteredMatches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Predictions Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start analyzing matches to track AI performance
                  </p>
                  <Button
                    onClick={() => window.location.href = '/Dashboard'}
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    Analyze a Match
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-2 border-gray-200 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge variant="outline">{match.sport}</Badge>
                              {match.league && (
                                <Badge variant="secondary">{match.league}</Badge>
                              )}
                              {match.match_date && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(match.match_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>

                            <div className="text-xl font-bold text-gray-900 mb-2">
                              {match.home_team} vs {match.away_team}
                            </div>

                            {match.prediction && (
                              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-3">
                                <div className="text-sm text-gray-600 mb-1">AI Prediction</div>
                                <div className="font-bold text-purple-700 text-lg mb-1">
                                  {match.prediction.winner} to win
                                </div>
                                {match.prediction.predicted_score && (
                                  <div className="text-sm text-gray-700">
                                    Score: {match.prediction.predicted_score}
                                  </div>
                                )}
                                {match.prediction.confidence && (
                                  <Badge className="mt-2 bg-blue-100 text-blue-800">
                                    {match.prediction.confidence} Confidence
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="ml-6 flex flex-col gap-2">
                            <div className="text-sm text-gray-600 mb-1">Mark Result:</div>
                            <Button
                              size="sm"
                              variant={match.prediction_result === 'won' ? 'default' : 'outline'}
                              className={match.prediction_result === 'won' ? 'bg-green-600 hover:bg-green-700' : ''}
                              onClick={() => handleUpdateResult(match.id, 'won')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Won
                            </Button>
                            <Button
                              size="sm"
                              variant={match.prediction_result === 'lost' ? 'default' : 'outline'}
                              className={match.prediction_result === 'lost' ? 'bg-red-600 hover:bg-red-700' : ''}
                              onClick={() => handleUpdateResult(match.id, 'lost')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Lost
                            </Button>
                            <Button
                              size="sm"
                              variant={match.prediction_result === 'push' ? 'default' : 'outline'}
                              className={match.prediction_result === 'push' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                              onClick={() => handleUpdateResult(match.id, 'push')}
                            >
                              <Minus className="w-4 h-4 mr-1" />
                              Push
                            </Button>
                          </div>
                        </div>

                        {match.prediction_result && match.prediction_result !== 'pending' && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <Badge className={
                              match.prediction_result === 'won' ? 'bg-green-100 text-green-800' :
                              match.prediction_result === 'lost' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              Result: {match.prediction_result.toUpperCase()}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AIPerformance() {
  return (
    <RequireAuth pageName="AI Performance Tracker">
      <AIPerformanceContent />
    </RequireAuth>
  );
}