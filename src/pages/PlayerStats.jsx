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
      const nextYear = currentYear + 1;
      const currentDateString = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports statistics analyst with REAL-TIME INTERNET ACCESS. Fetch LIVE, VERIFIED data ONLY.

MANDATORY DATA SOURCES - USE THESE IN ORDER:
1. StatMuse.com - PRIMARY source for all player statistics
2. Basketball-Reference.com (NBA/NCAAB) - search: "[player name] basketball reference"
3. Pro-Football-Reference.com (NFL) - search: "[player name] pro football reference"
4. FBref.com (Soccer/Football) - search: "[player name] fbref"
5. ESPN.com player pages - search: "[player name] espn"
6. Official team websites for injury reports
7. WhoScored.com (Soccer) - search: "[player name] whoscored"

PLAYER SEARCH: "${query}"
TODAY: ${currentDateString}
CURRENT SEASON: ${currentYear}-${nextYear} (Basketball/Hockey)
CURRENT SEASON: ${currentYear} (Soccer/Football/Baseball)

CRITICAL: If you cannot find this player or get current stats, you MUST:
1. Return predicted_performance in next_game as: "Unable to find current statistics for this player. Please try: [Player Full Name] [Current Team] (e.g., 'LeBron James Lakers' or 'Lionel Messi Inter Miami')"
2. Still populate other required fields with reasonable defaults or "Unknown"
3. Set injury_status.status to "Unknown"

STEP-BY-STEP VERIFICATION PROCESS:
1. Search StatMuse: "${query} stats ${currentYear}"
2. If not found, try variations: "[First name] [Last name] ${currentYear}", "[Last name] stats"
3. Identify sport, current team, position from search results
4. Get CURRENT season averages (verify it's ${currentYear} or ${currentYear}-${nextYear} season)
5. Pull last 5-10 game logs with EXACT dates and stats
6. Check official injury report: "[player name] injury" or "[team] injury report"
7. Find next scheduled game: "[team name] schedule"
8. Research opponent's defensive stats against player's position

REQUIRED DATA - ALL FIELDS MUST BE FILLED:

1. PLAYER IDENTIFICATION (from official roster):
   - Full official name (first + last) - from StatMuse or official roster
   - Current team (official team name) - verify from current season data
   - Position (PG, SG, SF, PF, C for basketball; QB, RB, WR, etc for football; Forward, Midfielder, etc for soccer)
   - Sport (Basketball, Soccer, Football, Baseball, Hockey)
   - League (NBA, NFL, Premier League, La Liga, etc.)
   - Jersey number (if available, otherwise null)

2. CURRENT SEASON AVERAGES - SPORT-SPECIFIC ONLY:
   
   FOR BASKETBALL (NBA, NCAAB):
   Search: "${query} ${currentYear} stats" on Basketball-Reference or StatMuse
   - Points Per Game (PPG): current season average (number)
   - Rebounds Per Game (RPG): total rebounds (number)
   - Assists Per Game (APG): (number)
   - Steals Per Game (SPG): (number)
   - Blocks Per Game (BPG): (number)
   - Field Goal % (FG%): decimal (e.g., 0.485 for 48.5%)
   - Three-Point % (3P%): decimal
   - Free Throw % (FT%): decimal
   - Minutes Per Game (MPG): (number)
   
   DO NOT INCLUDE: goals, shots per game, passes, tackles
   Set soccer/football stats to null
   
   FOR SOCCER/FOOTBALL:
   Search: "${query} ${currentYear} stats" on FBref.com or WhoScored
   - Goals per 90 minutes: decimal
   - Assists per 90 minutes: decimal
   - Shots per game: number
   - Shot accuracy %: decimal
   - Passes per game: number
   - Pass completion %: decimal
   - Tackles per game: number
   - Dribbles completed per game: number
   
   DO NOT INCLUDE: rebounds, field goal %, three-pointers, steals, blocks
   Set basketball stats to null
   
   FOR AMERICAN FOOTBALL (NFL):
   Search: "${query} ${currentYear} stats" on Pro-Football-Reference
   - Passing Yards Per Game (if QB): number
   - Completion % (if QB): decimal
   - Touchdowns (passing/rushing/receiving): number
   - Interceptions (if QB): number
   - Rushing Yards Per Game (if RB/QB): number
   - Yards Per Carry (if RB): decimal
   - Receptions Per Game (if WR/TE/RB): number
   - Receiving Yards Per Game (if WR/TE): number
   
   DO NOT INCLUDE: rebounds, assists, three-pointers, goals
   Set basketball/soccer stats to null

3. RECENT FORM - LAST 5-10 GAMES (with EXACT data):
   Search: "${query} game log ${currentYear}" on Basketball-Reference or equivalent
   
   For EACH of last 5-10 games provide:
   - Exact date (MM/DD/YYYY format) - from actual game logs
   - Opponent (full team name) - from game logs
   - SPORT-SPECIFIC stats from that specific game:
     * Basketball: Points, Rebounds, Assists (numbers) - set goals, passing_yards, rushing_yards to null
     * Soccer: Goals, Assists (numbers) - set points, rebounds, passing_yards, rushing_yards to null
     * Football: Passing/Rushing/Receiving yards (numbers) - set points, rebounds, goals to null
   - Performance rating: "Excellent" (significantly above season avg), "Good" (near or above avg), "Below Average" (below avg), "Poor" (well below avg)
   
   Calculate trend: "Trending up" if last 3 games above season avg, "Trending down" if last 3 below season avg, "Consistent" otherwise

4. INJURY STATUS (from official source):
   Search: "${query} injury report" OR "[team name] injury report ${new Date().toLocaleDateString()}"
   
   - status: "Healthy", "Questionable", "Doubtful", "Out", "Day-to-Day", or "Unknown" (REQUIRED - never leave blank)
   - specific_injury: specific injury description if injured, otherwise null
   - games_missed: number of consecutive games missed, otherwise 0 or null
   - expected_return: "MM/DD/YYYY" date or "unknown" or null

5. NEXT GAME PREDICTION (CRITICAL - REQUIRED):
   Search: "[team name] schedule" to find NEXT upcoming game
   
   - opponent: "[Team Name]" (exact official name from schedule)
   - date: "MM/DD/YYYY HH:MM" (exact from schedule with time)
   - location: "Home" or "Away" or "Neutral"
   
   - predicted_performance: (MUST be specific numbers for the sport, STRING format)
     * Basketball: "32 PTS, 9 REB, 7 AST, 2 STL" (specific predicted stat line)
     * Soccer: "2 goals, 1 assist, 6 shots, 4 shots on target"
     * Football (QB): "285 passing yards, 2 passing TDs, 1 INT, 45 rushing yards"
     * Football (RB): "95 rushing yards, 1 rushing TD, 3 receptions, 25 receiving yards"
     * Football (WR): "7 receptions, 95 receiving yards, 1 TD"
     
     IF YOU CANNOT FIND PLAYER DATA: "Unable to find current statistics for this player. Please try: [Player Full Name] [Current Team] (e.g., 'LeBron James Lakers' or 'Cristiano Ronaldo Al Nassr'). Make sure the player is currently active."
   
   - confidence: "High" (player hot, favorable matchup), "Medium" (neutral), "Low" (cold streak or tough matchup), or "Unknown" if no data
   
   - reasoning: (3-4 detailed sentences with STATS, or explanation of why data unavailable)
     Example for basketball: "LeBron averaging 32 PPG over last 5 games (career-high pace). Opponent allows 28 PPG to opposing small forwards (ranked 25th in league). Lakers playing at home where LeBron averages 4 more PPG than road games. Last time vs this opponent (2 weeks ago), LeBron had 35 PTS, 10 REB, 8 AST."
     
     IF NO DATA: "Unable to locate current statistics for this player. This could mean: 1) Player name spelling is incorrect, 2) Player recently changed teams, 3) Player is retired or not currently active, 4) Need more specific search (include team name). Try searching with full name and current team."
     
     Base prediction on (if data available):
     * Player's recent form (last 5-10 games)
     * Opponent's defensive stats vs player's position
     * Home vs Away splits
     * Head-to-head history vs this opponent
     * Any relevant injuries or rest

6. BETTING INSIGHTS (for betting context):
   - over_under_line: prop bet line if available (string like "28.5 points"), otherwise null
   - probability_to_score: % chance based on season data (number 0-100), or null
   - hot_streak: true if last 3 games > season average, false otherwise, or null
   - consistency_rating: "Very Consistent", "Consistent", "Inconsistent", "Very Inconsistent", or "Unknown"
   - best_bet: "Over on points" or "Under on rebounds" etc, or "Insufficient data" if unknown

7. CAREER HIGHLIGHTS (recent achievements):
   - Array of strings describing awards, all-star selections, records
   - If no data available: ["No career highlights data available"]

8. STRENGTHS (3-5 statistical strengths):
   Example: "Elite three-point shooter (42% from 3, top 5 in league)"
   Example: "Exceptional passer with 9 APG (league leader)"
   If no data: ["Unable to determine strengths - need more player data"]

9. WEAKNESSES (2-3 areas for improvement):
   Example: "Free throw shooting needs work (68%, below league avg)"
   Example: "Turnover prone (3.5 TO per game)"
   If no data: ["Unable to determine weaknesses - need more player data"]

10. DATA SOURCES (track where data came from):
    - stats_source: "StatMuse.com" or "Basketball-Reference" etc.
    - injury_source: website used for injury data
    - schedule_source: website used for schedule

VALIDATION - VERIFY BEFORE RETURNING:
✓ All season averages are from ${currentYear} or ${currentYear}-${nextYear} season
✓ Stats match the player's sport (no mixing basketball and soccer stats)
✓ Recent games have actual dates and scores (not made up)
✓ Next game exists on official schedule OR error message explains why not
✓ Prediction is specific numbers OR helpful error message
✓ Injury status is one of: "Healthy", "Questionable", "Doubtful", "Out", "Day-to-Day", "Unknown"
✓ All percentages and averages are realistic
✓ No null values in required fields - use "Unknown" or appropriate default

FAILURE CONDITIONS - HANDLE GRACEFULLY:
If player not found OR stats unavailable:
- Set predicted_performance to helpful error message explaining the issue
- Set injury_status.status to "Unknown"
- Set player_name to the search query used
- Set team to "Unknown"
- Set position to "Unknown"
- Set sport to best guess based on search context
- Set league to "Unknown"
- Populate arrays with ["No data available"] messages
- Still return valid JSON matching the schema

CRITICAL: Return only stats that match the sport. Basketball players should NEVER have "goals per game" or "tackles". Soccer players should NEVER have "rebounds" or "three-point percentage". Use null for stats that don't apply to the sport.

Return complete JSON with ALL required fields using LIVE VERIFIED DATA from ${currentYear} season, OR helpful error messages if data cannot be found.`,
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
                over_under_line: { type: ["string", "null"] },
                probability_to_score: { type: ["number", "null"] },
                hot_streak: { type: ["boolean", "null"] },
                consistency_rating: { type: ["string", "null"] },
                best_bet: { type: ["string", "null"] }
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
      if (result?.next_game?.predicted_performance?.toLowerCase().includes("unable to find")) {
        throw new Error(result.next_game.predicted_performance);
      }

      if (!result || !result.player_name || !result.sport || !result.team || !result.next_game) {
        throw new Error("Invalid response - missing required player data. Please try searching with the player's full name and current team (e.g., 'LeBron James Lakers').");
      }

      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
    } catch (err) {
      console.error("❌ Player Stats Error:", err);
      
      // More helpful error messages
      let errorMessage = err.message;
      
      if (errorMessage.includes("Unable to find") || errorMessage.includes("Unable to locate")) {
        setError(errorMessage);
      } else {
        setError(`Failed to fetch player statistics for "${query}". 

Try these tips:
✓ Use the player's full name: "LeBron James" not just "LeBron"
✓ Add the team name: "LeBron James Lakers"
✓ Check spelling carefully
✓ Make sure the player is currently active
✓ For soccer, try: "Lionel Messi Inter Miami" or "Cristiano Ronaldo Al Nassr"

Examples that work:
• "Stephen Curry Warriors"
• "Patrick Mahomes Chiefs"
• "Lionel Messi Inter Miami"
• "Luka Doncic Mavericks"`);
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