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
          {/* Refresh Button */}
          <div className="flex justify-end">
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