import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Trophy, TrendingUp, Target, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AIPerformance() {
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allMatches, isLoading } = useQuery({
    queryKey: ['aiPerformanceMatches'],
    queryFn: () => base44.entities.Match.list('-created_date', 1000),
    initialData: [],
  });

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md bg-red-500/10 border-red-500/50">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-red-300">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedMatches = allMatches.filter(m => m.actual_result?.completed === true);
  
  const correctPredictions = completedMatches.filter(m => {
    const predicted = m.prediction?.winner;
    const actual = m.actual_result?.winner;
    return predicted && actual && predicted.toLowerCase().includes(actual.toLowerCase()) || actual.toLowerCase().includes(predicted.toLowerCase());
  });

  const accuracy = completedMatches.length > 0 
    ? Math.round((correctPredictions.length / completedMatches.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold">AI Performance</h1>
              <p className="text-sm sm:text-base opacity-80">Track prediction accuracy and success rate</p>
            </div>
          </div>

          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Shield className="w-4 h-4 mr-2" />
            Admin Only
          </Badge>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="bg-slate-800/90 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-blue-400" />
                <div className="text-sm text-slate-400">Total Predictions</div>
              </div>
              <div className="text-3xl sm:text-4xl font-black">{allMatches.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <div className="text-sm text-slate-400">Completed</div>
              </div>
              <div className="text-3xl sm:text-4xl font-black">{completedMatches.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <div className="text-sm text-green-300">Correct</div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-green-400">{correctPredictions.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-blue-400" />
                <div className="text-sm text-blue-300">Accuracy</div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-blue-400">{accuracy}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        {completedMatches.length === 0 && (
          <Card className="bg-yellow-500/10 border-yellow-500/50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-bold mb-2">No Completed Matches Yet</h3>
              <p className="text-slate-400">
                Performance tracking will appear here once match results are entered in the Auto Update Status page.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent Predictions */}
        {completedMatches.length > 0 && (
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader>
              <CardTitle>Recent Completed Predictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedMatches.slice(0, 10).map((match) => {
                const isCorrect = match.prediction?.winner?.toLowerCase().includes(match.actual_result?.winner?.toLowerCase()) || 
                                match.actual_result?.winner?.toLowerCase().includes(match.prediction?.winner?.toLowerCase());
                
                return (
                  <div key={match.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold mb-1">{match.home_team} vs {match.away_team}</div>
                        <div className="text-sm text-slate-400">
                          Predicted: {match.prediction?.winner} | Actual: {match.actual_result?.winner}
                        </div>
                      </div>
                      <Badge className={isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                        {isCorrect ? "✓ Correct" : "✗ Wrong"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}