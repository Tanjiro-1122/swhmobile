import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, User, Trophy, Target, Lightbulb, 
  RefreshCw, Calendar, Users, Heart, AlertCircle,
  CheckCircle, ArrowRight, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import RequireAuth from "../components/auth/RequireAuth";
import { useNavigate } from 'react-router-dom';

function MyInsightsContent() {
  const navigate = useNavigate();
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
      console.log('Insights response:', response.data);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#888", fontSize: 14, padding: "12px 16px 4px",
          fontWeight: 500
        }}
      >
        ← Back
      </button>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900">My Insights</h1>
                <p className="text-gray-600">AI-powered personalized betting recommendations</p>
              </div>
            </div>
            {insights && (
              <Button
                onClick={generateInsights}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Insights
                  </>
                )}
              </Button>
            )}
          </div>

          {currentUser?.last_insights_generated && insights && (
            <Badge variant="secondary" className="text-sm">
              Last updated: {new Date(currentUser.last_insights_generated).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Badge>
          )}
        </div>

        {/* Setup Preferences Banner */}
        {!hasPreferences && !insights && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <div className="font-bold mb-2">🎯 Get Better Recommendations!</div>
                <p className="mb-3">
                  Set your favorite sports, leagues, and teams to receive more personalized insights tailored to your interests.
                </p>
                <Button
                  onClick={() => window.location.href = '/UserPreferences'}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Set Preferences
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Generate Insights CTA */}
        {!insights && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-purple-200 shadow-2xl">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">
                  Ready for Your Personalized Insights?
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Our AI will analyze your betting history, preferences, and current trends to generate 
                  tailored recommendations just for you.
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
                  ⚡ Takes about 10-15 seconds to analyze your data
                </p>
              </CardContent>
            </Card>
          </motion.div>
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
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Insights Display */}
        {insights && insights.insights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
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
              <Card className="border-2 border-emerald-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-emerald-600" />
                    Suggested Matches For You
                  </CardTitle>
                  <p className="text-sm text-gray-600">Upcoming games you might be interested in</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {insights.insights.suggested_matches.map((match, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{match.match_description}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{match.sport}</Badge>
                              <Badge variant="secondary" className="text-xs">{match.league}</Badge>
                            </div>
                          </div>
                          <Badge className={`${getConfidenceBadge(match.confidence_level)} border-2`}>
                            {match.confidence_level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Calendar className="w-4 h-4" />
                          {match.date}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {match.why_recommended}
                        </p>
                      </motion.div>
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
                  <p className="text-sm text-gray-600">Key players you should be tracking</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {insights.insights.players_to_watch.map((player, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{player.player_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{player.team}</Badge>
                              <Badge variant="secondary">{player.sport}</Badge>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{player.reason}</p>
                        {player.next_game && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                            <Calendar className="w-4 h-4" />
                            Next: {player.next_game}
                          </div>
                        )}
                      </motion.div>
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
                  <p className="text-sm text-gray-600">Analysis of your betting patterns and performance</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {insights.insights.betting_trends.win_rate_analysis && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">📊 Win Rate Analysis</h4>
                        <p className="text-gray-700">{insights.insights.betting_trends.win_rate_analysis}</p>
                      </div>
                    )}
                    
                    {insights.insights.betting_trends.favorite_bet_types && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">🎯 Favorite Bet Types</h4>
                        <p className="text-gray-700">{insights.insights.betting_trends.favorite_bet_types}</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      {insights.insights.betting_trends.strengths && insights.insights.betting_trends.strengths.length > 0 && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                          <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Strengths
                          </h4>
                          <ul className="space-y-2">
                            {insights.insights.betting_trends.strengths.map((strength, idx) => (
                              <li key={idx} className="text-sm text-green-800">✓ {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insights.insights.betting_trends.areas_to_improve && insights.insights.betting_trends.areas_to_improve.length > 0 && (
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                          <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Areas to Explore
                          </h4>
                          <ul className="space-y-2">
                            {insights.insights.betting_trends.areas_to_improve.map((area, idx) => (
                              <li key={idx} className="text-sm text-orange-800">→ {area}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
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
                  <p className="text-sm text-gray-600">Personalized betting tips to improve your edge</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {insights.insights.strategy_recommendations.map((rec, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-900 flex-1">{rec.tip}</h3>
                          <Badge className={getRiskBadge(rec.risk_level)}>
                            {rec.risk_level} risk
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{rec.explanation}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action CTAs */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-blue-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => window.location.href = '/UserPreferences'}>
                <CardContent className="p-6 text-center">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Update Preferences</h3>
                  <p className="text-gray-600 mb-4">Refine your interests for even better recommendations</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Edit Preferences
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => window.location.href = '/Dashboard'}>
                <CardContent className="p-6 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Start Analyzing</h3>
                  <p className="text-gray-600 mb-4">Use these insights to make smarter betting decisions</p>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function MyInsights() {
  return (
    <RequireAuth pageName="My Insights">
      <MyInsightsContent />
    </RequireAuth>
  );
}