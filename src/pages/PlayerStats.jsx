import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Sparkles, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import EmptyPlayerState from "../components/player/EmptyPlayerState";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import LimitedOfferBanner from "../components/auth/LimitedOfferBanner";
import { AnimatePresence, motion } from "framer-motion"; // Added motion

export default function PlayerStats() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailedError, setShowDetailedError] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Gathering player data...");
  const queryClient = useQueryClient();

  const { lookupsRemaining, isAuthenticated, isPremium, isVIP, recordLookup, canLookup } = useFreeLookupTracker();

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

  // Multi-stage loading messages
  useEffect(() => {
    let interval;
    if (isSearching) {
      const messages = [
        "Fetching live player data from StatMuse & ESPN...",
        "Analyzing recent player performances...",
        "Determining starting status & depth chart...",
        "Calculating betting insights & predictions...",
        "Compiling career highlights...",
        "Verifying data from official sources..."
      ];
      let i = 0;
      setLoadingMessage(messages[i]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 3000); // Change message every 3 seconds
    } else {
      setLoadingMessage("Gathering player data...");
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleSearch = async (query) => {
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsSearching(true);
    setError(null);
    setShowDetailedError(false); // Reset detailed error view

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports statistics AI with LIVE INTERNET ACCESS. You MUST fetch REAL, VERIFIED player data from ${new Date().getFullYear()}.

PLAYER SEARCH: "${query}"
TODAY: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT SEASON: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 MANDATORY DATA SOURCES (CHECK ALL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⭐ StatMuse.com - PRIMARY SOURCE
   Search: "${query} stats ${new Date().getFullYear()}"
   Get: Season averages, game logs, team

2. 🏀 Basketball-Reference.com (NBA players)
   URL: basketball-reference.com/players/
   Get: Detailed stats, per-game averages, shooting %

3. 🏈 Pro-Football-Reference.com (NFL players)
   URL: pro-football-reference.com/players/
   Get: Passing/rushing/receiving stats, per-game

4. ⚾ Baseball-Reference.com (MLB players)
   URL: baseball-reference.com/players/
   Get: Batting/pitching stats, game logs

5. 📺 ESPN.com Player Pages
   URL: espn.com/[league]/player/_/id/[player]
   Get: Current team, position, injury status, DEPTH CHART

6. 🏟️ Official Team Websites
   Check: Current roster, injury reports, DEPTH CHARTS, starting lineups

7. 📰 Rotoworld / RotoBaller / FantasyPros
   Get: Starting status, lineup confirmations, depth chart updates

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 VERIFICATION PROCESS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: IDENTIFY PLAYER & SPORT
- Search StatMuse for "${query}"
- If multiple players with same name, select the CURRENT active player
- Determine sport (NBA/NFL/MLB/Soccer)
- Verify player is ACTIVE in ${new Date().getFullYear()} season

STEP 2: GET CURRENT TEAM, POSITION & STARTING STATUS
- Check official team roster
- Verify player is on CURRENT roster
- Get exact position (e.g., "Point Guard", "Quarterback", "Catcher")
- CHECK DEPTH CHART on ESPN or team website
- VERIFY IF STARTING: Look for "Starter", "1st String", "Starting Lineup"
- SET is_starting = true if player is listed as starter
- SET is_starting = false if player is backup/bench/2nd string
- SET depth_chart_position (e.g., "Starter", "Backup", "2nd String", "Bench")

CRITICAL SOURCES FOR STARTING STATUS:
- ESPN depth charts: espn.com/[league]/team/depth/_/name/[team]
- Official team website depth charts
- Latest game starting lineups
- Rotoworld/RotoBaller depth chart updates

STEP 3: SEASON AVERAGES (${new Date().getFullYear()} ONLY)

FOR MLB/BASEBALL:
✓ Batting Average (from Baseball-Reference)
✓ Hits per game
✓ Runs per game  
✓ RBIs per game
✓ Home Runs per game
✓ Stolen Bases per game
✓ On-Base Percentage (OBP)
✓ Slugging Percentage (SLG)

FOR NBA/BASKETBALL:
✓ Points per game (from Basketball-Reference)
✓ Rebounds per game
✓ Assists per game
✓ Steals & Blocks per game
✓ FG%, 3P%, FT% (shooting percentages)
✓ Minutes per game

FOR NFL QUARTERBACKS:
✓ Passing yards per game (from Pro-Football-Reference)
✓ Passing TDs per game
✓ Interceptions per game
✓ Completion percentage
✓ Passer rating
✓ Rushing yards (if applicable)

FOR NFL RUNNING BACKS:
✓ Rushing yards per game (PRIMARY)
✓ Rushing TDs per game
✓ Carries per game
✓ Yards per carry
✓ Receptions & receiving yards
✓ Receiving TDs

FOR NFL WR/TE:
✓ Receptions per game (PRIMARY)
✓ Receiving yards per game
✓ Receiving TDs per game
✓ Targets per game
✓ Yards per reception
✓ Catch percentage

FOR SOCCER:
✓ Goals per game
✓ Assists per game
✓ Shots per game
✓ Pass completion %
✓ Minutes per game

STEP 4: GET LAST 5-10 GAME LOGS
- Search: "[Player Name] game log ${new Date().getFullYear()}"
- For EACH game get:
  * Exact date (MM/DD/YYYY format)
  * Opponent (full team name)
  * Actual stats from THAT specific game
  * Performance rating vs season average

EXAMPLE FOR BASEBALL:
Date: 01/15/2025, vs Yankees, 3 H, 2 R, 1 RBI, 1 HR

STEP 5: CHECK INJURY STATUS (TODAY)
- Search: "[Player Name] injury report ${new Date().toLocaleDateString()}"
- Status: Healthy/Day-to-Day/Out/Questionable
- If injured: type of injury, expected return

STEP 6: NEXT GAME PREDICTION
- Get team's next opponent from schedule
- Predict stats within ±30% of season average
- Consider matchup and recent form
- Provide REALISTIC predictions

STEP 7: BETTING LINES & PROBABILITIES
- Search DraftKings/Fanduel for player props
- Get Over/Under lines for main stat
- Calculate probability percentages
- Example: "O/U 1.5 Hits, 60% chance to go Over"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DATA VALIDATION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ REJECT if:
- Player name misspelled or wrong
- Not on current ${new Date().getFullYear()} roster
- Stats from previous seasons
- Game logs without actual dates
- Fake/placeholder data
- No depth chart info / starting status unknown

✅ ACCEPT only if:
- All stats from ${new Date().getFullYear()} season
- Player verified on team website
- Game logs have real dates & opponents
- Season averages match StatMuse
- Starting status verified from depth chart

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 SPORT-SPECIFIC REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MLB/Baseball: Focus on Hits, Runs, RBIs, Home Runs per game
NBA: Focus on PPG, APG, RPG, FG%, 3P%
NFL QB: Focus on passing yards, TDs, completion %
NFL RB: Focus on rushing yards, YPC, TDs
NFL WR/TE: Focus on receptions, receiving yards, TDs
Soccer: Focus on goals, assists, shots

CRITICAL: Return ONLY stats relevant to player's position and sport

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SPECIAL INSTRUCTIONS FOR COMMON NAMES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If player has a common name (e.g., "Will Smith", "Chris Davis"):
1. Search for the CURRENTLY ACTIVE player in major leagues
2. Prioritize the player with the most recent game
3. Verify their current team
4. Include league and team in response to clarify

Example: "Will Smith" in baseball → Will Smith (C, Los Angeles Dodgers)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RETURN: Valid JSON with ALL position-appropriate fields filled using REAL ${new Date().getFullYear()} data, including is_starting and depth_chart_position.

If player not found, return with player_name set to "NOT_FOUND"`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            league: { type: "string" },
            is_starting: { 
              type: "boolean",
              description: "True if player is in starting lineup, false if backup/bench"
            },
            depth_chart_position: {
              type: "string",
              description: "Position on depth chart: 'Starter', 'Backup', '2nd String', 'Bench', etc."
            },
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
                yards_per_reception: { type: "number" },
                hits_per_game: { type: "number" },
                runs_per_game: { type: "number" },
                rbis_per_game: { type: "number" },
                home_runs_per_game: { type: "number" },
                stolen_bases_per_game: { type: "number" },
                batting_average: { type: "number" },
                on_base_percentage: { type: "number" },
                slugging_percentage: { type: "number" }
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
                  hits: { type: "number" },
                  runs: { type: "number" },
                  rbis: { type: "number" },
                  home_runs: { type: "number" },
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
                over_under_hits: { type: "number" },
                over_under_rbis: { type: "number" },
                over_under_home_runs: { type: "number" },
                over_probability: { type: "number" },
                under_probability: { type: "number" },
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

      if (!result || result.player_name === "NOT_FOUND" || !result.sport || !result.team) {
        throw new Error("Player not found - please verify the player name and try again");
      }

      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
    } catch (err) {
      console.error("❌ Player Stats Error:", err);
      let shortMessage = "Failed to fetch player statistics.";
      let detailedMessage = "Please try:\n• Full name (e.g., 'Josh Allen NFL')\n• Adding sport/league (e.g., 'Tyreek Hill NFL')\n• Current active players only";
      
      if (err.message?.includes("Player not found")) {
        shortMessage = `Couldn't find "${query}".`;
        detailedMessage = `Try:\n\n• Using the player's full name (e.g., 'Patrick Mahomes')\n• Including the sport/league (e.g., 'Will Smith MLB' or 'Will Smith Dodgers')\n• Checking the spelling\n• Making sure the player is currently active\n\n💡 Tip: For common names, add the team or league (e.g., 'Chris Davis Orioles')`;
      }
      
      setError({ short: shortMessage, detailed: detailedMessage });
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
    <div className="min-h-screen">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} />
      <LimitedOfferBanner />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black">Player Statistics</h1>
              <p className="text-purple-100 text-lg mt-2">
                Season averages, recent form & next game predictions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50 text-red-400">
            <AlertTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              {error.short}
              <Button variant="ghost" size="sm" onClick={() => setShowDetailedError(!showDetailedError)} className="ml-auto text-red-300 hover:bg-red-500/20 hover:text-red-200">
                {showDetailedError ? "Hide Details" : "Show Details"}
              </Button>
            </AlertTitle>
            <AnimatePresence>
              {showDetailedError && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <AlertDescription className="whitespace-pre-line mt-2 pt-2 border-t border-red-500/30">
                    {error.detailed}
                  </AlertDescription>
                </motion.div>
              )}
            </AnimatePresence>
          </Alert>
        )}

        {isSearching ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200 opacity-20" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-white justify-center mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-lg">Fetching live player statistics...</span>
              </div>
              <p className="text-slate-400">{loadingMessage}</p>
            </div>
          </div>
        ) : (
          <>
            {players.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
                    Analyzed Players
                    <span className="text-slate-500">({players.length})</span>
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