import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import EmptyPlayerState from "../components/player/EmptyPlayerState";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";

export default function PlayerStats() {
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
      const currentYear = new Date().getFullYear();
      const season = `${currentYear}-${currentYear + 1}`;
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are analyzing player statistics. Search the internet for current data on this player: "${query}"

TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

STEP 1: IDENTIFY THE PLAYER
Search Google for: "${query} basketball" OR "${query} football" OR "${query} soccer"
- Get the player's FULL NAME
- Get their CURRENT TEAM (2024-25 season)
- Get their SPORT (Basketball, Football, Soccer, etc.)

STEP 2: GET SEASON STATS
For Basketball players, search: "[player name] stats 2024-25 season basketball reference"
For Football players, search: "[player name] stats 2024 season pro football reference"
For Soccer players, search: "[player name] stats 2024 fbref"

Get these CURRENT SEASON averages:
- Basketball: Points, Rebounds, Assists per game
- Football: Passing/Rushing/Receiving yards per game
- Soccer: Goals, Assists per 90 minutes

STEP 3: GET RECENT GAMES
Search: "[player name] game log 2024"
Get last 5 games with:
- Date (MM/DD/YYYY)
- Opponent
- Stats (points/yards/goals from that game)

STEP 4: CHECK INJURY STATUS
Search: "[player name] injury report today"
Status options: "Healthy", "Questionable", "Out", "Day-to-Day"

STEP 5: FIND NEXT GAME
Search: "[team name] schedule"
Get:
- Next opponent
- Game date and time
- Home or Away

STEP 6: PREDICT NEXT GAME PERFORMANCE
Based on:
- Season averages
- Recent form (last 5 games)
- Opponent's defense vs that position

Predict specific stats like:
- Basketball: "28 PTS, 7 REB, 6 AST"
- Football: "285 passing yards, 2 TDs"
- Soccer: "1 goal, 1 assist"

CRITICAL: Use actual internet search results. Don't make up stats.

If you CANNOT find the player:
- Set predicted_performance to: "Player not found. Try: 'LeBron James Lakers' or 'Stephen Curry Warriors'"
- Set all stats to null or 0
- Set injury_status.status to "Unknown"

Return complete JSON with verified data.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            league: { type: "string" },
            jersey_number: { type: ["string", "null"] },
            season_averages: {
              type: "object",
              properties: {
                points_per_game: { type: ["number", "null"] },
                assists_per_game: { type: ["number", "null"] },
                rebounds_per_game: { type: ["number", "null"] },
                steals_per_game: { type: ["number", "null"] },
                blocks_per_game: { type: ["number", "null"] },
                field_goal_percentage: { type: ["number", "null"] },
                three_point_percentage: { type: ["number", "null"] },
                free_throw_percentage: { type: ["number", "null"] },
                goals_per_game: { type: ["number", "null"] },
                shots_per_game: { type: ["number", "null"] },
                passes_per_game: { type: ["number", "null"] },
                tackles_per_game: { type: ["number", "null"] },
                passing_yards_per_game: { type: ["number", "null"] },
                rushing_yards_per_game: { type: ["number", "null"] },
                receptions_per_game: { type: ["number", "null"] },
                minutes_per_game: { type: ["number", "null"] }
              }
            },
            recent_form: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  opponent: { type: "string" },
                  points: { type: ["number", "null"] },
                  assists: { type: ["number", "null"] },
                  rebounds: { type: ["number", "null"] },
                  goals: { type: ["number", "null"] },
                  passing_yards: { type: ["number", "null"] },
                  rushing_yards: { type: ["number", "null"] },
                  performance_rating: { type: ["string", "null"] }
                },
                required: ["date", "opponent"]
              }
            },
            injury_status: {
              type: "object",
              properties: {
                status: { type: "string" },
                specific_injury: { type: ["string", "null"] },
                games_missed: { type: ["number", "null"] },
                expected_return: { type: ["string", "null"] }
              },
              required: ["status"]
            },
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
              required: ["opponent", "date", "location", "predicted_performance", "confidence", "reasoning"]
            },
            career_highlights: {
              type: "array",
              items: { type: "string" }
            },
            betting_insights: {
              type: "object",
              properties: {
                over_under_points: { type: ["number", "null"] },
                probability_to_score: { type: ["number", "null"] },
                hot_streak: { type: ["boolean", "null"] },
                consistency_rating: { type: ["string", "null"] }
              }
            },
            strengths: {
              type: "array",
              items: { type: "string" }
            },
            weaknesses: {
              type: "array",
              items: { type: "string" }
            },
            data_sources: {
              type: "object",
              properties: {
                stats_source: { type: ["string", "null"] },
                injury_source: { type: ["string", "null"] },
                schedule_source: { type: ["string", "null"] }
              }
            }
          },
          required: ["player_name", "sport", "team", "position", "league", "injury_status", "next_game", "career_highlights", "betting_insights", "strengths", "weaknesses"]
        }
      });

      console.log("✅ Player Stats Result:", result);

      // Check if the AI couldn't find the player
      if (result?.next_game?.predicted_performance?.toLowerCase().includes("player not found") || 
          result?.next_game?.predicted_performance?.toLowerCase().includes("unable to find")) {
        throw new Error(`❌ Could not find stats for "${query}". 

Try searching with:
• Full name + team: "LeBron James Lakers"
• Full name + sport: "Stephen Curry basketball"
• With current team: "Patrick Mahomes Chiefs"

Make sure:
✓ Player name is spelled correctly
✓ Player is currently active (2024-25 season)
✓ Include team name for better results`);
      }

      if (!result || !result.player_name || !result.sport || !result.team || !result.next_game) {
        throw new Error(`❌ Incomplete data returned for "${query}". 

Please try searching with more details:
• Add team name: "${query} Lakers" 
• Add sport: "${query} NBA"
• Use full name: "LeBron Raymone James"`);
      }

      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
    } catch (err) {
      console.error("❌ Player Stats Error:", err);
      
      // User-friendly error messages
      if (err.message.includes("Could not find stats")) {
        setError(err.message);
      } else if (err.message.includes("Incomplete data")) {
        setError(err.message);
      } else {
        setError(`❌ Failed to fetch player statistics for "${query}". 

💡 TIPS FOR BETTER RESULTS:
• Use full name: "LeBron James" not "Lebron"
• Add team: "Stephen Curry Warriors"  
• Add sport: "Cristiano Ronaldo soccer"

✅ EXAMPLES THAT WORK:
• "LeBron James"
• "Stephen Curry Warriors"
• "Patrick Mahomes Chiefs"
• "Kevin Durant"
• "Lionel Messi Inter Miami"

⚠️ COMMON ISSUES:
• Player recently traded? Use NEW team name
• Retired player? Only current players work
• Typo in name? Double-check spelling`);
      }
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
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
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
          <Alert className="mb-6 bg-yellow-50 border-yellow-300">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800 whitespace-pre-line ml-2">
              {error}
            </AlertDescription>
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
                <span className="font-medium">Searching internet for player statistics...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">This may take 10-20 seconds</p>
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