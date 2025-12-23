import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, TrendingUp, AlertTriangle, CloudRain, Activity, Target, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function FeedsContent() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // Get current user to access their preferences
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

  const { data: brief, isLoading, error } = useQuery({
    queryKey: ['dailyBrief', today],
    queryFn: async () => {
      const briefs = await base44.entities.BettingBrief.filter(
        { brief_date: today },
        '-created_date',
        1
      );
      return briefs[0] || null;
    },
  });

  const generateBriefMutation = useMutation({
    mutationFn: async () => {
      // Get user preferences for personalization
      const favoriteSports = currentUser?.favorite_sports || [];
      const favoriteLeagues = currentUser?.favorite_leagues || [];

      const response = await base44.functions.invoke('generateDailyBrief', {
        favoriteSports,
        favoriteLeagues
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyBrief'] });
    },
  });

  const handleGenerateBrief = () => {
    generateBriefMutation.mutate();
  };

  const getConfidenceColor = (confidence) => {
    const colors = {
      'High': 'bg-green-100 text-green-800 border-green-300',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Low': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[confidence] || colors.Medium;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your personalized feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Your Personalized Feed</h1>
          </div>
          <p className="text-gray-600">
            AI-powered insights and top picks for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {currentUser?.favorite_sports?.length > 0 && (
              <span className="ml-2 text-purple-600 font-semibold">
                • Focused on {currentUser.favorite_sports.slice(0, 2).join(', ')}
                {currentUser.favorite_sports.length > 2 && ` +${currentUser.favorite_sports.length - 2} more`}
              </span>
            )}
          </p>
        </div>

        {!brief && !generateBriefMutation.isPending && (
          <Card className="border-2 border-purple-200 mb-6 bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Feed Available Yet</h3>
              <p className="text-gray-600 mb-6">
                Generate today's AI-powered betting feed with picks tailored to your favorite sports
                {currentUser?.favorite_sports?.length > 0 && ` (${currentUser.favorite_sports.join(', ')})`}.
              </p>
              <Button
                onClick={handleGenerateBrief}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Today's Feed
              </Button>
            </CardContent>
          </Card>
        )}

        {generateBriefMutation.isPending && (
          <Card className="border-2 border-purple-200 mb-6 bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Generating Your Personalized Feed...</h3>
              <p className="text-gray-600">
                Analyzing today's games, odds, injuries, and market trends
                {currentUser?.favorite_sports?.length > 0 && ` for ${currentUser.favorite_sports.join(', ')}`}...
              </p>
            </CardContent>
          </Card>
        )}

        {generateBriefMutation.isError && (
          <Card className="border-2 border-red-200 mb-6 bg-red-50 shadow-lg">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-bold text-red-900 mb-2">Generation Failed</h3>
              <p className="text-red-700 mb-4">{generateBriefMutation.error?.message || 'Failed to generate feed. Please try again.'}</p>
              <Button
                onClick={handleGenerateBrief}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {brief && (
          <div className="space-y-6">
            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-2 border-purple-200 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="w-6 h-6" />
                    Market Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-lg text-gray-700 leading-relaxed">{brief.summary}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Picks */}
            {brief.top_picks && brief.top_picks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-2 border-green-200 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <Target className="w-6 h-6" />
                      Today's Top Picks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid gap-4">
                      {brief.top_picks.map((pick, index) => (
                        <div key={index} className="bg-white rounded-lg border-2 border-green-100 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <Badge variant="outline" className="mb-2 border-gray-300 text-gray-700">{pick.sport}</Badge>
                              <h4 className="text-xl font-bold text-gray-900">{pick.match}</h4>
                            </div>
                            <Badge className={`${getConfidenceColor(pick.confidence)} border`}>
                              {pick.confidence}
                            </Badge>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Pick:</span>
                              <span className="font-bold text-green-700 text-lg">{pick.pick}</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-gray-600">Odds:</span>
                              <span className="font-bold text-gray-900">{pick.odds}</span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{pick.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Injury Updates */}
            {brief.injury_updates && brief.injury_updates.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-2 border-red-200 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6" />
                      Key Injury Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {brief.injury_updates.map((injury, index) => (
                        <div key={index} className="bg-red-50 rounded-lg border border-red-200 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-bold text-gray-900">{injury.player} ({injury.team})</h5>
                              <p className="text-sm text-gray-600 mt-1">{injury.injury}</p>
                            </div>
                            <Badge className={
                              injury.impact === 'High' ? 'bg-red-500' :
                              injury.impact === 'Medium' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }>
                              {injury.impact} Impact
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Line Movements */}
            {brief.line_movements && brief.line_movements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-2 border-blue-200 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-6 h-6" />
                      Significant Line Movements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {brief.line_movements.map((movement, index) => (
                        <div key={index} className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                          <h5 className="font-bold text-gray-900 mb-1">{movement.match}</h5>
                          <p className="text-blue-700 font-semibold mb-2">{movement.movement}</p>
                          <p className="text-sm text-gray-600">{movement.significance}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Sharp Money */}
            {brief.sharp_money_indicators && brief.sharp_money_indicators.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="border-2 border-indigo-200 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <CardTitle className="text-2xl font-bold">💎 Sharp Money Indicators</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ul className="space-y-2">
                      {brief.sharp_money_indicators.map((indicator, index) => (
                        <li key={index} className="flex items-start gap-3 bg-indigo-50 rounded-lg p-3">
                          <span className="text-indigo-600 font-bold">▶</span>
                          <span className="text-gray-700">{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Weather Alerts */}
            {brief.weather_alerts && brief.weather_alerts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="border-2 border-cyan-200 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <CloudRain className="w-6 h-6" />
                      Weather Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {brief.weather_alerts.map((alert, index) => (
                        <div key={index} className="bg-cyan-50 rounded-lg border border-cyan-200 p-4">
                          <h5 className="font-bold text-gray-900 mb-1">{alert.match}</h5>
                          <p className="text-cyan-700 font-semibold mb-2">{alert.conditions}</p>
                          <p className="text-sm text-gray-600">{alert.impact}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Refresh Button */}
            <div className="text-center pt-4">
              <Button
                onClick={handleGenerateBrief}
                variant="outline"
                className="border-2 border-purple-300 hover:bg-purple-50 text-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Feed
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Feeds() {
  // Betting Briefs is now free for all users (part of free tier value)
  return <FeedsContent />;
}