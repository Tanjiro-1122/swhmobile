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
CURRENT SEASON: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}

CRITICAL: You have internet access. You MUST search these sources IN THIS ORDER:
1. StatMuse.com - Search "${query} stats ${new Date().getFullYear()}" - PRIMARY SOURCE
2. Pro-Football-Reference.com (for NFL players)
3. Basketball-Reference.com (for NBA players)
4. ESPN.com player pages
5. Official league websites (NBA.com, NFL.com, etc.)
6. Team official websites for injury reports

STEP-BY-STEP PROCESS:
1. Identify the player's sport FIRST (Basketball/Football/Soccer)
2. Verify player exists: Search StatMuse for "${query} ${new Date().getFullYear()}"
3. Get current team from official roster
4. Get season averages from StatMuse (MUST be ${new Date().getFullYear()} season data)
5. Get last 5-10 game logs with ACTUAL dates and stats
6. Check TODAY'S injury report: Search "[player name] injury report ${new Date().toLocaleDateString()}"
7. Find next scheduled game from team schedule

REQUIRED DATA TO EXTRACT:

1. PLAYER INFO (verify from official team roster):
   - Full legal name (from official source)
   - Current team (verify from team website - e.g. "Golden State Warriors" not "Warriors")
   - Position (official position from roster)
   - Sport and league

2. SEASON AVERAGES - MUST BE SPORT-SPECIFIC FROM ${new Date().getFullYear()} SEASON:
   
   FOR NFL/FOOTBALL QUARTERBACKS:
   - passing_yards_per_game: (from StatMuse or Pro-Football-Reference)
   - passing_touchdowns_per_game: (actual number, e.g., 1.5)
   - interceptions_per_game: (actual number)
   - completion_percentage: (as percentage, e.g., 67.5)
   - rushing_yards_per_game: (QB rushing yards if applicable)
   
   FOR NFL/FOOTBALL RUNNING BACKS:
   - rushing_yards_per_game: (PRIMARY STAT)
   - rushing_touchdowns_per_game: 
   - carries_per_game: 
   - yards_per_carry: (calculated: total rush yards / total carries)
   - receptions_per_game: (receiving stats)
   - receiving_yards_per_game:
   - receiving_touchdowns_per_game:
   
   FOR NFL/FOOTBALL WR/TE:
   - receptions_per_game: (PRIMARY STAT)
   - receiving_yards_per_game:
   - receiving_touchdowns_per_game:
   - targets_per_game:
   - yards_per_reception: (calculated: total rec yards / total receptions)
   
   FOR NBA/BASKETBALL:
   - points_per_game: (from StatMuse or Basketball-Reference)
   - assists_per_game:
   - rebounds_per_game:
   - steals_per_game:
   - blocks_per_game:
   - field_goal_percentage: (as percentage)
   - three_point_percentage: (as percentage)
   - free_throw_percentage: (as percentage)
   - minutes_per_game:
   
   FOR SOCCER:
   - goals_per_game:
   - assists_per_game:
   - shots_per_game:
   - passes_per_game:
   - tackles_per_game:
   - minutes_per_game:

3. RECENT GAMES (last 5-10 games from game logs - MUST BE REAL DATA):
   For EACH game provide ACTUAL stats from that specific game:
   
   Football (search game logs on Pro-Football-Reference):
   - date: "MM/DD/YYYY" format
   - opponent: Full team name
   - passing_yards: (for QBs) ACTUAL yards from that game
   - passing_touchdowns: ACTUAL TDs from that game
   - interceptions: ACTUAL INTs from that game
   - rushing_yards: (for RBs/QBs) ACTUAL yards
   - rushing_touchdowns: ACTUAL TDs
   - receiving_yards: (for WRs/TEs/RBs) ACTUAL yards
   - receiving_touchdowns: ACTUAL TDs
   - receptions: ACTUAL catches
   - performance_rating: "Excellent" if above season avg, "Good" if near avg, "Below" if under avg
   
   Basketball (search game logs on Basketball-Reference):
   - date: "MM/DD/YYYY"
   - opponent: Full team name
   - points: ACTUAL points scored
   - rebounds: ACTUAL rebounds
   - assists: ACTUAL assists
   - performance_rating: Based on comparison to season averages

4. INJURY STATUS (check TODAY'S injury report ${new Date().toLocaleDateString()}):
   - Search "[player name] [team name] injury report"
   - Status: "Healthy", "Day-to-Day", "Out", "Questionable", "Probable", "IR"
   - If injured, specify injury type and expected return

5. NEXT GAME (from team schedule):
   - Opponent: Full official team name
   - Date and time (with timezone)
   - Home or away
   - Predicted performance: Based on season average ±20%, considering matchup and injury status

6. BETTING INSIGHTS (SPORT-SPECIFIC):
   Football:
   - over_under_yards: (passing for QB, rushing for RB, receiving for WR/TE)
   - probability_to_score: (probability of scoring a TD, as percentage 0-100)
   
   Basketball:
   - over_under_points: (points line)
   - probability_to_score: (games with at least 1 point as percentage)
   
   hot_streak: true if last 3 games above season average
   consistency_rating: "High", "Medium", or "Low" based on game-to-game variance

7. ANALYSIS:
   - Strengths: 3-5 statistical strengths with NUMBERS (e.g., "Averaging 285 passing yards/game, 3rd in NFL")
   - Weaknesses: 2-3 areas with NUMBERS (e.g., "Only 2 rushing TDs this season")
   - Career highlights: Awards, records, Pro Bowls, All-Star selections

VALIDATION - REJECT RESPONSE IF:
- Stats are not from ${new Date().getFullYear()} season
- Recent games don't have actual dates
- Season averages are 0 or null for key stats
- Player name misspelled or wrong team
- Using placeholder/generic data

CRITICAL: All statistics MUST be from current ${new Date().getFullYear()} season. Search StatMuse FIRST.

FORMAT: Return valid JSON with ALL sport-appropriate fields populated using REAL data from the web.`,
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
                <span className="font-medium">Fetching live player statistics...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Searching StatMuse, ESPN & official sources</p>
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