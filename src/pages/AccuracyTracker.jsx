import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Award, Calendar, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function AccuracyTracker() {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => base44.entities.PredictionAccuracy.list('-prediction_date', 100),
    initialData: []
  });

  // Calculate statistics
  const totalPredictions = predictions?.length || 0;
  const correctPredictions = predictions?.filter(p => p.was_correct).length || 0;
  const accuracyRate = totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : 0;

  // By sport
  const sports = [...new Set(predictions?.map(p => p.sport).filter(Boolean))];
  const sportStats = sports.map(sport => {
    const sportPreds = predictions.filter(p => p.sport === sport);
    const correct = sportPreds.filter(p => p.was_correct).length;
    return {
      sport,
      total: sportPreds.length,
      correct,
      accuracy: sportPreds.length > 0 ? ((correct / sportPreds.length) * 100).toFixed(1) : 0
    };
  });

  // By confidence level
  const highConfidence = predictions?.filter(p => p.confidence_level === 'high') || [];
  const mediumConfidence = predictions?.filter(p => p.confidence_level === 'medium') || [];
  const lowConfidence = predictions?.filter(p => p.confidence_level === 'low') || [];

  const highAccuracy = highConfidence.length > 0 ? ((highConfidence.filter(p => p.was_correct).length / highConfidence.length) * 100).toFixed(1) : 0;
  const mediumAccuracy = mediumConfidence.length > 0 ? ((mediumConfidence.filter(p => p.was_correct).length / mediumConfidence.length) * 100).toFixed(1) : 0;
  const lowAccuracy = lowConfidence.length > 0 ? ((lowConfidence.filter(p => p.was_correct).length / lowConfidence.length) * 100).toFixed(1) : 0;

  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPredictions = predictions?.filter(p => new Date(p.prediction_date) > thirtyDaysAgo) || [];
  const recentCorrect = recentPredictions.filter(p => p.was_correct).length;
  const recentAccuracy = recentPredictions.length > 0 ? ((recentCorrect / recentPredictions.length) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto mb-6">
              <Target className="w-10 h-10" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4">Prediction Accuracy</h1>
            <p className="text-xl text-emerald-100">
              Track our AI's historical performance across all sports
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading accuracy data...</p>
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-black text-emerald-400 mb-2">{accuracyRate}%</div>
                  <div className="text-sm text-emerald-300">Overall Accuracy</div>
                  <div className="text-xs text-slate-400 mt-2">{correctPredictions}/{totalPredictions} correct</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-black text-blue-400 mb-2">{recentAccuracy}%</div>
                  <div className="text-sm text-blue-300">Last 30 Days</div>
                  <div className="text-xs text-slate-400 mt-2">{recentCorrect}/{recentPredictions.length} correct</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-black text-purple-400 mb-2">{highAccuracy}%</div>
                  <div className="text-sm text-purple-300">High Confidence</div>
                  <div className="text-xs text-slate-400 mt-2">{highConfidence.filter(p => p.was_correct).length}/{highConfidence.length} correct</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-black text-orange-400 mb-2">{totalPredictions}</div>
                  <div className="text-sm text-orange-300">Total Predictions</div>
                  <div className="text-xs text-slate-400 mt-2">All-time tracked</div>
                </CardContent>
              </Card>
            </div>

            {/* By Sport */}
            {sportStats.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                    Accuracy by Sport
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {sportStats.map((stat, idx) => (
                      <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-white">{stat.sport}</span>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            {stat.accuracy}%
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400">
                          {stat.correct}/{stat.total} correct predictions
                        </div>
                        <div className="mt-2 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all"
                            style={{ width: `${stat.accuracy}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* By Confidence Level */}
            <Card className="bg-slate-800/50 border-slate-700 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="w-6 h-6 text-purple-400" />
                  Accuracy by Confidence Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-6 border border-green-500/30">
                    <div className="text-center">
                      <div className="text-4xl font-black text-green-400 mb-2">{highAccuracy}%</div>
                      <div className="text-sm text-green-300 mb-1">High Confidence</div>
                      <div className="text-xs text-slate-400">{highConfidence.length} predictions</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-6 border border-blue-500/30">
                    <div className="text-center">
                      <div className="text-4xl font-black text-blue-400 mb-2">{mediumAccuracy}%</div>
                      <div className="text-sm text-blue-300 mb-1">Medium Confidence</div>
                      <div className="text-xs text-slate-400">{mediumConfidence.length} predictions</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-6 border border-yellow-500/30">
                    <div className="text-center">
                      <div className="text-4xl font-black text-yellow-400 mb-2">{lowAccuracy}%</div>
                      <div className="text-sm text-yellow-300 mb-1">Low Confidence</div>
                      <div className="text-xs text-slate-400">{lowConfidence.length} predictions</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Methodology */}
            <Card className="bg-blue-500/10 border-2 border-blue-500/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  How We Track Accuracy
                </h3>
                <p className="text-blue-200 text-sm leading-relaxed">
                  All predictions are logged with timestamps and confidence levels. After games conclude, 
                  we verify outcomes against official results from ESPN, StatMuse, and league sources. 
                  Our AI learns from these results to continuously improve prediction accuracy. Note: 
                  Historical accuracy does not guarantee future results.
                </p>
              </CardContent>
            </Card>

            {totalPredictions === 0 && (
              <Card className="bg-yellow-500/10 border-2 border-yellow-500/30 mt-8">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-yellow-300 mb-2">No Predictions Tracked Yet</h3>
                  <p className="text-yellow-200">
                    Start making predictions to see accuracy stats here. Our system will automatically 
                    track and verify results.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}