import React, { useState } from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Trophy, Target, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

function AIPerformanceContent() {
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '7days', '30days'

  // Fetch all matches with predictions
  const { data: allMatches, isLoading } = useQuery({
    queryKey: ['aiPerformanceMatches'],
    queryFn: () => base44.entities.Match.list('-created_date', 1000),
    initialData: [],
  });

  // Filter matches based on timeframe
  const getFilteredMatches = () => {
    if (timeFilter === 'all') return allMatches;
    
    const now = new Date();
    const daysAgo = timeFilter === '7days' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    return allMatches.filter(match => {
      const matchDate = new Date(match.created_date);
      return matchDate >= cutoffDate;
    });
  };

  const filteredMatches = getFilteredMatches();

  // Calculate stats
  const completedMatches = filteredMatches.filter(m => 
    m.actual_result && m.actual_result.completed === true
  );

  const pendingMatches = filteredMatches.filter(m => 
    !m.actual_result || m.actual_result.completed !== true
  );

  // Calculate correct predictions
  const correctPredictions = completedMatches.filter(match => {
    if (!match.actual_result || !match.prediction) return false;
    
    // Check if predicted winner matches actual winner
    const predictedWinner = match.prediction.winner?.toLowerCase();
    const actualWinner = match.actual_result.winner?.toLowerCase();
    
    return predictedWinner && actualWinner && predictedWinner === actualWinner;
  });

  const incorrectPredictions = completedMatches.filter(match => {
    if (!match.actual_result || !match.prediction) return false;
    
    const predictedWinner = match.prediction.winner?.toLowerCase();
    const actualWinner = match.actual_result.winner?.toLowerCase();
    
    return predictedWinner && actualWinner && predictedWinner !== actualWinner;
  });

  const winRate = completedMatches.length > 0 
    ? ((correctPredictions.length / completedMatches.length) * 100).toFixed(1)
    : 0;

  // Calculate high confidence accuracy
  const highConfidenceMatches = completedMatches.filter(m => 
    m.prediction?.confidence?.toLowerCase() === 'high'
  );
  
  const highConfidenceCorrect = highConfidenceMatches.filter(match => {
    const predictedWinner = match.prediction.winner?.toLowerCase();
    const actualWinner = match.actual_result.winner?.toLowerCase();
    return predictedWinner && actualWinner && predictedWinner === actualWinner;
  });

  const highConfidenceRate = highConfidenceMatches.length > 0
    ? ((highConfidenceCorrect.length / highConfidenceMatches.length) * 100).toFixed(1)
    : 0;

  // Sport breakdown
  const sportStats = {};
  completedMatches.forEach(match => {
    const sport = match.sport || 'Unknown';
    if (!sportStats[sport]) {
      sportStats[sport] = { total: 0, correct: 0 };
    }
    sportStats[sport].total++;
    
    const predictedWinner = match.prediction?.winner?.toLowerCase();
    const actualWinner = match.actual_result?.winner?.toLowerCase();
    if (predictedWinner && actualWinner && predictedWinner === actualWinner) {
      sportStats[sport].correct++;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            AI Performance Tracker
          </h1>
          <p className="text-slate-300">
            Track the accuracy of AI predictions vs actual game results
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setTimeFilter('all')}
            variant={timeFilter === 'all' ? 'default' : 'outline'}
            className={timeFilter === 'all' ? 'bg-blue-600' : 'text-white border-slate-600'}
          >
            All Time
          </Button>
          <Button
            onClick={() => setTimeFilter('7days')}
            variant={timeFilter === '7days' ? 'default' : 'outline'}
            className={timeFilter === '7days' ? 'bg-blue-600' : 'text-white border-slate-600'}
          >
            Last 7 Days
          </Button>
          <Button
            onClick={() => setTimeFilter('30days')}
            variant={timeFilter === '30days' ? 'default' : 'outline'}
            className={timeFilter === '30days' ? 'bg-blue-600' : 'text-white border-slate-600'}
          >
            Last 30 Days
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="text-slate-400 mt-4">Loading AI performance data...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-bold text-white mb-2">No Predictions Yet</h3>
              <p className="text-slate-400 mb-6">
                Start analyzing matches to see AI performance metrics here
              </p>
              <Button
                onClick={() => window.location.href = '/Dashboard'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Analyze Your First Match
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm font-medium">Total Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-white mb-1">{filteredMatches.length}</div>
                    <p className="text-blue-100 text-xs">
                      {completedMatches.length} completed, {pendingMatches.length} pending
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className={`bg-gradient-to-br ${
                  parseFloat(winRate) >= 60 ? 'from-green-500 to-emerald-600' : 
                  parseFloat(winRate) >= 50 ? 'from-yellow-500 to-orange-600' : 
                  'from-red-500 to-pink-600'
                } border-0`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm font-medium">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-white mb-1">{winRate}%</div>
                    <p className="text-white/80 text-xs">
                      {correctPredictions.length} correct / {completedMatches.length} finished
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm font-medium">High Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-white mb-1">{highConfidenceRate}%</div>
                    <p className="text-purple-100 text-xs">
                      {highConfidenceCorrect.length}/{highConfidenceMatches.length} high confidence picks
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm font-medium">Pending Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-white mb-1">{pendingMatches.length}</div>
                    <p className="text-orange-100 text-xs">
                      Awaiting game completion
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sport Breakdown */}
            {Object.keys(sportStats).length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 mb-8">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <CardTitle>Performance by Sport</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    {Object.entries(sportStats).map(([sport, stats]) => {
                      const sportRate = ((stats.correct / stats.total) * 100).toFixed(1);
                      return (
                        <div key={sport} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white">{sport}</span>
                            <Badge className={
                              parseFloat(sportRate) >= 60 ? 'bg-green-500' :
                              parseFloat(sportRate) >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }>
                              {sportRate}%
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-400">
                            {stats.correct} correct / {stats.total} total
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Completed Predictions */}
            {completedMatches.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 mb-8">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    Recent Completed Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {completedMatches.slice(0, 10).map((match, index) => {
                      const isCorrect = match.prediction?.winner?.toLowerCase() === match.actual_result?.winner?.toLowerCase();
                      
                      return (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`bg-slate-900/50 rounded-lg p-4 border-2 ${
                            isCorrect ? 'border-green-500/50' : 'border-red-500/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {isCorrect ? (
                                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                )}
                                <div>
                                  <div className="font-bold text-white">
                                    {match.home_team} vs {match.away_team}
                                  </div>
                                  <div className="text-sm text-slate-400">
                                    {match.sport} • {new Date(match.match_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 ml-9">
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">Predicted Winner</div>
                                  <div className="font-semibold text-white">{match.prediction?.winner}</div>
                                  <div className="text-xs text-slate-400">{match.prediction?.predicted_score}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">Actual Result</div>
                                  <div className="font-semibold text-white">{match.actual_result?.winner}</div>
                                  <div className="text-xs text-slate-400">{match.actual_result?.final_score}</div>
                                </div>
                              </div>
                            </div>
                            <Badge className={
                              match.prediction?.confidence?.toLowerCase() === 'high' ? 'bg-green-500' :
                              match.prediction?.confidence?.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                              'bg-orange-500'
                            }>
                              {match.prediction?.confidence} Confidence
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Predictions */}
            {pendingMatches.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-6 h-6" />
                    Pending Predictions ({pendingMatches.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {pendingMatches.slice(0, 5).map((match, index) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-slate-900/50 rounded-lg p-4 border border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white">
                              {match.home_team} vs {match.away_team}
                            </div>
                            <div className="text-sm text-slate-400">
                              {match.sport} • Predicted: {match.prediction?.winner} • {match.prediction?.predicted_score}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                    {pendingMatches.length > 5 && (
                      <div className="text-center text-slate-400 text-sm pt-2">
                        + {pendingMatches.length - 5} more pending predictions
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How to Update Results */}
            <Card className="bg-blue-500/10 border-blue-500/30 mt-8">
              <CardContent className="p-6">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                  How to Track Results
                </h3>
                <p className="text-slate-300 text-sm mb-4">
                  To track AI performance, you need to update match results after games complete:
                </p>
                <ol className="list-decimal list-inside text-slate-300 text-sm space-y-2">
                  <li>Go to <strong>Saved Results</strong> page</li>
                  <li>Find a completed match</li>
                  <li>Click "Update Result"</li>
                  <li>Enter the actual winner and final score</li>
                  <li>The AI performance stats will automatically update!</li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default function AIPerformance() {
  return (
    <RequireAuth pageName="AI Performance">
      <AIPerformanceContent />
    </RequireAuth>
  );
}