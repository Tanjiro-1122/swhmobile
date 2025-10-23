import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, Target, Calendar, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function TodaysBestBets() {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Auto-load recommendations on component mount
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports betting analyst. Provide TODAY'S TOP 3 MOST LIKELY BETS.

TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

CRITICAL REQUIREMENTS:
- Use StatMuse (statmuse.com) as PRIMARY source
- Cross-reference with ESPN, DraftKings, FanDuel odds
- ONLY analyze matches happening TODAY (${new Date().toLocaleDateString()})
- Focus on high-probability outcomes with value

For each of the TOP 3 RECOMMENDATIONS provide:

1. MATCH DETAILS:
   - Sport (NBA, NFL, Premier League, etc.)
   - League name
   - Home team (full official name)
   - Away team (full official name)
   - Match time (local time with timezone)

2. RECOMMENDED BET:
   - Specific bet type (e.g., "Home Win -5.5", "Over 225.5 Total Points", "Both Teams Score")
   - Confidence percentage (70-95% based on statistics)
   - Current odds from major bookmakers (e.g., "-110", "+150")
   - Risk level: Low, Medium, or High

3. KEY REASONS (3-4 bullet points):
   - Statistical evidence from StatMuse (e.g., "Home team 12-3 last 15 games")
   - Form analysis (e.g., "Away team lost 4 straight, averaging 95 PPG")
   - Matchup advantages (e.g., "Home defense allows 105 PPG, away offense scores 118")
   - Injury/lineup factors (e.g., "Star player confirmed out per injury report")

VALIDATION:
- All matches MUST be scheduled for TODAY
- Team names must be spelled correctly
- Odds should be realistic (-200 to +300 range typically)
- Confidence should match risk (High confidence = Low risk)
- Use actual current statistics from StatMuse

IMPORTANT: If no games are scheduled today, provide 3 recommendations for the NEXT available game day and specify the date clearly.

Return exactly 3 recommendations with ALL fields filled, sorted by confidence (highest first).`,
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

      if (result && result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result);
        setError(null);
      } else {
        setError("No recommendations available at this time. Please try again later.");
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to load recommendations. Please try refreshing.");
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
          {recommendations && (
            <Button
              onClick={fetchRecommendations}
              disabled={isLoading}
              size="sm"
              className="bg-white text-orange-600 hover:bg-yellow-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Refresh
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

        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
              <p className="text-gray-700 mb-4">{error}</p>
              <Button
                onClick={fetchRecommendations}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && recommendations && recommendations.recommendations && recommendations.recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Updated: {format(new Date(), "MMM d, yyyy 'at' HH:mm")}</span>
              </div>
            </div>

            {recommendations.recommendations.map((bet, index) => (
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
                            {bet.league && <Badge variant="outline">{bet.league}</Badge>}
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

        {!isLoading && !error && recommendations && (!recommendations.recommendations || recommendations.recommendations.length === 0) && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 text-orange-400" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Games Today?</h3>
            <p className="text-gray-600 mb-4">
              There might not be any matches scheduled for today. Check back later or refresh to see upcoming games.
            </p>
            <Button
              onClick={fetchRecommendations}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Refresh Picks
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}