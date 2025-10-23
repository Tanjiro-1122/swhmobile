
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, Target, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function TodaysBestBets() {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports betting analyst with access to LIVE sports data and odds.
        
        TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        
        CRITICAL INSTRUCTIONS:
        - Analyze ONLY matches happening TODAY (${new Date().toLocaleDateString()})
        - Use real-time data from ESPN, official league sites, and verified bookmakers
        - Check current betting odds from major sportsbooks
        - Verify all injury reports are current as of today
        - Consider latest team news and lineup confirmations
        
        Provide the TOP 3 MOST LIKELY bets for today based on:
        
        1. STATISTICAL ANALYSIS:
           - Current season form and trends
           - Head-to-head records (last 5 meetings)
           - Home/away performance this season
           - Recent scoring patterns (last 5 games for each team)
           - Key player availability (confirmed lineups if available)
        
        2. VALUE ASSESSMENT:
           - Current odds from major bookmakers
           - Implied probability vs actual probability
           - Historical success rate of similar bets
        
        3. RISK EVALUATION:
           - Injury impact assessment
           - Lineup/rotation changes
           - External factors (weather, rest days, motivation)
        
        For each of the TOP 3 recommendations provide:
        
        - Match details (exact teams playing today, league, kickoff/start time in local timezone)
        - Specific bet type (e.g., "Home Win", "Over 2.5 Goals", "Lakers -5.5 spread", "Player X Over 25.5 Points")
        - Confidence percentage (70-95% based on statistical likelihood)
        - Current odds (check major bookmakers like DraftKings, FanDuel, BetMGM)
        - 3-4 concrete reasons why this bet has value:
          * Statistical evidence (e.g., "Home team 8-2 in last 10, averaging 115 PPG")
          * Form analysis (e.g., "Away team on 3-game losing streak")
          * Matchup advantages (e.g., "Away team allows 120 PPG on the road")
          * Injury/lineup impact (e.g., "Star player confirmed out")
        - Risk level (Low/Medium/High)
        
        VALIDATION:
        - Verify all matches are actually scheduled for TODAY
        - Ensure teams and leagues are correct
        - Odds should be realistic (between 1.50 and 3.00 for most recommendations)
        - Confidence should correlate with risk (High confidence = Low risk)
        
        Sort by confidence level (highest first). Focus on VALUE bets with strong statistical backing.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            last_updated: { type: "string" },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sport: { type: "string" },
                  league: { type: "string" },
                  home_team: { type: "string" },
                  away_team: { type: "string" },
                  match_time: { type: "string" },
                  bet_type: { type: "string" },
                  confidence_percentage: { type: "number" },
                  odds: { type: "string" },
                  key_reasons: {
                    type: "array",
                    items: { type: "string" }
                  },
                  risk_level: {
                    type: "string",
                    enum: ["Low", "Medium", "High"]
                  }
                }
              }
            }
          }
        }
      });

      setRecommendations(result);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    }
    setIsLoading(false);
  };

  const getRiskColor = (risk) => {
    const colors = {
      Low: "bg-green-100 text-green-800 border-green-300",
      Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      High: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[risk] || colors.Medium;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return "text-green-600";
    if (confidence >= 75) return "text-blue-600";
    return "text-orange-600";
  };

  return (
    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 via-white to-orange-50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Today's Best Bets</CardTitle>
              <p className="text-sm text-yellow-100">AI-Powered Recommendations</p>
            </div>
          </div>
          {!recommendations && (
            <Button
              onClick={fetchRecommendations}
              disabled={isLoading}
              className="bg-white text-orange-600 hover:bg-yellow-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Picks
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-orange-200" />
                <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-gray-600 justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Analyzing today's matches...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Finding the best opportunities</p>
            </div>
          </div>
        )}

        {!isLoading && !recommendations && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 text-orange-400" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Win?</h3>
            <p className="text-gray-600 mb-4">
              Click "Get Picks" to see today's most promising betting opportunities based on live data and AI analysis
            </p>
          </div>
        )}

        {recommendations && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Updated: {format(new Date(), "MMM d, yyyy 'at' HH:mm")}</span>
              </div>
              <Button
                onClick={fetchRecommendations}
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>

            {recommendations.recommendations?.map((bet, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 border-orange-200 bg-white hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">{bet.sport}</Badge>
                            <Badge variant="outline">{bet.league}</Badge>
                          </div>
                          <div className="font-bold text-lg text-gray-900">
                            {bet.home_team} vs {bet.away_team}
                          </div>
                          {bet.match_time && (
                            <div className="text-sm text-gray-600">{bet.match_time}</div>
                          )}
                        </div>
                      </div>
                      <Badge className={`${getRiskColor(bet.risk_level)} border`}>
                        {bet.risk_level} Risk
                      </Badge>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Recommended Bet</div>
                          <div className="text-xl font-bold text-orange-700">{bet.bet_type}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">Confidence</div>
                          <div className={`text-3xl font-bold ${getConfidenceColor(bet.confidence_percentage)}`}>
                            {bet.confidence_percentage}%
                          </div>
                        </div>
                      </div>
                      {bet.odds && (
                        <div className="text-sm text-gray-700 mt-2">
                          <span className="font-semibold">Odds:</span> {bet.odds}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        Why This Bet?
                      </div>
                      <ul className="space-y-2">
                        {bet.key_reasons?.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> These are AI-generated recommendations based on statistical analysis and current data. 
                Past performance doesn't guarantee future results. Always bet responsibly and within your means.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
