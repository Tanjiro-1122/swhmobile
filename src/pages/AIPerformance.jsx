
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Input is no longer needed in this file after removing Google Search Tool
// import { Input } from "@/components/ui/input"; 
// Button is no longer needed in this file after removing Google Search Tool
// import { Button } from "@/components/ui/button"; 
import { Trophy, TrendingUp, CheckCircle, XCircle, Clock, BarChart3, Target, Shield } from "lucide-react";
// Search icon is no longer needed in this file after removing Google Search Tool
// import { Search } from "lucide-react"; 
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AIPerformance() {
  // Removed searchQuery state as the Google Search Tool is being moved
  // const [searchQuery, setSearchQuery] = useState("");

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

  // Filter completed matches only
  const completedMatches = allMatches.filter(match => 
    match.actual_result?.completed === true && 
    match.prediction?.winner
  );

  // Calculate statistics
  const totalPredictions = completedMatches.length;
  const correctPredictions = completedMatches.filter(match => {
    const predictedWinner = match.prediction.winner.toLowerCase();
    const actualWinner = match.actual_result.winner.toLowerCase();
    return predictedWinner.includes(actualWinner) || actualWinner.includes(predictedWinner);
  }).length;

  const accuracy = totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : 0;

  // Group by confidence level
  const byConfidence = {
    high: completedMatches.filter(m => m.prediction.confidence?.toLowerCase() === 'high'),
    medium: completedMatches.filter(m => m.prediction.confidence?.toLowerCase() === 'medium'),
    low: completedMatches.filter(m => m.prediction.confidence?.toLowerCase() === 'low')
  };

  const confidenceAccuracy = {
    high: byConfidence.high.length > 0 ? 
      ((byConfidence.high.filter(m => {
        const pw = m.prediction.winner.toLowerCase();
        const aw = m.actual_result.winner.toLowerCase();
        return pw.includes(aw) || aw.includes(pw);
      }).length / byConfidence.high.length) * 100).toFixed(1) : 0,
    medium: byConfidence.medium.length > 0 ? 
      ((byConfidence.medium.filter(m => {
        const pw = m.prediction.winner.toLowerCase();
        const aw = m.actual_result.winner.toLowerCase();
        return pw.includes(aw) || aw.includes(pw);
      }).length / byConfidence.medium.length) * 100).toFixed(1) : 0,
    low: byConfidence.low.length > 0 ? 
      ((byConfidence.low.filter(m => {
        const pw = m.prediction.winner.toLowerCase();
        const aw = m.actual_result.winner.toLowerCase();
        return pw.includes(aw) || aw.includes(pw);
      }).length / byConfidence.low.length) * 100).toFixed(1) : 0
  };

  // Removed handleSearch and handleKeyPress functions as the Google Search Tool is being moved
  // const handleSearch = () => {
  //   if (searchQuery.trim()) {
  //     const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  //     window.open(googleSearchUrl, '_blank');
  //   }
  // };

  // const handleKeyPress = (e) => {
  //   if (e.key === 'Enter') {
  //     handleSearch();
  //   }
  // };

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
              <h1 className="text-3xl font-bold text-white">AI Performance Tracking</h1>
              <p className="text-slate-400">Monitor prediction accuracy and success rates</p>
            </div>
          </div>

          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Shield className="w-4 h-4 mr-2" />
            Admin Only
          </Badge>
        </motion.div>

        {/* Google Search Tool - REMOVED */}
        {/*
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Quick Google Search
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-300 mb-4">Search for match results, scores, and sports news directly on Google</p>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Lakers vs Celtics final score October 23 2025"
                  className="flex-1 bg-slate-900 border-slate-600 text-white"
                />
                <Button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Google
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                💡 Tip: Include team names, date, and "final score" for best results
              </p>
            </CardContent>
          </Card>
        </motion.div>
        */}

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/50">
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <div className="text-4xl font-black text-green-400 mb-2">{accuracy}%</div>
                <div className="text-slate-300 font-medium">Overall Accuracy</div>
                <div className="text-sm text-slate-500 mt-1">
                  {correctPredictions} / {totalPredictions} correct
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border-blue-500/50">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                <div className="text-4xl font-black text-blue-400 mb-2">{totalPredictions}</div>
                <div className="text-slate-300 font-medium">Total Predictions</div>
                <div className="text-sm text-slate-500 mt-1">Tracked matches</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-purple-500/50">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <div className="text-4xl font-black text-purple-400 mb-2">{confidenceAccuracy.high}%</div>
                <div className="text-slate-300 font-medium">High Confidence</div>
                <div className="text-sm text-slate-500 mt-1">
                  {byConfidence.high.length} predictions
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Confidence Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
              <CardTitle className="text-white">Accuracy by Confidence Level</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { level: 'high', label: 'High Confidence', color: 'bg-green-500', accuracy: confidenceAccuracy.high, count: byConfidence.high.length },
                  { level: 'medium', label: 'Medium Confidence', color: 'bg-blue-500', accuracy: confidenceAccuracy.medium, count: byConfidence.medium.length },
                  { level: 'low', label: 'Low Confidence', color: 'bg-yellow-500', accuracy: confidenceAccuracy.low, count: byConfidence.low.length }
                ].map((item, idx) => (
                  <div key={item.level} className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>{item.label} ({item.count} predictions)</span>
                      <span className="font-bold">{item.accuracy}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.accuracy}%` }}
                        transition={{ delay: 0.5 + idx * 0.1, duration: 1 }}
                        className={`h-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Predictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
              <CardTitle className="text-white">Recent Completed Predictions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                </div>
              ) : completedMatches.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                  <p className="text-slate-400">No completed predictions yet</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Predictions will appear here after games are completed and results are updated
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedMatches.slice(0, 10).map((match, index) => {
                    const predictedWinner = match.prediction.winner.toLowerCase();
                    const actualWinner = match.actual_result.winner.toLowerCase();
                    const isCorrect = predictedWinner.includes(actualWinner) || actualWinner.includes(predictedWinner);

                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg border ${
                          isCorrect 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{match.sport}</Badge>
                              <Badge className={
                                match.prediction.confidence?.toLowerCase() === 'high' ? 'bg-green-500' :
                                match.prediction.confidence?.toLowerCase() === 'medium' ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }>
                                {match.prediction.confidence}
                              </Badge>
                            </div>
                            <div className="font-bold text-white mb-1">
                              {match.home_team} vs {match.away_team}
                            </div>
                            <div className="text-sm text-slate-400">
                              Predicted: {match.prediction.winner} ({match.prediction.predicted_score})
                            </div>
                            <div className="text-sm text-slate-400">
                              Actual: {match.actual_result.winner} ({match.actual_result.final_score})
                            </div>
                            {match.match_date && (
                              <div className="text-xs text-slate-500 mt-1">
                                {format(new Date(match.match_date), "MMM d, yyyy")}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {isCorrect ? (
                              <CheckCircle className="w-8 h-8 text-green-400" />
                            ) : (
                              <XCircle className="w-8 h-8 text-red-400" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
