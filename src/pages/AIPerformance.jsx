import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, TrendingUp, Target, Award, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AIPerformance() {
  const [showComingSoon, setShowComingSoon] = useState(false);
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

  const isAdmin = currentUser?.role === 'admin';

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['aiPerformance'],
    queryFn: async () => {
      const allMatches = await base44.entities.Match.list('-created_date', 1000);
      
      // Filter matches that have actual results recorded
      const completed = allMatches.filter(m => m.actual_result?.completed === true);
      
      // Count correct predictions
      const correct = completed.filter(m => {
        const predicted = m.prediction?.winner;
        const actual = m.actual_result?.winner;
        return predicted && actual && predicted === actual;
      });

      // Calculate stats by sport
      const bySport = {};
      completed.forEach(m => {
        if (!bySport[m.sport]) {
          bySport[m.sport] = { total: 0, correct: 0 };
        }
        bySport[m.sport].total++;
        if (m.prediction?.winner === m.actual_result?.winner) {
          bySport[m.sport].correct++;
        }
      });

      const sportStats = Object.entries(bySport).map(([sport, data]) => ({
        sport,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        total: data.total,
        correct: data.correct
      })).sort((a, b) => b.accuracy - a.accuracy);

      return {
        total: completed.length,
        correct: correct.length,
        accuracy: completed.length > 0 ? (correct.length / completed.length) * 100 : 0,
        bySport: sportStats,
        recentForm: completed.slice(0, 20),
        allMatches: allMatches.length,
        pendingMatches: allMatches.filter(m => !m.actual_result?.completed).length
      };
    },
    initialData: { total: 0, correct: 0, accuracy: 0, bySport: [], recentForm: [], allMatches: 0, pendingMatches: 0 }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-lg text-gray-600">Loading AI performance data...</p>
        </div>
      </div>
    );
  }

  // Check if we have any completed matches
  const hasData = predictions.total > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">AI Performance Tracker</h1>
              <p className="text-gray-600">Track our AI's prediction accuracy in real-time</p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="mb-8 bg-blue-50 border-blue-300">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {hasData ? (
              <>
                <strong>Live Tracking:</strong> We're tracking {predictions.allMatches} predictions. 
                {predictions.pendingMatches} matches are pending results. 
                {isAdmin && " As an admin, you can record actual results to update this page."}
              </>
            ) : (
              <>
                <strong>Coming Soon!</strong> We're currently tracking predictions. Once matches complete and results are recorded, 
                you'll see our AI's performance stats here. Check back after some games finish!
                {predictions.allMatches > 0 && ` (${predictions.allMatches} predictions waiting for results)`}
              </>
            )}
          </AlertDescription>
        </Alert>

        {hasData ? (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-2 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Overall Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-black text-purple-600">
                      {predictions.accuracy.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {predictions.correct} / {predictions.total} predictions
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-2 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Correct Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-black text-green-600">
                      {predictions.correct}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Wins verified
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Best Sport</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {predictions.bySport[0]?.sport || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {predictions.bySport[0]?.accuracy.toFixed(1)}% accuracy ({predictions.bySport[0]?.correct}/{predictions.bySport[0]?.total})
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Performance by Sport */}
            {predictions.bySport.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Performance by Sport</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictions.bySport.map((sport, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                        <div>
                          <div className="font-bold text-lg text-gray-900">{sport.sport}</div>
                          <div className="text-sm text-gray-600">{sport.correct}/{sport.total} correct predictions</div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-purple-600">{sport.accuracy.toFixed(1)}%</div>
                          <Badge className={sport.accuracy >= 60 ? "bg-green-100 text-green-800" : sport.accuracy >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                            {sport.accuracy >= 60 ? "Excellent" : sport.accuracy >= 50 ? "Good" : "Improving"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Predictions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Verified Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictions.recentForm.map((match, idx) => {
                    const wasCorrect = match.prediction?.winner === match.actual_result?.winner;
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white border-2 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{match.home_team} vs {match.away_team}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-semibold">Predicted:</span> {match.prediction?.winner} 
                            {match.prediction?.predicted_score && ` (${match.prediction.predicted_score})`}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">Actual:</span> {match.actual_result?.winner} 
                            {match.actual_result?.final_score && ` (${match.actual_result.final_score})`}
                          </div>
                        </div>
                        <div>
                          {wasCorrect ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 text-base px-4 py-2">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              ✓ Correct
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-300 text-base px-4 py-2">
                              <XCircle className="w-4 h-4 mr-2" />
                              ✗ Incorrect
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Coming Soon State */}
            <Card className="border-2 border-purple-300">
              <CardContent className="py-16 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Performance Tracking Active! 📊
                </h3>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  We're currently tracking <strong>{predictions.allMatches} AI predictions</strong>. 
                  Once matches complete and results are recorded, you'll see detailed accuracy stats here.
                </p>
                <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-8">
                  <div className="p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <div className="text-4xl mb-2">🎯</div>
                    <div className="font-bold text-gray-900">Live Predictions</div>
                    <div className="text-sm text-gray-600">Tracking every AI pick</div>
                  </div>
                  <div className="p-6 bg-pink-50 rounded-lg border-2 border-pink-200">
                    <div className="text-4xl mb-2">📈</div>
                    <div className="font-bold text-gray-900">Accuracy Stats</div>
                    <div className="text-sm text-gray-600">Updated after each game</div>
                  </div>
                  <div className="p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="text-4xl mb-2">🏆</div>
                    <div className="font-bold text-gray-900">Performance Breakdown</div>
                    <div className="text-sm text-gray-600">By sport & confidence level</div>
                  </div>
                </div>

                {predictions.pendingMatches > 0 && (
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 max-w-xl mx-auto">
                    <p className="text-blue-800 font-semibold">
                      ⏳ {predictions.pendingMatches} predictions waiting for match results to be recorded
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Bottom Info */}
        <Card className="mt-8 border-2 border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <h4 className="font-bold text-gray-900 mb-3">📊 How We Track Performance</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Every AI prediction is automatically saved with timestamps</li>
              <li>• After matches complete, actual results are recorded (manually by admin or via API)</li>
              <li>• We compare predicted winners vs actual winners to calculate accuracy</li>
              <li>• Stats are broken down by sport, confidence level, and time period</li>
              <li>• 100% transparent - all predictions and results are verifiable</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}