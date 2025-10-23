
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

CRITICAL: You have internet access. You MUST search these sources:
1. StatMuse.com - Primary source for all statistics
2. Pro-Football-Reference.com (for NFL players)
3. Basketball-Reference.com (for NBA players)
4. ESPN.com player pages
5. Official league websites (NBA.com, NFL.com, etc.)
6. Team official websites for injury reports

STEP-BY-STEP PROCESS:
1. Identify the player's sport FIRST (Basketball/Football/Soccer)
2. Search StatMuse for "${query} stats ${new Date().getFullYear()}"
3. Get season averages from StatMuse or official reference sites
4. Get last 5-10 game logs with specific dates and stats
5. Check official injury report for current status
6. Find next scheduled game for player's team

REQUIRED DATA TO EXTRACT:

1. PLAYER INFO (verify from official team roster):
   - Full legal name
   - Current team (verify from team website)
   - Position
   - Sport and league

2. SEASON AVERAGES - SPORT-SPECIFIC (from StatMuse ${new Date().getFullYear()} season):
   
   For FOOTBALL/NFL:
   - IF QUARTERBACK: Passing Yards/Game, Pass TDs/Game, INTs/Game, Completion %, QB Rating
   - IF RUNNING BACK: Rushing Yards/Game, Rush TDs/Game, Carries/Game, Yards/Carry, Receptions/Game, Receiving Yards/Game
   - IF WIDE RECEIVER/TIGHT END: Receptions/Game, Receiving Yards/Game, Rec TDs/Game, Targets/Game, Yards/Reception
   
   For BASKETBALL/NBA:
   - Points/Game, Assists/Game, Rebounds/Game, FG%, 3P%, FT%, Steals/Game, Blocks/Game, Minutes/Game
   
   For SOCCER:
   - Goals/90min, Assists/90min, Shots/Game, Passes/Game, Tackles/Game, Pass Accuracy%

3. RECENT GAMES (last 5-10 games with ACTUAL data from game logs):
   For EACH game provide:
   - Exact date (MM/DD/YYYY)
   - Opponent team name
   - Player's actual stats (sport-specific):
     * Football QB: Passing yards, TDs, INTs
     * Football RB: Rushing yards, TDs, Receptions, Rec yards
     * Football WR/TE: Receptions, Rec yards, TDs
     * Basketball: Points, Rebounds, Assists
     * Soccer: Goals, Assists, Shots
   - Performance rating: "Excellent" (>season avg), "Good" (near avg), "Below" (<avg)

4. INJURY STATUS (check TODAY'S injury report):
   - Search "[player name] injury report [today's date]"
   - Status: "Healthy", "Day-to-Day", "Out", "Questionable", "Probable"
   - If injured, specify injury and timeline

5. NEXT GAME (search team schedule):
   - Opponent
   - Date and time
   - Home or away
   - Predicted performance based on season average ± 20%

6. BETTING INSIGHTS (sport-specific):
   For Football:
   - Over/Under passing/rushing/receiving yards
   - Probability to score TD
   - Anytime TD scorer odds
   
   For Basketball:
   - Over/Under points
   - Probability to score (games with points %)
   - PTS+REB+AST combined line
   
   For Soccer:
   - Anytime goal scorer probability
   - Shots on target over/under

7. ANALYSIS:
   - Strengths: 3-5 statistical strengths (sport-specific)
   - Weaknesses: 2-3 areas (sport-specific)
   - Career highlights: Major awards, records, achievements

VALIDATION:
- All stats must be from ${new Date().getFullYear()} season
- Recent games must have actual dates and scores
- Stats must match the player's position and sport
- If player is injured/not playing, reflect in injury_status
- If you can't find the player, say so in the response

FORMAT: Return valid JSON with ALL fields populated. Use sport-appropriate stat fields.`,
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
                minutes_per_game: { type: "number" },
                passing_yards_per_game: { type: "number" },
                passing_touchdowns_per_game: { type: "number" },
                interceptions_per_game: { type: "number" },
                completion_percentage: { type: "number" },
                rushing_yards_per_game: { type: "number" },
                rushing_touchdowns_per_game: { type: "number" },
                carries_per_game: { type: "number" },
                receiving_yards_per_game: { type: "number" },
                receiving_touchdowns_per_game: { type: "number" },
                receptions_per_game: { type: "number" },
                targets_per_game: { type: "number" },
                yards_per_carry: { type: "number" },
                yards_per_reception: { type: "number" }
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
                  passing_touchdowns: { type: "number" },
                  interceptions: { type: "number" },
                  rushing_yards: { type: "number" },
                  rushing_touchdowns: { type: "number" },
                  receiving_yards: { type: "number" },
                  receiving_touchdowns: { type: "number" },
                  receptions: { type: "number" },
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
                predicted_performance: { type: "string" }
              }
            },
            career_highlights: {
              type: "array",
              items: { type: "string" }
            },
            betting_insights: {
              type: "object",
              properties: {
                over_under_points: { type: "number" },
                over_under_yards: { type: "number" },
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
          required: ["player_name", "sport", "team"]
        }
      });

      console.log("✅ Player Stats Result:", result);

      if (!result || !result.player_name || !result.sport || !result.team) {
        throw new Error("Invalid response - missing required player data");
      }

      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
    } catch (err) {
      console.error("❌ Player Stats Error:", err);
      let errorMessage = "Failed to fetch player statistics. ";
      
      if (err.message?.includes("Invalid response")) {
        errorMessage += "Couldn't find that player. Try:\n• Using the player's full name (e.g., 'Patrick Mahomes')\n• Including the sport (e.g., 'Christian McCaffrey NFL')\n• Checking the spelling";
      } else {
        errorMessage += "Please try:\n• Full name (e.g., 'Josh Allen NFL')\n• Adding sport/league (e.g., 'Tyreek Hill NFL')\n• Current active players only";
      }
      
      setError(errorMessage);
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
