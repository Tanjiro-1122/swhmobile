
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Sparkles, Zap, Target } from "lucide-react"; // Removed Crown, Clock, Users as VIP promo is removed
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button"; // Kept as it might be used by other components or internally
import { Badge } from "@/components/ui/badge";   // Kept as it might be used by other components or internally
import SearchBar from "../components/sports/SearchBar";
import MatchCard from "../components/sports/MatchCard";
import EmptyState from "../components/sports/EmptyState";
import TodaysBestBets from "../components/sports/TodaysBestBets";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
// import { motion } from "framer-motion"; // Removed framer-motion as VIP promo is removed

export default function Dashboard() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  // const [showVipPromo, setShowVipPromo] = useState(true); // Removed VIP promo state
  const queryClient = useQueryClient();
  
  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier } = useFreeLookupTracker(); // Added userTier

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
    // setShowVipPromo(false); // Removed as VIP promo is removed
    
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
1. You have internet access via add_context_from_internet parameter
2. Search StatMuse.com for current ${new Date().getFullYear()} season statistics
3. Check ESPN.com for match schedules and team records
4. Verify data from official league websites (NBA.com, NFL.com, PremierLeague.com)
5. Use Basketball-Reference.com or Pro-Football-Reference.com for detailed stats

TASK: Find the specific match the user is asking about and provide SPORT-SPECIFIC stats:

1. MATCH IDENTIFICATION:
   - Sport (Basketball/Soccer/Football/etc)
   - League (NBA/Premier League/NFL/etc)
   - Home team (OFFICIAL full name from league)
   - Away team (OFFICIAL full name from league)
   - Match date/time (search for scheduled date)

2. WIN PROBABILITIES (must total 100%):
   Calculate based on:
   - Current season records (W-L from StatMuse)
   - Last 5 games results
   - Head-to-head history
   - Home advantage
   - Current injuries
   
   Home Win: X%
   Away Win: Y%
   Draw: Z% (only if applicable to sport)

3. MATCH PREDICTION (NEW - REQUIRED):
   - Predicted Winner: "Home Team Name" or "Away Team Name"
   - Predicted Score: "115-108" (be specific with numbers)
   - Win Margin: "+7 points" or "2 goals" (sport-specific)
   - Confidence: "High" / "Medium" / "Low"
   - Reasoning: 2-3 sentences explaining why based on stats

4. KEY FACTORS (4-5 specific points with stats):
   Example format:
   - "Home team won 8 of last 10 games (80% win rate)"
   - "Away team averaging 115 PPG vs opponent allowing 108 PPG"

5. KEY PLAYERS (3-4 per team) - SPORT-SPECIFIC STATS ONLY:
   For EACH player provide:
   - Name (verify they're on current roster via team website)
   - Team and position
   - Season averages (PPG/APG/RPG from StatMuse or Basketball-Reference)
   - Predicted performance for THIS game (e.g., "28 PTS, 8 REB, 6 AST" or "2 goals, 1 assist" or "285 passing yards, 2 TDs")
   - Recent form: "Hot" if averaging above normal last 3 games, "Cold" if below
   - Injury status: Check today's injury report
   
   FOR BASKETBALL (NBA):
   - Points per game (PPG)
   - Assists per game (APG)
   - Rebounds per game (RPG)
   - Field Goal % (FG%)
   - Three-Point % (3P%)
   
   FOR SOCCER/FOOTBALL:
   - Goals per game
   - Assists per game
   - Shots per game
   - Pass accuracy %
   
   FOR AMERICAN FOOTBALL (NFL):
   - Passing yards (if QB)
   - Rushing yards (if RB)
   - Receiving yards (if WR)
   - Touchdowns (all positions)
   
   DO NOT MIX STATS - Basketball players should NOT have "goals", Soccer players should NOT have "3-pointers"

6. BETTING MARKETS (sport-appropriate):
   Over/Under: Use correct terminology for sport
   - Basketball: Points (e.g., "Over 225.5 points")
   - Soccer: Goals (e.g., "Over 2.5 goals")
   - Football: Points (e.g., "Over 47.5 points")
   
   Both Teams Score (if soccer): Based on scoring rates
   First to Score: Slight favor to home team (55/45)

VALIDATION RULES:
- Team names must match official league rosters
- All statistics must be from ${new Date().getFullYear()} season
- Win probabilities must be realistic (no team should have >95% or <5%)
- If you can't find the match, say "Unable to find scheduled match" in 'prediction.reasoning'.
- ALL fields in the JSON schema MUST be populated with real data.`,
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
            prediction: { // NEW FIELD
              type: "object",
              properties: {
                winner: { type: "string" },
                predicted_score: { type: "string" },
                win_margin: { type: "string" },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
                reasoning: { type: "string" }
              },
              required: ["winner", "predicted_score", "confidence", "reasoning"]
            },
            key_factors: {
              type: "array",
              items: { type: "string" }
            },
            // analysis_summary removed from top-level properties
            // confidence_level removed from top-level properties
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
                  predicted_performance: { type: "string" } // Summarizes specific stats like "28 PTS, 8 REB, 6 AST"
                },
                required: ["name", "team", "position", "predicted_performance"]
              }
            },
            betting_markets: {
              type: "object",
              properties: {
                over_under: {
                  type: "object",
                  properties: {
                    line: { type: "number" },
                    over_probability: { type: "number" },
                    under_probability: { type: "number" }
                  }
                },
                both_teams_score: {
                  type: "object",
                  properties: {
                    yes_probability: { type: "number" },
                    no_probability: { type: "number" }
                  }
                },
                total_goals_range: {
                  type: "object",
                  properties: {
                    predicted_total: { type: "number" },
                    range: { type: "string" }
                  }
                },
                first_to_score: {
                  type: "object",
                  properties: {
                    home_probability: { type: "number" },
                    away_probability: { type: "number" }
                  }
                }
              }
            }
          },
          required: ["sport", "home_team", "away_team", "home_win_probability", "away_win_probability", "prediction"] // Updated required fields
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
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} /> {/* Passed userTier */}
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      {/* VIP Promotional Section - REMOVED */}
      {/* The entire VIP promo section JSX was removed based on the code_outline */}

      {/* Main Content - No longer conditional on showVipPromo */}
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
