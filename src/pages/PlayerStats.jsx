
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
import { AnimatePresence, motion } from "framer-motion";

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
      const currentYear = new Date().getFullYear();
      const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `🚨 CRITICAL: You MUST use ONLY ${currentYear}-${currentYear + 1} season data. NO OLD DATA. 🚨

PLAYER SEARCH: "${query}"
TODAY: ${currentDate}
CURRENT SEASON: ${currentYear}-${currentYear + 1}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ DATA FRESHNESS VERIFICATION REQUIRED ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEFORE providing ANY data, you MUST verify:
✅ All season averages are from ${currentYear}-${currentYear + 1} season
✅ Last 5 games have dates from ${currentYear} (within last 60 days)
✅ Injury status is from THIS WEEK (${currentDate})
✅ Team roster is CURRENT (${currentYear})
✅ Betting props are LIVE (not archived)

IF YOU CANNOT FIND ${currentYear} DATA:
❌ DO NOT use ${currentYear - 1} or older data
❌ DO NOT fabricate placeholder data
✅ INSTEAD: Set player_name to "NOT_FOUND"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 MANDATORY DATA SOURCES (CHECK ALL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⭐ StatMuse.com - PRIMARY SOURCE
   Search EXACTLY: "${query} stats ${currentYear}"
   Get: ${currentYear}-${currentYear + 1} season averages, game logs

2. 🏀 Basketball-Reference.com (NBA)
   URL: basketball-reference.com/players/
   Verify: Stats page shows ${currentYear}-${currentYear + 1} season

3. 🏈 Pro-Football-Reference.com (NFL)
   URL: pro-football-reference.com/players/
   Verify: ${currentYear} season stats ONLY

4. ⚾ Baseball-Reference.com (MLB)
   URL: baseball-reference.com/players/
   Verify: ${currentYear} season stats ONLY

5. 📺 ESPN.com Player Pages
   URL: espn.com/[league]/player/_/id/[player]
   Get: Current team, position, TODAY's injury status

6. 🏟️ Official Team Websites
   Check: Current ${currentYear} roster, depth chart, injury reports

7. 💰 DraftKings / FanDuel
   Get: TODAY's player prop lines and over/unders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 STEP-BY-STEP VERIFICATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: IDENTIFY PLAYER
- Search StatMuse: "${query} ${currentYear}"
- If multiple players, select CURRENTLY ACTIVE player
- Determine sport (NBA/NFL/MLB/Soccer)
- Verify player is on ${currentYear} roster

STEP 2: VERIFY CURRENT TEAM & POSITION
- Check official team roster for ${currentYear}
- Verify player is on ACTIVE roster
- Get exact position
- Check depth chart for starting status

STEP 3: SEASON AVERAGES (${currentYear}-${currentYear + 1} ONLY)

FOR MLB/BASEBALL:
✅ Batting Average
✅ Hits per game
✅ Runs per game  
✅ RBIs per game
✅ Home Runs per game
✅ Stolen Bases per game
✅ On-Base Percentage (OBP)
✅ Slugging Percentage (SLG)

FOR NBA/BASKETBALL:
✅ Points per game
✅ Rebounds per game
✅ Assists per game
✅ Steals & Blocks per game
✅ FG%, 3P%, FT%
✅ Minutes per game

FOR NFL QUARTERBACKS:
✅ Passing yards per game
✅ Passing TDs per game
✅ Interceptions per game
✅ Completion percentage
✅ Passer rating

FOR NFL RUNNING BACKS:
✅ Rushing yards per game
✅ Rushing TDs per game
✅ Carries per game
✅ Yards per carry
✅ Receptions & receiving yards

FOR NFL WR/TE:
✅ Receptions per game
✅ Receiving yards per game
✅ Receiving TDs per game
✅ Targets per game
✅ Yards per reception

FOR SOCCER:
✅ Goals per game
✅ Assists per game
✅ Shots per game
✅ Pass completion %

VALIDATION: Verify all stats are labeled "${currentYear}-${currentYear + 1}" on source

STEP 4: LAST 5-10 GAME LOGS (MUST BE RECENT)
- Get game logs from last 60 days
- For EACH game:
  * Date in MM/DD/${currentYear} format
  * Opponent (full team name)
  * Actual stats from that game
  * Performance vs season average

VALIDATION: All dates MUST be from ${currentYear}

STEP 5: INJURY STATUS (MUST BE CURRENT)
- Search: "[Player Name] injury report ${currentDate}"
- Get TODAY's status: Healthy / Day-to-Day / Out / Doubtful / Questionable
- If injured: type, expected return, impact

VALIDATION: Injury report MUST be from this week

STEP 6: BETTING PROPS (LIVE LINES)
- Get TODAY's props from DraftKings/FanDuel:
  * Over/Under for main stat (Points, Hits, Yards, etc.)
  * Probability percentages
  * Line value

VALIDATION: Props MUST be for upcoming/current games

STEP 7: NEXT GAME PREDICTION
- Get team's next scheduled game
- Predict performance within ±30% of season average
- Consider matchup and recent form

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ FINAL VALIDATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☑️ All stats from ${currentYear}-${currentYear + 1} season
☑️ Last 5 games within last 60 days
☑️ Injury status from this week
☑️ On current team roster
☑️ Betting props are live/current
☑️ Season averages match sport/position

RETURN: Complete ${currentYear} data, or player_name="NOT_FOUND" if unavailable.`,
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
              description: "True if player is in starting lineup"
            },
            depth_chart_position: {
              type: "string",
              description: "Depth chart position"
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

      // VALIDATION
      if (!result || result.player_name === "NOT_FOUND" || !result.sport || !result.team) {
        throw new Error("Player not found - please verify the player name and try again");
      }

      // Validate data freshness - client-side check for recent form
      if (result.recent_form && result.recent_form.length > 0) {
        // Assuming dates are in MM/DD/YYYY or YYYY-MM-DD format, which Date constructor can parse
        const mostRecentGameDate = new Date(result.recent_form[0].date);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 90); // Adjusted to 90 days as per outline

        if (mostRecentGameDate < sixtyDaysAgo) {
          // This is a warning. The LLM is instructed to return NOT_FOUND for old data.
          // If it didn't, we can log a warning or choose to throw an error here.
          console.warn(`⚠️ Warning: Most recent game data for ${result.player_name} is older than 90 days (${mostRecentGameDate.toLocaleDateString()}). Data might be from a previous season.`);
        }
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
