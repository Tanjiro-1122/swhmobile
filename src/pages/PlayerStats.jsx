import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Trophy } from "lucide-react";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayerStats() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
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

  const handleSearch = async (query) => {
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsSearching(true);
    setError(null);
    setCurrentPlayer(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports analyst with REAL-TIME INTERNET ACCESS. You MUST fetch LIVE, CURRENT data from StatMuse.com, Basketball-Reference.com, and ESPN.

SEARCH QUERY: "${query}"
TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT SEASON: ${new Date().getFullYear()} (or ${new Date().getFullYear()}-${new Date().getFullYear() + 1} for NBA/NHL)

⚠️ CRITICAL REQUIREMENT: The "recent_form" array (last 5 games) MUST include COMPLETE stats for EVERY game. Missing data is NOT acceptable. These per-game stats are used for sports betting prop bets and MUST be accurate and complete.

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
- Field goal % (FG%) - return as decimal (e.g., 0.456 for 45.6%)
- Three-point % (3P%) - return as decimal (e.g., 0.350 for 35.0%)
- Three-pointers made per game
- Free throw % (FT%) - return as decimal (e.g., 0.850 for 85.0%)
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

STEP 3: RECENT FORM - DETAILED LAST 5 GAMES (⚠️ ABSOLUTELY CRITICAL!)

🚨 MANDATORY DATA SOURCES FOR GAME-BY-GAME STATS:
1. Basketball-Reference.com - "[player name] game log ${new Date().getFullYear()}"
2. StatMuse.com - "[player name] last 5 games"
3. ESPN.com - "[player name] game log"

⚠️ YOU MUST FETCH EVERY SINGLE STAT FOR EACH OF THE LAST 5 GAMES. DO NOT LEAVE ANY FIELDS BLANK OR USE PLACEHOLDERS.

FOR BASKETBALL - EACH GAME MUST INCLUDE ALL OF THESE (NO EXCEPTIONS):
REQUIRED URL: https://www.basketball-reference.com/players/[player-id]/gamelog/${new Date().getFullYear()}

For EACH of the last 5 games, you MUST provide:
✅ date (exact format: "MM/DD/YYYY" or "Jan 15, 2025")
✅ opponent (team name - e.g., "Los Angeles Lakers")
✅ result (format: "W 115-108" or "L 102-110")
✅ points (exact integer - e.g., 28)
✅ rebounds (exact integer - e.g., 7)
✅ assists (exact integer - e.g., 5)
✅ steals (exact integer - REQUIRED, cannot be blank)
✅ blocks (exact integer - REQUIRED, cannot be blank)
✅ three_pointers_made (exact integer - e.g., 4 - REQUIRED, cannot be blank)
✅ field_goals_made (exact integer - e.g., 10 - REQUIRED)
✅ field_goals_attempted (exact integer - e.g., 18 - REQUIRED)
✅ free_throws_made (exact integer - e.g., 6 - REQUIRED)
✅ free_throws_attempted (exact integer - e.g., 8 - REQUIRED)
✅ minutes_played (exact integer - e.g., 35 - REQUIRED, cannot be blank)
✅ performance_rating (text: "Excellent" if above season avg, "Good" if close, "Average", or "Poor")

CRITICAL BASKETBALL STATS THAT ARE OFTEN MISSING:
- steals (STL) - Find this in the game log table on Basketball-Reference, usually 4th or 5th column
- blocks (BLK) - Find this immediately after steals in game log
- three_pointers_made (3PM) - Find this before field goals in game log
- field_goals_made/attempted (FGM/FGA) - Core stat, always in game log
- free_throws_made/attempted (FTM/FTA) - Core stat, always in game log
- minutes_played (MIN) - Usually first or second column in game log

VERIFICATION: After extracting basketball game data, verify EVERY stat is a number (not null, not "-", not blank). If any stat is missing from the game log, return 0 for that game but include a note in performance_rating.

FOR BASEBALL BATTERS - Each game must include:
- Date
- Opponent
- Result
- Hits (exact number)
- At-bats (exact number)
- Home runs (exact number)
- RBIs (exact number)
- Stolen bases (exact number)
- Batting average for that game

FOR BASEBALL PITCHERS - Each game must include:
- Date
- Opponent
- Result
- Innings pitched (e.g., 6.0)
- Strikeouts (exact number)
- Earned runs (exact number)
- Hits allowed
- Walks

FOR SOCCER - Each game must include:
- Date
- Opponent
- Result
- Goals scored (exact number)
- Assists (exact number)
- Shots on target
- Key passes
- Tackles made
- Minutes played

FOR NFL QB - Each game must include:
- Date
- Opponent
- Result
- Passing yards (exact number)
- Passing touchdowns
- Interceptions thrown
- Completion percentage
- Rushing yards

FOR NFL RB/WR - Each game must include:
- Date
- Opponent
- Result
- Rushing yards (RB) or Receptions (WR)
- Rushing touchdowns or Receiving yards
- Yards per carry or Receiving touchdowns

STEP 4: NEXT GAME PREDICTION
Search: "[team name] schedule" on ESPN
- Find next scheduled game (opponent, date, location)
- PREDICT SPECIFIC STATS for that game based on:
  * Player's season averages
  * Last 5 games performance trend (calculate average from the 5 games)
  * Historical performance against this opponent
  * Current form (hot/cold streak)

BASKETBALL PREDICTION FORMAT:
"28 PTS, 7 REB, 5 AST, 2 STL, 1 BLK, 4 3PM" (specific numbers with all key stats)

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
- Is player on a hot streak? (boolean - true if last 3 games above season average)
- Consistency rating: Calculate variation in last 5 games:
  * If std deviation < 15% of mean: "Very Consistent"
  * If 15-30%: "Moderately Consistent"
  * If > 30%: "Inconsistent"

STEP 6: INJURY STATUS
Search: "[player name] injury report" or "[team name] injury report today"
- Current injury status: "Healthy", "Questionable", "Out", "Day-to-Day"
- If injured, specify the injury

CRITICAL RULES:
✓ Use ONLY stats from the CURRENT ${new Date().getFullYear()} season
✓ DO NOT mix sport stats (no "rebounds" for baseball, no "home runs" for basketball)
✓ Recent form MUST show ACTUAL game results with EXACT numbers from game logs, not estimates
✓ Each of the 5 games must have complete stat lines appropriate for the sport
✓ EVERY FIELD must be populated with a number, not null, not "-", not blank
✓ If a stat truly cannot be found for a game, use 0 (zero) instead of leaving it blank
✓ All stats must be from StatMuse, ESPN, Basketball-Reference, Pro-Football-Reference, or official league sources
✓ Predictions must be SPECIFIC NUMBERS, not ranges
✓ Percentages should be returned as decimals (0.45 for 45%, not 45)

VALIDATION BEFORE RETURNING:
1. Check that "recent_form" array has exactly 5 games
2. For each game, verify EVERY required stat for that sport is a number (not null)
3. For basketball: verify steals, blocks, 3PM, FG made/attempted, FT made/attempted, and minutes are ALL present
4. If any critical stat is missing, re-search specifically for that stat on Basketball-Reference game log

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
                three_pointers_made_per_game: { type: "number" },
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
                  result: { type: "string" },
                  points: { type: "number" },
                  assists: { type: "number" },
                  rebounds: { type: "number" },
                  steals: { type: "number" },
                  blocks: { type: "number" },
                  three_pointers_made: { type: "number" },
                  field_goals_made: { type: "number" },
                  field_goals_attempted: { type: "number" },
                  free_throws_made: { type: "number" },
                  free_throws_attempted: { type: "number" },
                  minutes_played: { type: "number" },
                  goals: { type: "number" },
                  shots_on_target: { type: "number" },
                  key_passes: { type: "number" },
                  tackles: { type: "number" },
                  passing_yards: { type: "number" },
                  passing_touchdowns: { type: "number" },
                  interceptions_thrown: { type: "number" },
                  rushing_yards: { type: "number" },
                  rushing_touchdowns: { type: "number" },
                  receptions: { type: "number" },
                  receiving_yards: { type: "number" },
                  receiving_touchdowns: { type: "number" },
                  hits: { type: "number" },
                  home_runs: { type: "number" },
                  rbis: { type: "number" },
                  stolen_bases: { type: "number" },
                  at_bats: { type: "number" },
                  strikeouts: { type: "number" },
                  innings_pitched: { type: "number" },
                  earned_runs: { type: "number" },
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

      // Save to database for historical tracking
      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
      // Display results immediately on this page
      setCurrentPlayer(result);
      
    } catch (err) {
      console.error("Player analysis error:", err);
      setError("Failed to analyze player. Please try again with full name or different spelling.");
    }

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
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

        <Card className="p-6 mb-8 border-2 border-purple-200 bg-white shadow-xl">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-2 border-red-200">
            <AlertDescription className="text-red-900">{error}</AlertDescription>
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
              <p className="text-gray-700">Fetching complete game-by-game stats from Basketball-Reference & StatMuse...</p>
              <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds for detailed data extraction</p>
            </div>
          </div>
        )}

        {/* Display player results directly on this page */}
        <AnimatePresence>
          {currentPlayer && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <PlayerStatsDisplay player={currentPlayer} />
              
              <Alert className="mt-6 bg-blue-50 border-2 border-blue-200">
                <AlertDescription className="text-blue-900">
                  ✅ Player analysis saved! View all your saved results in <a href="/SavedResults" className="underline font-bold">Saved Results</a>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}