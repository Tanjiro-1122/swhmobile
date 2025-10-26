
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Sparkles, Zap, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchBar from "../components/sports/SearchBar";
import MatchCard from "../components/sports/MatchCard";
import EmptyState from "../components/sports/EmptyState";
import TodaysBestBets from "../components/sports/TodaysBestBets";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";

export default function Dashboard() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const queryClient = useQueryClient();
  
  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier } = useFreeLookupTracker();

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

  const { data: matches, isLoading, error: loadError } = useQuery({
    queryKey: ['matches', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Match.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const handleSearch = async (query) => {
    
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a sports analytics AI with INTERNET ACCESS. You MUST use real-time data from the web.

SEARCH QUERY: "${query}"
TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

CRITICAL INSTRUCTIONS:
1. You have internet access - search StatMuse.com, ESPN.com, official league websites
2. Get SPORT-SPECIFIC statistics only - DO NOT MIX STATS
3. Include INJURY REPORTS and WEATHER IMPACT

REQUIRED SECTIONS:

1. MATCH IDENTIFICATION:
   - Sport, League, Teams, Date/Time

2. WIN PROBABILITIES & PREDICTION:
   - Home/Away/Draw probabilities
   - Predicted Winner
   - Predicted Score (specific numbers)
   - Win Margin
   - Confidence Level (High/Medium/Low)
   - Detailed Reasoning (2-3 sentences with stats)

3. KEY FACTORS (4-5 points with stats)

4. KEY PLAYERS (3-4 per team):
   SPORT-SPECIFIC STATS ONLY:
   - Basketball: PPG, APG, RPG, FG%, 3P% + predicted "28 PTS, 8 REB, 6 AST"
   - Soccer: Goals/game, assists, shots + predicted "2 goals, 1 assist"
   - Football: Passing/Rushing yards, TDs + predicted "285 passing yards, 2 TDs"
   
   DO NOT MIX - Basketball players should NOT have "goals"

5. INJURY REPORT (REQUIRED):
   Search "[team name] injury report ${new Date().toLocaleDateString()}"
   For EACH injured player:
   - Player name
   - Team
   - Injury (e.g., "ankle sprain")
   - Status: Out/Questionable/Day-to-Day
   - Impact on game: "High" if star player, "Medium" if role player, "Low" if bench

6. WEATHER IMPACT (REQUIRED for outdoor sports):
   Search "[venue name] weather forecast [game date]"
   - Conditions: Clear/Rainy/Snowy/Windy
   - Temperature: degrees + wind chill
   - Wind Speed: mph
   - Impact Rating: High/Medium/Low/None
   - Betting Impact: How it affects totals/spread

7. BETTING MARKETS (sport-appropriate totals)

VALIDATION:
- Stats MUST match the sport
- All sections MUST be populated
- Use real current-season data

Return valid JSON.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sport: { type: "string" },
            league: { type: "string" },
            home_team: { type: "string" },
            away_team: { type: "string" },
            match_date: { type: "string" },
            home_win_probability: { type: "number" },
            away_win_probability: { type: "number" },
            draw_probability: { type: "number" },
            prediction: {
              type: "object",
              properties: {
                winner: { type: "string" },
                predicted_score: { type: "string" },
                win_margin: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              },
              required: ["winner", "predicted_score", "confidence", "reasoning"]
            },
            key_factors: {
              type: "array",
              items: { type: "string" }
            },
            key_players: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  team: { type: "string" },
                  position: { type: "string" },
                  recent_form: { type: "string" },
                  injury_status: { type: "string" },
                  predicted_performance: { type: "string" }
                }
              }
            },
            betting_markets: {
              type: "object",
              properties: {
                over_under: { type: "object" },
                both_teams_score: { type: "object" },
                first_to_score: { type: "object" }
              }
            },
            injuries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  player_name: { type: "string" },
                  team: { type: "string" },
                  injury: { type: "string" },
                  status: { type: "string" },
                  impact: { type: "string" }
                },
                required: ["player_name", "team", "status"]
              }
            },
            weather_impact: {
              type: "object",
              properties: {
                conditions: { type: "string" },
                temperature: { type: "string" },
                wind_speed: { type: "string" },
                impact_rating: { type: "string" },
                betting_impact: { type: "string" }
              }
            }
          },
          required: ["sport", "home_team", "away_team", "home_win_probability", "away_win_probability", "prediction", "injuries"]
        }
      });

      console.log("✅ Match Analysis Result:", result);

      if (!result || !result.sport || !result.home_team || !result.away_team || !result.prediction) {
        throw new Error("Invalid response - missing required match data or prediction");
      }

      // Check the new prediction.reasoning field for "Unable to find"
      if (result.prediction?.reasoning?.includes("Unable to find scheduled match")) {
        throw new Error("Match not found - try a different date or check team names");
      }

      await base44.entities.Match.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      
    } catch (err) {
      console.error("❌ Match Analysis Error:", err);
      // Simplified error handling message
      setError("Failed to analyze the match. Please try again with more specific details (team names, league, or date).");
    }

    setIsSearching(false);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-600 p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto bg-red-500/10 border-red-500/50 text-red-400">
          <AlertDescription>
            Failed to load matches. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-600">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Today's Best Bets Section */}
          <div className="mb-12">
            <TodaysBestBets 
              onLookupUsed={recordLookup}
              canLookup={canLookup}
              onLimitReached={() => setShowLimitModal(true)}
            />
          </div>

          {/* Search Section */}
          <div className="mb-12">
            <div className="bg-white/90 backdrop-blur-xl border-4 border-white rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Analyze Any Match</h2>
                  <p className="text-slate-600">Get instant win probabilities and betting insights</p>
                </div>
              </div>
              <SearchBar onSearch={handleSearch} isSearching={isSearching} />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50 text-red-400">
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-20 animate-ping" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-75 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analyzing Match Data</h3>
                <p className="text-white/80">Fetching live stats from StatMuse & ESPN...</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {!isSearching && (
            <>
              {matches.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                      <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
                      Your Match Predictions
                      <span className="text-white/70">({matches.length})</span>
                    </h2>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-8">
                    {matches.map((match, index) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onDelete={deleteMutation.mutate}
                        index={index}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState />
              )}
            </>
          )}
        </div>

      {/* Footer Disclaimer */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-2xl p-6">
          <p className="text-sm text-white">
            <strong className="font-bold">⚠️ Responsible Gambling:</strong> These predictions are for informational purposes only. 
            Always gamble responsibly and never bet more than you can afford to lose. Statistics are sourced from StatMuse, ESPN, and official league data.
          </p>
        </div>
      </div>
    </div>
  );
}
