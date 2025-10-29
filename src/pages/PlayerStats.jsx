import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Trophy } from "lucide-react";
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

  const { data: players, isLoading } = useQuery({
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
        prompt: `You are a professional sports analyst with REAL-TIME INTERNET ACCESS. You MUST fetch LIVE, CURRENT data from StatMuse.com, ESPN, and official league websites.

SEARCH QUERY: "${query}"
TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT SEASON: ${new Date().getFullYear()} (or ${new Date().getFullYear()}-${new Date().getFullYear() + 1} for NBA/NHL)

STEP 1: IDENTIFY THE PLAYER
Search: "${query} stats ${new Date().getFullYear()}" on StatMuse.com
- Get player's full name, team, position, sport, and league
- Verify they are currently active

STEP 2: GET SEASON AVERAGES (sport-specific)

FOR BASKETBALL (NBA/NCAAB):
Search: "[player name] stats ${new Date().getFullYear()}" on StatMuse or Basketball-Reference
- Points per game (PPG)
- Rebounds per game (RPG)
- Assists per game (APG)
- Steals per game
- Blocks per game
- Field goal % (FG%)
- Three-point % (3P%)
- Free throw % (FT%)
- Minutes per game

FOR BASEBALL (MLB):
FOR BATTERS:
Search: "[player name] batting stats ${new Date().getFullYear()}" on StatMuse or Baseball-Reference
- Batting Average (AVG)
- Home Runs (HR)
- Runs Batted In (RBI)
- Stolen Bases (SB)
- Hits per game
- On-base percentage (OBP)
- Slugging percentage (SLG)

FOR PITCHERS:
Search: "[player name] pitching stats ${new Date().getFullYear()}" on StatMuse or Baseball-Reference
- Earned Run Average (ERA)
- Strikeouts (K)
- Wins (W)
- Saves (SV)
- Innings pitched per game
- WHIP (Walks + Hits per Inning Pitched)

FOR SOCCER/FOOTBALL:
Search: "[player name] stats ${new Date().getFullYear()}" on FBref.com or WhoScored
- Goals per 90 minutes
- Assists per 90 minutes
- Shots per game
- Pass completion %
- Tackles per game
- Key passes per game

FOR AMERICAN FOOTBALL (NFL):
FOR QUARTERBACKS:
Search: "[player name] QB stats ${new Date().getFullYear()}" on Pro-Football-Reference
- Passing yards per game
- Touchdowns (TDs)
- Interceptions (INTs)
- Completion percentage
- QB rating
- Rushing yards per game

FOR RUNNING BACKS:
- Rushing yards per game
- Yards per carry (YPC)
- Rushing touchdowns
- Receptions per game
- Receiving yards

FOR WIDE RECEIVERS/TIGHT ENDS:
- Receptions per game
- Receiving yards per game
- Receiving touchdowns
- Yards after catch
- Catch percentage

STEP 3: RECENT FORM (Last 5 games)
Search: "[player name] game log ${new Date().getFullYear()}" on StatMuse
Get actual stats from the last 5 games with:
- Date
- Opponent
- Key stats (sport-specific from above)
- Performance rating (Excellent/Good/Average/Poor)

STEP 4: NEXT GAME PREDICTION
Search: "[team name] schedule" on ESPN
- Find next scheduled game (opponent, date, location)
- PREDICT SPECIFIC STATS for that game based on:
  * Player's season averages
  * Last 5 games performance trend
  * Historical performance against this opponent
  * Current form (hot/cold streak)

BASKETBALL PREDICTION FORMAT:
"28 PTS, 7 REB, 5 AST" (specific numbers)

BASEBALL BATTER PREDICTION:
"2 hits, 1 HR, 3 RBI, .300 AVG for the game"

BASEBALL PITCHER PREDICTION:
"6 IP, 7 K, 2 ER, 1.00 ERA for the game"

SOCCER PREDICTION:
"1 goal, 1 assist, 4 shots on target"

NFL QB PREDICTION:
"285 passing yards, 2 TDs, 1 INT, 25 rushing yards"

STEP 5: BETTING INSIGHTS
- Over/Under line for relevant stat (e.g., points for NBA, home runs for MLB)
- Probability to score/perform well (0-100%)
- Is player on a hot streak? (boolean)
- Consistency rating: "Very Consistent", "Moderately Consistent", or "Inconsistent"

STEP 6: INJURY STATUS
Search: "[player name] injury report" or "[team name] injury report today"
- Current injury status: "Healthy", "Questionable", "Out", "Day-to-Day"
- If injured, specify the injury

CRITICAL RULES:
✓ Use ONLY stats from the CURRENT ${new Date().getFullYear()} season
✓ DO NOT mix sport stats (no "rebounds" for baseball, no "home runs" for basketball)
✓ Predictions must be SPECIFIC NUMBERS, not ranges
✓ All stats must be from StatMuse, ESPN, or official league sources
✓ Recent form must show ACTUAL game results, not estimates

If player not found, return an error in the reasoning field of next_game.

Return complete JSON with ALL fields populated using VERIFIED LIVE DATA.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            role: { type: "string" },
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
                minutes_per_game: { type: "number" },
                goals_per_game: { type: "number" },
                shots_per_game: { type: "number" },
                passes_per_game: { type: "number" },
                tackles_per_game: { type: "number" },
                passing_yards_per_game: { type: "number" },
                rushing_yards_per_game: { type: "number" },
                receptions_per_game: { type: "number" },
                batting_average: { type: "number" },
                home_runs: { type: "number" },
                rbis: { type: "number" },
                stolen_bases: { type: "number" },
                era: { type: "number" },
                strikeouts: { type: "number" },
                wins: { type: "number" },
                saves: { type: "number" }
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
                  hits: { type: "number" },
                  home_runs: { type: "number" },
                  rbis: { type: "number" },
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

      if (!result || !result.player_name || !result.next_game) {
        throw new Error("Invalid response - player not found or missing data");
      }

      if (result.next_game?.reasoning?.includes("not found") || result.next_game?.reasoning?.includes("Unable to find")) {
        throw new Error("Player not found - please check spelling and try again");
      }

      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
    } catch (err) {
      console.error("Player analysis error:", err);
      setError("Failed to analyze player. Please try again with full name or different spelling.");
    }

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Player Stats & Predictions</h1>
              <p className="text-gray-600">Analyze any player's performance and get AI-powered predictions</p>
            </div>
          </div>
        </div>

        <Card className="p-6 mb-8 border-2 border-purple-200 bg-white shadow-lg">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSearching && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20 animate-ping" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-75 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-purple-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Player Data</h3>
              <p className="text-gray-600">Fetching stats from StatMuse & ESPN...</p>
            </div>
          </div>
        )}

        {!isSearching && (
          <>
            {players && players.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-6">
                {players.map((player) => (
                  <PlayerStatsDisplay
                    key={player.id}
                    player={player}
                    onDelete={deleteMutation.mutate}
                  />
                ))}
              </div>
            ) : (
              <EmptyPlayerState />
            )}
          </>
        )}
      </div>
    </div>
  );
}