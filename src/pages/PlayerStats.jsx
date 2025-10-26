
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import EmptyPlayerState from "../components/player/EmptyPlayerState";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";

export default function PlayerStats() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const queryClient = useQueryClient();

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup } = useFreeLookupTracker();

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

  const { data: players, isLoading, error: loadError } = useQuery({
    queryKey: ['players', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.PlayerStats.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerStats.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
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
        prompt: `You are a sports statistics AI with INTERNET ACCESS. You MUST fetch real, current data from the web.

PLAYER SEARCH: "${query}"
TODAY: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
SEASON: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}

CRITICAL INSTRUCTIONS:
1. You have internet access - search StatMuse.com, Basketball-Reference.com, ESPN.com
2. Search for "${query} stats ${new Date().getFullYear()}"
3. Get SPORT-SPECIFIC statistics only
4. DO NOT MIX stats from different sports

STEP-BY-STEP:
1. Identify player's sport, team, position
2. Get season averages from StatMuse
3. Get last 5-10 game logs with dates
4. Check injury report
5. Find next scheduled game
6. Make PERFORMANCE PREDICTION for next game

REQUIRED DATA:

1. PLAYER INFO:
   - Full name, current team, position, sport, league

2. SEASON AVERAGES (SPORT-SPECIFIC STATS ONLY):
   
   FOR BASKETBALL:
   - PPG, APG, RPG, FG%, 3P%, FT%, SPG, BPG, MPG
   - DO NOT include goals, shots_per_game, tackles
   
   FOR SOCCER:
   - Goals/90min, Assists/90min, Shots/game, Passes/game, Tackles/game
   - DO NOT include rebounds, blocks, 3P%
   
   FOR FOOTBALL (NFL):
   - Passing yards, Completions, TDs, INTs (QB)
   - Rushing yards, Carries, TDs (RB)
   - Receptions, Receiving yards, TDs (WR)
   - DO NOT include rebounds or assists

3. RECENT GAMES (last 5-10 with ACTUAL data):
   - Exact date (MM/DD/YYYY)
   - Opponent
   - Sport-specific stats
   - Performance rating

4. INJURY STATUS:
   - Search "[player name] injury report ${new Date().toLocaleDateString()}"
   - Status: Healthy/Day-to-Day/Out/Questionable

5. NEXT GAME PREDICTION (NEW - REQUIRED):
   - Opponent
   - Date
   - Predicted Performance (sport-specific numbers):
     * Basketball: "32 PTS, 9 REB, 7 AST" 
     * Soccer: "2 goals, 1 assist, 5 shots"
     * Football: "285 passing yards, 2 TDs"
   - Confidence: High/Medium/Low
   - Reasoning: Why these numbers based on:
     * Opponent's defensive stats
     * Player's history vs this opponent
     * Recent form trend
     * Home/away advantage

6. BETTING INSIGHTS:
   - Over/Under line (sport-appropriate)
   - Probability to score/perform
   - Hot streak: true if last 3 games > season average

7. ANALYSIS:
   - Strengths (3-5 statistical strengths)
   - Weaknesses (2-3 areas for improvement)

VALIDATION:
- Stats MUST match the sport
- No mixing sports stats
- Predictions MUST be specific numbers
- All from ${new Date().getFullYear()} season

Return valid JSON with sport-appropriate stats only.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            league: { type: "string" },
            season_averages: {
              type: "object",
              properties: {
                points_per_game: { type: "number" },
                assists_per_game: { type: "number" },
                rebounds_per_game: { type: "number" },
                steals_per_game: { type: "number" },
                blocks_per_game: { type: "number" },
                field_goal_percentage: { type: "number" },
                three_point_percentage: { type: "number" },
                free_throw_percentage: { type: "number" },
                goals_per_game: { type: "number" },
                shots_per_game: { type: "number" },
                passes_per_game: { type: "number" },
                tackles_per_game: { type: "number" },
                passing_yards_per_game: { type: "number" },
                rushing_yards_per_game: { type: "number" },
                receptions_per_game: { type: "number" },
                minutes_per_game: { type: "number" }
              }
            },
            recent_form: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  opponent: { type: "string" },
                  points: { type: "number" },
                  assists: { type: "number" },
                  rebounds: { type: "number" },
                  goals: { type: "number" },
                  passing_yards: { type: "number" },
                  rushing_yards: { type: "number" },
                  performance_rating: { type: "string" }
                }
              }
            },
            injury_status: { type: "string" },
            next_game: {
              type: "object",
              properties: {
                opponent: { type: "string" },
                date: { type: "string" },
                location: { type: "string" },
                predicted_performance: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              },
              required: ["opponent", "predicted_performance", "confidence", "reasoning"]
            },
            career_highlights: {
              type: "array",
              items: { type: "string" }
            },
            betting_insights: {
              type: "object",
              properties: {
                over_under_points: { type: "number" },
                probability_to_score: { type: "number" },
                hot_streak: { type: "boolean" },
                consistency_rating: { type: "string" }
              }
            },
            strengths: {
              type: "array",
              items: { type: "string" }
            },
            weaknesses: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["player_name", "sport", "team", "next_game"]
        }
      });

      console.log("✅ Player Stats Result:", result);

      if (!result || !result.player_name || !result.sport || !result.team || !result.next_game) {
        throw new Error("Invalid response - missing required player data, including next_game prediction.");
      }

      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
    } catch (err) {
      console.error("❌ Player Stats Error:", err);
      setError("Failed to fetch player statistics. Please try using the player's full name and current team.");
    }

    setIsSearching(false);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertDescription>
            Failed to load player statistics. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <User className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold">Player Statistics</h1>
          </div>
          <p className="text-purple-100 text-lg max-w-2xl">
            Get comprehensive player stats including averages, recent form, betting insights, and next game predictions
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 whitespace-pre-line">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-gray-600 justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Fetching player statistics...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds</p>
            </div>
          </div>
        ) : (
          <>
            {players.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Analyzed Players ({players.length})
                  </h2>
                </div>
                <div className="space-y-6">
                  {players.map((player, index) => (
                    <PlayerStatsDisplay
                      key={player.id}
                      player={player}
                      onDelete={deleteMutation.mutate}
                      index={index}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyPlayerState />
            )}
          </>
        )}
      </div>
    </div>
  );
}
