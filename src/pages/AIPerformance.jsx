import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, TrendingUp, TrendingDown, Target, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function AIPerformance() {
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: completedMatches, isLoading } = useQuery({
    queryKey: ['completedMatches'],
    queryFn: async () => {
      const matches = await base44.entities.Match.list('-created_date', 500);
      return matches.filter(match => match.actual_result?.completed === true);
    },
    initialData: [],
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="max-w-md bg-red-500/10 border-red-500/50">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-red-300">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate performance metrics
  const calculatePerformance = () => {
    let correct = 0;
    let incorrect = 0;
    let bySport = {};
    let byConfidence = { high: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, low: { correct: 0, total: 0 } };

    completedMatches.forEach(match => {
      if (!match.prediction?.winner || !match.actual_result?.winner) return;

      const predicted = match.prediction.winner.trim().toLowerCase();
      const actual = match.actual_result.winner.trim().toLowerCase();
      const isCorrect = predicted === actual;

      if (isCorrect) correct++;
      else incorrect++;

      // By sport
      if (!bySport[match.sport]) {
        bySport[match.sport] = { correct: 0, total: 0 };
      }
      bySport[match.sport].total++;
      if (isCorrect) bySport[match.sport].correct++;

      // By confidence
      const confidence = match.prediction.confidence?.toLowerCase() || 'medium';
      if (byConfidence[confidence]) {
        byConfidence[confidence].total++;
        if (isCorrect) byConfidence[confidence].correct++;
      }
    });

    const totalPredictions = correct + incorrect;
    const accuracy = totalPredictions > 0 ? ((correct / totalPredictions) * 100).toFixed(1) : 0;

    return { correct, incorrect, totalPredictions, accuracy, bySport, byConfidence };
  };

  const performance = calculatePerformance();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Performance</h1>
              <p className="text-slate-400">Track prediction accuracy across all matches</p>
            </div>
          </div>

          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Shield className="w-4 h-4 mr-2" />
            Admin Only
          </Badge>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : completedMatches.length === 0 ? (
          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <Clock className="w-4 h-4" />
            <AlertDescription className="text-yellow-300">
              No completed matches yet. Performance metrics will appear once matches are completed and results are updated.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-slate-800/90 border-slate-700">
                <CardContent className="p-6">
                  <div className="text-sm text-slate-400 mb-2">Overall Accuracy</div>
                  <div className="text-4xl font-black text-green-400">{performance.accuracy}%</div>
                  <div className="text-xs text-slate-500 mt-2">
                    {performance.correct} / {performance.totalPredictions} correct
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/90 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Correct
                  </div>
                  <div className="text-4xl font-black text-green-400">{performance.correct}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/90 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    Incorrect
                  </div>
                  <div className="text-4xl font-black text-red-400">{performance.incorrect}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/90 border-slate-700">
                <CardContent className="p-6">
                  <div className="text-sm text-slate-400 mb-2">Total Predictions</div>
                  <div className="text-4xl font-black text-blue-400">{performance.totalPredictions}</div>
                </CardContent>
              </Card>
            </div>

            {/* By Sport */}
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Performance by Sport
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(performance.bySport).map(([sport, stats]) => {
                    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
                    return (
                      <div key={sport} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <div className="font-bold text-white mb-2">{sport}</div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-black text-green-400">{accuracy}%</div>
                          <div className="text-sm text-slate-400">{stats.correct}/{stats.total}</div>
                        </div>
                        <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* By Confidence Level */}
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  Performance by Confidence Level
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(performance.byConfidence)
                    .filter(([_, stats]) => stats.total > 0)
                    .map(([confidence, stats]) => {
                      const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
                      const color = confidence === 'high' ? 'green' : confidence === 'medium' ? 'blue' : 'yellow';
                      return (
                        <div key={confidence} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                          <Badge className={`bg-${color}-500/20 text-${color}-400 border-${color}-500/30 mb-3`}>
                            {confidence.toUpperCase()} Confidence
                          </Badge>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`text-3xl font-black text-${color}-400`}>{accuracy}%</div>
                            <div className="text-sm text-slate-400">{stats.correct}/{stats.total}</div>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                              className={`bg-${color}-500 h-2 rounded-full transition-all`}
                              style={{ width: `${accuracy}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Predictions */}
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
                <CardTitle className="text-white">Recent Completed Predictions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {completedMatches.slice(0, 10).map((match) => {
                    const predicted = match.prediction?.winner?.trim().toLowerCase();
                    const actual = match.actual_result?.winner?.trim().toLowerCase();
                    const isCorrect = predicted === actual;

                    return (
                      <div key={match.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex-1">
                          <div className="font-bold text-white mb-1">
                            {match.home_team} vs {match.away_team}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">{match.sport}</Badge>
                            <span className="text-slate-400">
                              Predicted: {match.prediction?.winner}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">
                              Actual: {match.actual_result?.winner}
                            </span>
                          </div>
                        </div>
                        <div>
                          {isCorrect ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          ) : (
                            <XCircle className="w-8 h-8 text-red-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}