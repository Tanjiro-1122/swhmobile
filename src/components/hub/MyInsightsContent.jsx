import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, TrendingUp, User, Trophy, Target, Lightbulb, 
  RefreshCw, Calendar, Users, Heart, AlertCircle, Crown,
  CheckCircle, ArrowRight, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";

export default function MyInsightsContent() {
  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const hasPreferences = currentUser?.favorite_sports?.length > 0 || 
                        currentUser?.favorite_leagues?.length > 0 ||
                        currentUser?.favorite_teams?.length > 0;

  const generateInsights = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('generatePersonalizedInsights', {});
      setInsights(response.data);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again.');
    }
    
    setIsGenerating(false);
  };

  const getConfidenceBadge = (level) => {
    const colors = {
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[level?.toLowerCase()] || colors.medium;
  };

  const getRiskBadge = (risk) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[risk?.toLowerCase()] || colors.medium;
  };

  return (
    <div className="space-y-6">
      {/* Setup Preferences Banner */}
      {!hasPreferences && !insights && (
        <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="font-bold mb-2">🎯 Get Better Recommendations!</div>
            <p className="mb-3">
              Set your favorite sports, leagues, and teams to receive more personalized insights.
            </p>
            <Button
              onClick={() => window.location.href = '/MyAccount'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Heart className="w-4 h-4 mr-2" />
              Set Preferences
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generate Insights CTA */}
      {!insights && !isGenerating && (
        <Card className="border-2 border-purple-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              Ready for Your Personalized Insights?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Our AI will analyze your betting history and preferences to generate tailored recommendations.
            </p>
            <Button
              onClick={generateInsights}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 font-bold shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate My Insights
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              ⚡ Takes about 10-15 seconds
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20 animate-ping" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-75 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-purple-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Data...</h3>
            <p className="text-gray-700">Generating personalized insights using AI</p>
          </div>
        </div>
      )}

      {/* Insights Display */}
      {insights && insights.insights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Refresh Button & Timestamp */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">
              <Calendar className="w-4 h-4 inline mr-1" />
              Generated: {insights.generated_at ? new Date(insights.generated_at).toLocaleString() : 'Just now'}
            </div>
            <Button
              onClick={generateInsights}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Refreshing...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" />Refresh Insights</>
              )}
            </Button>
          </div>

          {/* Personalized Message */}
          {insights.insights.personalized_message && (
            <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <AlertDescription className="text-purple-900 text-lg font-semibold">
                {insights.insights.personalized_message}
              </AlertDescription>
            </Alert>
          )}

          {/* Data Analyzed Summary */}
          {insights.data_analyzed && (
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-2 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-3xl font-black text-gray-900">{insights.data_analyzed.matches_count}</div>
                  <div className="text-sm text-gray-600">Matches Analyzed</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-200">
                <CardContent className="p-6 text-center">
                  <User className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-3xl font-black text-gray-900">{insights.data_analyzed.players_count}</div>
                  <div className="text-sm text-gray-600">Players Tracked</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-orange-200">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-3xl font-black text-gray-900">{insights.data_analyzed.teams_count}</div>
                  <div className="text-sm text-gray-600">Teams Analyzed</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Suggested Matches */}
          {insights.insights.suggested_matches && insights.insights.suggested_matches.length > 0 && (
            <Card className="border-2 border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-6 h-6 text-green-600" />
                  Suggested Matches for You
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {insights.insights.suggested_matches.map((match, idx) => (
                    <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-green-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{match.match_description}</h3>
                          <p className="text-sm text-gray-500">{match.sport} • {match.league}</p>
                        </div>
                        <Badge className={getConfidenceBadge(match.confidence_level)}>
                          {match.confidence_level} confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {match.date}
                      </p>
                      <p className="text-sm text-green-700 bg-green-50 p-2 rounded-lg">
                        <ArrowRight className="w-4 h-4 inline mr-1" />
                        {match.why_recommended}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Players to Watch */}
          {insights.insights.players_to_watch && insights.insights.players_to_watch.length > 0 && (
            <Card className="border-2 border-blue-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Players to Watch
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {insights.insights.players_to_watch.map((player, idx) => (
                    <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{player.player_name}</h3>
                          <p className="text-sm text-gray-500">{player.team} • {player.sport}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{player.reason}</p>
                      <p className="text-xs text-blue-600 font-medium">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Next: {player.next_game}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Betting Trends */}
          {insights.insights.betting_trends && (
            <Card className="border-2 border-purple-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  Your Betting Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {insights.insights.betting_trends.win_rate_analysis && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">📊 Win Rate Analysis</h4>
                    <p className="text-sm text-gray-700">{insights.insights.betting_trends.win_rate_analysis}</p>
                  </div>
                )}
                {insights.insights.betting_trends.favorite_bet_types && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">🎯 Favorite Bet Types</h4>
                    <p className="text-sm text-gray-700">{insights.insights.betting_trends.favorite_bet_types}</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  {insights.insights.betting_trends.strengths?.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-bold text-green-800 mb-2">💪 Your Strengths</h4>
                      <ul className="space-y-1">
                        {insights.insights.betting_trends.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insights.insights.betting_trends.areas_to_improve?.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-bold text-orange-800 mb-2">📈 Areas to Explore</h4>
                      <ul className="space-y-1">
                        {insights.insights.betting_trends.areas_to_improve.map((a, i) => (
                          <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategy Recommendations */}
          {insights.insights.strategy_recommendations && insights.insights.strategy_recommendations.length > 0 && (
            <Card className="border-2 border-yellow-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b-2 border-yellow-200">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-yellow-600" />
                  Strategy Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {insights.insights.strategy_recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 flex-1">{rec.tip}</h3>
                        <Badge className={getRiskBadge(rec.risk_level)}>
                          {rec.risk_level} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{rec.explanation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}