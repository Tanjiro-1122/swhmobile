
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
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const currentDateString = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports statistics analyst with REAL-TIME INTERNET ACCESS. Fetch LIVE, VERIFIED data ONLY.

MANDATORY DATA SOURCES - USE THESE IN ORDER:
1. StatMuse.com - PRIMARY source for all player statistics
2. Basketball-Reference.com (NBA/NCAAB)
3. Pro-Football-Reference.com (NFL)
4. FBref.com (Soccer/Football)
5. ESPN.com player pages
6. Official team websites for injury reports
7. WhoScored.com (Soccer)

PLAYER SEARCH: "${query}"
TODAY: ${currentDateString}
CURRENT SEASON: ${currentYear}-${nextYear} (Basketball/Hockey)
CURRENT SEASON: ${currentYear} (Soccer/Football/Baseball)

STEP-BY-STEP VERIFICATION PROCESS:
1. Search StatMuse: "${query} stats ${currentYear}"
2. Identify sport, team, position
3. Get CURRENT season averages (verify it's ${currentYear} season)
4. Pull last 10 game logs with EXACT dates and stats
5. Check official injury report: "[player name] injury" or "[team] injury report"
6. Find next scheduled game: "[team name] schedule"
7. Research opponent's defensive stats against player's position

REQUIRED DATA - ALL FIELDS MUST BE FILLED:

1. PLAYER IDENTIFICATION (from official roster):
   - Full official name (first + last)
   - Current team (official team name)
   - Position (PG, SG, SF, PF, C for basketball; QB, RB, WR, etc for football)
   - Sport (Basketball/Soccer/Football/Baseball/Hockey)
   - League (NBA, NFL, Premier League, La Liga, etc.)
   - Jersey number (if available)

2. CURRENT SEASON AVERAGES - SPORT-SPECIFIC ONLY:
   
   FOR BASKETBALL (NBA, NCAAB):
   Search: "${query} ${currentYear} stats" on Basketball-Reference
   - Points Per Game (PPG): current season average
   - Rebounds Per Game (RPG): total rebounds
   - Assists Per Game (APG)
   - Steals Per Game (SPG)
   - Blocks Per Game (BPG)
   - Field Goal % (FG%)
   - Three-Point % (3P%)
   - Free Throw % (FT%)
   - Minutes Per Game (MPG)
   
   DO NOT INCLUDE: goals, shots per game, passes
   
   FOR SOCCER/FOOTBALL:
   Search: "${query} ${currentYear} stats" on FBref.com
   - Goals per 90 minutes
   - Assists per 90 minutes
   - Shots per game
   - Shot accuracy %
   - Passes per game
   - Pass completion %
   - Tackles per game
   - Dribbles completed per game
   
   DO NOT INCLUDE: rebounds, field goal %, three-pointers
   
   FOR AMERICAN FOOTBALL (NFL):
   Search: "${query} ${currentYear} stats" on Pro-Football-Reference
   - Passing Yards Per Game (if QB)
   - Completion % (if QB)
   - Touchdowns (passing/rushing/receiving)
   - Interceptions (if QB)
   - Rushing Yards Per Game (if RB/QB)
   - Yards Per Carry (if RB)
   - Receptions Per Game (if WR/TE/RB)
   - Receiving Yards Per Game (if WR/TE)
   
   DO NOT INCLUDE: rebounds, assists, three-pointers, goals

3. RECENT FORM - LAST 10 GAMES (with EXACT data):
   Search: "${query} game log ${currentYear}" on Basketball-Reference or equivalent
   
   For EACH of last 5-10 games provide:
   - Exact date (MM/DD/YYYY format)
   - Opponent (full team name)
   - SPORT-SPECIFIC stats from that specific game:
     * Basketball: Points, Rebounds, Assists, FG made/attempted
     * Soccer: Goals, Assists, Shots, Minutes played
     * Football: Passing/Rushing/Receiving yards, TDs
   - Performance rating: "Excellent" (above season avg), "Good" (near avg), "Below Average" (below avg)
   
   Calculate trend: "Trending up" if last 3 > season avg, "Trending down" if last 3 < season avg

4. INJURY STATUS (from official source):
   Search: "${query} injury report" OR "[team name] injury report ${new Date().toLocaleDateString()}"
   - Status: "Healthy", "Questionable", "Doubtful", "Out", "Day-to-Day"
   - If injured: specific injury ("left ankle sprain", "hamstring strain")
   - Games missed: number of games
   - Expected return: date or "unknown"

5. NEXT GAME PREDICTION (CRITICAL - REQUIRED):
   Search: "[team name] schedule" to find NEXT game
   
   - Opponent: "[Team Name]" (exact official name)
   - Date: "MM/DD/YYYY HH:MM" (exact from schedule)
   - Location: "Home" or "Away" or "Neutral"
   
   - Predicted Performance (MUST be specific numbers for the sport):
     * Basketball: "32 PTS, 9 REB, 7 AST, 2 STL" (specific stat line)
     * Soccer: "2 goals, 1 assist, 6 shots, 4 shots on target"
     * Football (QB): "285 passing yards, 2 passing TDs, 1 INT, 45 rushing yards"
     * Football (RB): "95 rushing yards, 1 rushing TD, 3 receptions, 25 receiving yards"
     * Football (WR): "7 receptions, 95 receiving yards, 1 TD"
   
   - Confidence: "High" (player hot, favorable matchup), "Medium" (neutral), "Low" (cold streak or tough matchup)
   
   - Reasoning (3-4 detailed sentences with STATS):
     Example for basketball: "LeBron averaging 32 PPG over last 5 games (career-high pace). Opponent allows 28 PPG to opposing small forwards (ranked 25th in league). Lakers playing at home where LeBron averages 4 more PPG than road games. Last time vs this opponent (2 weeks ago), LeBron had 35 PTS, 10 REB, 8 AST."
     
     Base prediction on:
     * Player's recent form (last 5-10 games)
     * Opponent's defensive stats vs player's position
     * Home vs Away splits
     * Head-to-head history vs this opponent
     * Any relevant injuries or rest

6. BETTING INSIGHTS (for betting context):
   - Over/Under Line: prop bet line if available (e.g., "28.5 points")
   - Probability to Score/Perform: % chance based on season data
   - Hot Streak: true/false (true if last 3 games > season average)
   - Consistency Rating: "Very Consistent", "Consistent", "Inconsistent", "Very Inconsistent"
   - Best Bet: "Over on points" or "Under on rebounds" etc

7. CAREER HIGHLIGHTS (recent achievements):
   - All-Star selections
   - Awards (MVP, Rookie of Year, etc.)
   - Career high stats
   - Notable records

8. STRENGTHS (3-5 statistical strengths):
   Example: "Elite three-point shooter (42% from 3, top 5 in league)"
   Example: "Exceptional passer with 9 APG (league leader)"

9. WEAKNESSES (2-3 areas for improvement):
   Example: "Free throw shooting needs work (68%, below league avg)"
   Example: "Turnover prone (3.5 TO per game)"

VALIDATION - VERIFY BEFORE RETURNING:
✓ All season averages are from ${currentYear} season
✓ Stats match the player's sport (no mixing)
✓ Recent games have actual dates and scores
✓ Next game exists on official schedule
✓ Prediction is specific numbers, not ranges
✓ Injury status is current (within 24 hours)
✓ All percentages and averages are realistic

FAILURE CONDITIONS:
If player not found OR stats unavailable:
- Set predicted_performance to "Unable to find current stats for [player name]. Try using player's full name and current team."
- Still populate other fields with "N/A" or null as appropriate

CRITICAL: Return only stats that match the sport. Basketball players should NEVER have "goals per game" or "tackles". Soccer players should NEVER have "rebounds" or "three-point percentage".

Return complete JSON with ALL fields using LIVE VERIFIED DATA from ${currentYear} season.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            league: { type: "string" },
            jersey_number: { type: "string", nullable: true }, // Added nullable as it might not always be available
            season_averages: {
              type: "object",
              properties: {
                points_per_game: { type: "number", nullable: true },
                assists_per_game: { type: "number", nullable: true },
                rebounds_per_game: { type: "number", nullable: true },
                steals_per_game: { type: "number", nullable: true },
                blocks_per_game: { type: "number", nullable: true },
                field_goal_percentage: { type: "number", nullable: true },
                three_point_percentage: { type: "number", nullable: true },
                free_throw_percentage: { type: "number", nullable: true },
                goals_per_game: { type: "number", nullable: true },
                shots_per_game: { type: "number", nullable: true },
                passes_per_game: { type: "number", nullable: true },
                tackles_per_game: { type: "number", nullable: true },
                passing_yards_per_game: { type: "number", nullable: true },
                rushing_yards_per_game: { type: "number", nullable: true },
                receptions_per_game: { type: "number", nullable: true },
                minutes_per_game: { type: "number", nullable: true }
              }
            },
            recent_form: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  opponent: { type: "string" },
                  points: { type: "number", nullable: true },
                  assists: { type: "number", nullable: true },
                  rebounds: { type: "number", nullable: true },
                  goals: { type: "number", nullable: true },
                  passing_yards: { type: "number", nullable: true },
                  rushing_yards: { type: "number", nullable: true },
                  performance_rating: { type: "string", nullable: true }
                },
                required: ["date", "opponent"] // Date and opponent should always be available for a game.
              }
            },
            injury_status: {
              type: "object",
              properties: {
                status: { type: "string" }, // Healthy, Questionable, Doubtful, Out, Day-to-Day
                specific_injury: { type: "string", nullable: true },
                games_missed: { type: "number", nullable: true },
                expected_return: { type: "string", nullable: true } // "MM/DD/YYYY" or "unknown"
              },
              required: ["status"]
            },
            next_game: {
              type: "object",
              properties: {
                opponent: { type: "string" },
                date: { type: "string" }, // MM/DD/YYYY HH:MM
                location: { type: "string" }, // Home, Away, Neutral
                predicted_performance: { type: "string" },
                confidence: { type: "string" }, // High, Medium, Low
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
                over_under_line: { type: "string", nullable: true }, // Changed to string for flexibility (e.g., "28.5 points")
                probability_to_score: { type: "number", nullable: true },
                hot_streak: { type: "boolean", nullable: true },
                consistency_rating: { type: "string", nullable: true },
                best_bet: { type: "string", nullable: true }
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
                stats_source: { type: "string", nullable: true },
                injury_source: { type: "string", nullable: true },
                schedule_source: { type: "string", nullable: true }
              },
              required: [] // Not strictly required, but good to have if LLM provides.
            }
          },
          required: ["player_name", "sport", "team", "position", "league", "injury_status", "next_game", "career_highlights", "betting_insights", "strengths", "weaknesses"]
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
