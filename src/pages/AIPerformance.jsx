import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Target, Award, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function AIPerformance() {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['aiPerformance'],
    queryFn: async () => {
      const allMatches = await base44.entities.Match.list('-created_date', 1000);
      
      const completed = allMatches.filter(m => m.actual_result);
      
      const correct = completed.filter(m => {
        const predicted = m.predicted_winner;
        const actual = m.actual_result?.winner;
        return predicted === actual;
      });

      const bySport = {};
      completed.forEach(m => {
        if (!bySport[m.sport]) {
          bySport[m.sport] = { total: 0, correct: 0 };
        }
        bySport[m.sport].total++;
        if (m.predicted_winner === m.actual_result?.winner) {
          bySport[m.sport].correct++;
        }
      });

      const sportStats = Object.entries(bySport).map(([sport, data]) => ({
        sport,
        accuracy: (data.correct / data.total) * 100,
        total: data.total
      })).sort((a, b) => b.accuracy - a.accuracy);

      return {
        total: completed.length,
        correct: correct.length,
        accuracy: completed.length > 0 ? (correct.length / completed.length) * 100 : 0,
        bySport: sportStats,
        recentForm: completed.slice(0, 20)
      };
    },
    initialData: { total: 0, correct: 0, accuracy: 0, bySport: [], recentForm: [] }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading AI performance data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">AI Performance</h1>
              <p className="text-gray-600">Track our AI's prediction accuracy</p>
            </div>
          </div>
        </div>

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
                  Total wins
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
                  {predictions.bySport[0]?.accuracy.toFixed(1)}% accuracy
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance by Sport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.bySport.map((sport, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-bold text-lg">{sport.sport}</div>
                    <div className="text-sm text-gray-600">{sport.total} predictions</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-600">{sport.accuracy.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.recentForm.map((match, idx) => {
                const wasCorrect = match.predicted_winner === match.actual_result?.winner;
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                    <div>
                      <div className="font-bold">{match.home_team} vs {match.away_team}</div>
                      <div className="text-sm text-gray-600">Predicted: {match.predicted_winner}</div>
                    </div>
                    <div>
                      {wasCorrect ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Correct
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          <XCircle className="w-3 h-3 mr-1" />
                          Incorrect
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}