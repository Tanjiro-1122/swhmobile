
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Sparkles, Zap, Target, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import SearchBar from "../components/sports/SearchBar";
import MatchCard from "../components/sports/MatchCard";
import EmptyState from "../components/sports/EmptyState";
import TodaysBestBets from "../components/sports/TodaysBestBets";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import LimitedOfferBanner from "../components/auth/LimitedOfferBanner";
import LiveDataBadge from "../components/shared/LiveDataBadge";
import { AnimatePresence, motion } from "framer-motion";

export default function Dashboard() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailedError, setShowDetailedError] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Gathering live data...");
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

  const { data: matches, isLoading, error: loadError } = useQuery({
    queryKey: ['matches', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Match.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  useEffect(() => {
    let interval;
    if (isSearching) {
      const messages = [
        "Gathering live data from StatMuse & ESPN...",
        "Analyzing team & player forms...",
        "Calculating win probabilities & betting insights...",
        "Fetching latest injury reports...",
        "Verifying data from official sources...",
        "Finalizing prediction model..."
      ];
      let i = 0;
      setLoadingMessage(messages[i]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 3000);
    } else {
      setLoadingMessage("Gathering live data...");
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
    setShowDetailedError(false);

    // Declare date-related variables outside the try block to ensure scope
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      
    try {
      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt: `🚨 CRITICAL: You MUST use ONLY ${currentYear}-${currentYear + 1} season data. NO EXCEPTIONS. 🚨

SEARCH QUERY: "${query}"
TODAY'S DATE: ${currentDate}
CURRENT SEASON: ${currentYear}-${currentYear + 1}
CURRENT MONTH: ${new Date().toLocaleString('en-US', { month: 'long' })} ${currentYear}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ DATA FRESHNESS VERIFICATION REQUIRED ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEFORE providing ANY data, you MUST verify:
✅ All stats are from ${currentYear}-${currentYear + 1} season
✅ Last 5 games have dates from the last 60 days (within ${currentYear})
✅ Current injury reports are from THIS WEEK (${currentDate})
✅ Team records reflect games played in ${currentYear}
✅ Betting odds are CURRENT (not archived)

IF YOU CANNOT FIND ${currentYear} DATA:
❌ DO NOT use ${currentYear - 1} or older data
❌ DO NOT make up placeholder data
✅ INSTEAD: Return with analysis_summary starting with "Unable to find current ${currentYear} data for this match"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 MANDATORY DATA SOURCES (CHECK IN ORDER):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⭐ StatMuse.com - PRIMARY SOURCE
   Search EXACTLY: "${query} ${currentYear}"
   Example queries:
   - "Lakers at Celtics ${currentYear}"
   - "${query} season stats ${currentYear}"
   Verify: Results show "${currentYear}-${currentYear + 1}" season

2. 🏀 Basketball-Reference.com (NBA)
   URL: basketball-reference.com/leagues/NBA_${currentYear + 1}.html
   Verify current season schedule and stats

3. 🏈 Pro-Football-Reference.com (NFL)
   URL: pro-football-reference.com/years/${currentYear}/
   Get ${currentYear} season stats ONLY

4. ⚾ Baseball-Reference.com (MLB)
   URL: baseball-reference.com/leagues/majors/${currentYear}.shtml
   Get ${currentYear} season stats ONLY

5. 📺 ESPN.com
   URL: espn.com/[league]/scoreboard/_/date/${currentYear}${String(currentMonth).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}
   Get TODAY's schedule and current injury reports

6. 💰 DraftKings / FanDuel / BetMGM
   Get LIVE odds for THIS match (not historical)
   Verify odds were updated within last 24 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CRITICAL: HOME vs AWAY VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARSING RULES:
📍 "Team A @ Team B" → Team A is AWAY, Team B is HOME
📍 "Team A at Team B" → Team A is AWAY, Team B is HOME
📍 "Team A vs Team B" → Team A is HOME, Team B is AWAY

VERIFICATION STEPS:
1. Check ESPN schedule for venue location
2. Confirm which team owns the stadium/arena
3. Cross-reference with team's official schedule
4. Include FULL venue name and city

EXAMPLES OF CORRECT PARSING:
✅ "Lakers @ Celtics" → Lakers (AWAY) at TD Garden in Boston, Celtics (HOME)
✅ "Chiefs at Bills" → Chiefs (AWAY) at Highmark Stadium in Buffalo, Bills (HOME)
✅ "Warriors vs Nuggets" → Warriors (HOME) at Chase Center in San Francisco, Nuggets (AWAY)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 STEP-BY-STEP DATA COLLECTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: VERIFY MATCH EXISTS & GET DETAILS
- Search StatMuse: "${query} ${currentYear}"
- Confirm match is scheduled for ${currentYear}
- Get OFFICIAL team names (not nicknames)
- Verify EXACT date and time (with timezone)
- Confirm venue name and location

STEP 2: CURRENT SEASON TEAM STATS (${currentYear}-${currentYear + 1})
For EACH team, fetch:
  ✅ Overall record (W-L-D) as of TODAY
  ✅ Home record (for home team)
  ✅ Away record (for away team)
  ✅ Points per game (${currentYear} average)
  ✅ Points allowed per game (${currentYear} average)
  ✅ Last 5 games with REAL dates (MM/DD/${currentYear} format)
  
VALIDATION: Last 5 games MUST have dates within last 60 days

STEP 3: KEY PLAYERS (5-7 PER TEAM)
For EACH player:
  ✅ ${currentYear}-${currentYear + 1} season averages
  ✅ Last 5 games (with dates from ${currentYear})
  ✅ Predicted stats for UPCOMING game
  ✅ Current injury status (from THIS WEEK)
  ✅ Over/Under prop lines (from today's sportsbooks)
  
SPORT-SPECIFIC STATS:
Baseball (MLB): Hits/G, Runs/G, RBIs/G, HRs/G, Batting Avg, OBP, SLG
Basketball (NBA): Points/G, Rebounds/G, Assists/G, FG%, 3P%, Combined (PTS+REB+AST)
Football (NFL): 
  - QB: Pass Yds/G, Pass TDs/G, INTs/G, Comp%, Passer Rating
  - RB: Rush Yds/G, Rush TDs/G, Rec/G, Yds/Carry
  - WR/TE: Rec/G, Rec Yds/G, Rec TDs/G, Targets/G
Soccer: Goals/G, Assists/G, Shots/G, Pass Accuracy%

STEP 4: INJURY REPORTS (CRITICAL - MUST BE CURRENT)
- Search: "[Team Name] injury report ${currentDate}"
- Get OFFICIAL team injury list from team website or ESPN
- For each injured player:
  * Full name
  * Injury type (e.g., "Knee - MCL Sprain")
  * Status: Out / Doubtful / Questionable / Day-to-Day
  * Expected return date
  * Impact rating: Major / Moderate / Minor

VALIDATION: Injury reports MUST be from this week (${currentDate})

STEP 5: BETTING MARKETS (LIVE ODDS ONLY)
Get CURRENT odds from DraftKings/FanDuel:
  ✅ Moneyline (e.g., Home -150, Away +130)
  ✅ Spread (e.g., Home -3.5, -110)
  ✅ Over/Under total (e.g., 225.5, Over -110)
  ✅ Player props (for key players)
  
VALIDATION: Odds MUST be current (updated within 24 hours)

STEP 6: WIN PROBABILITY CALCULATION
Based on:
  - Current ${currentYear} season stats
  - Home/away splits
  - Recent form (last 5 games)
  - Head-to-head history (recent meetings)
  - Key injuries
  - Betting market consensus

PROBABILITIES MUST:
  ✅ Sum exactly to 100%
  ✅ Reflect statistical analysis
  ✅ Consider home court advantage
  ✅ Account for injuries

STEP 7: CONFIDENCE LEVEL ASSIGNMENT
- HIGH (85-95%): Strong statistical edge, clear favorite, minimal uncertainty
- MEDIUM (70-85%): Moderate edge, some uncertainty factors
- LOW (50-70%): Toss-up game, high uncertainty

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ FINAL VALIDATION CHECKLIST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before returning data, verify:
☑️ All stats are from ${currentYear}-${currentYear + 1} season
☑️ Last 5 games have dates from last 60 days
☑️ Injury reports are from this week
☑️ Probabilities sum to exactly 100%
☑️ Venue is correctly identified
☑️ Home/away teams are correct
☑️ Betting odds are current
☑️ Player predictions are reasonable (within ±30% of season average)

IF ANY VALIDATION FAILS:
❌ Do NOT return fake/placeholder data
✅ Include specific error in analysis_summary

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RETURN: Complete JSON with ALL ${currentYear} data verified, or clear error message if data unavailable.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sport: { type: "string" },
            league: { type: "string" },
            home_team: { type: "string" },
            away_team: { type: "string" },
            venue: { type: "string" },
            match_date: { type: "string" },
            home_win_probability: { type: "number" },
            away_win_probability: { type: "number" },
            draw_probability: { type: "number" },
            key_factors: {
              type: "array",
              items: { type: "string" }
            },
            analysis_summary: { type: "string" },
            confidence_level: {
              type: "string",
              enum: ["low", "medium", "high"]
            },
            key_players: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  team: { type: "string" },
                  position: { type: "string" },
                  sport: { type: "string" },
                  season_average: { type: "string" },
                  last_five_games: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string" },
                        opponent: { type: "string" },
                        stats: { type: "string" }
                      }
                    }
                  },
                  predicted_points: { type: "number" },
                  predicted_assists: { type: "number" },
                  predicted_rebounds: { type: "number" },
                  predicted_goals: { type: "number" },
                  predicted_hits: { type: "number" },
                  predicted_runs: { type: "number" },
                  predicted_rbis: { type: "number" },
                  predicted_home_runs: { type: "number" },
                  predicted_passing_yards: { type: "number" },
                  predicted_passing_touchdowns: { type: "number" },
                  predicted_rushing_yards: { type: "number" },
                  predicted_receiving_yards: { type: "number" },
                  predicted_receptions: { type: "number" },
                  over_under_line: { type: "number" },
                  over_probability: { type: "number" },
                  under_probability: { type: "number" },
                  probability_to_score: { type: "number" },
                  recent_form: { type: "string", enum: ["Hot", "Average", "Cold"] },
                  injury_status: { type: "string" },
                  injury_details: { type: "string" }
                }
              }
            },
            betting_markets: {
              type: "object",
              properties: {
                moneyline: {
                  type: "object",
                  properties: {
                    home_odds: { type: "string" },
                    away_odds: { type: "string" }
                  }
                },
                spread: {
                  type: "object",
                  properties: {
                    line: { type: "number" },
                    home_cover_probability: { type: "number" },
                    away_cover_probability: { type: "number" }
                  }
                },
                over_under: {
                  type: "object",
                  properties: {
                    line: { type: "number" },
                    over_probability: { type: "number" },
                    under_probability: { type: "number" }
                  }
                },
                first_to_score: {
                  type: "object",
                  properties: {
                    home_probability: { type: "number" },
                    away_probability: { type: "number" }
                  }
                }
              }
            },
            current_injuries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  player_name: { type: "string" },
                  team: { type: "string" },
                  injury_type: { type: "string" },
                  status: { type: "string", enum: ["Out", "Doubtful", "Questionable", "Day-to-Day"] },
                  impact: { type: "string" }
                }
              }
            }
          },
          required: ["sport", "home_team", "away_team", "venue"]
        }
      });

      console.log("✅ Match Analysis Result:", llmResult);

      // POST-PROCESSING VALIDATION
      if (!llmResult || !llmResult.sport || !llmResult.home_team || !llmResult.away_team || !llmResult.venue) {
        throw new Error("Invalid response - missing required match data");
      }

      if (llmResult.analysis_summary?.includes(`Unable to find current ${currentYear} data for this match`)) {
        throw new Error(`Match not found for ${currentYear} - try a different query or wait for data to become available.`);
      } else if (llmResult.analysis_summary?.includes("Unable to")) {
        throw new Error("Match not found - try a different date or verify team names");
      }
      
      // Validate data freshness for key players on the client side as an extra safeguard
      if (llmResult.key_players && llmResult.key_players.length > 0) {
        for (const player of llmResult.key_players) {
          if (player.last_five_games && player.last_five_games.length > 0) {
            // Check if last game date is recent (within last 90 days)
            // Assuming `last_five_games` is sorted by date, latest first.
            const lastGameDate = new Date(player.last_five_games[0].date);
            const daysSinceLastGame = Math.floor((new Date() - lastGameDate) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastGame > 90) {
              console.warn(`⚠️ Warning: Player ${player.name} last game was ${daysSinceLastGame} days ago - data might be outdated`);
              // Optionally, you could throw an error or mark the result as low confidence here.
            }
          }
        }
      }
      
      // Probability validation
      const totalProb = (llmResult.home_win_probability || 0) + (llmResult.away_win_probability || 0) + (llmResult.draw_probability || 0);
      if (Math.abs(totalProb - 100) > 0.5) {
        console.warn(`⚠️ Probabilities sum to ${totalProb.toFixed(1)}%, adjusting to 100%`);
        if (llmResult.draw_probability !== undefined) {
          llmResult.draw_probability += (100 - totalProb);
        } else {
          const diff = 100 - totalProb;
          llmResult.home_win_probability += diff / 2;
          llmResult.away_win_probability += diff / 2;
        }
      }

      await base44.entities.Match.create(llmResult);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      
    } catch (err) {
      console.error("❌ Match Analysis Error:", err);
      let shortMessage = "Failed to analyze the match.";
      let detailedMessage = "Please try:\n• Using official team names\n• Adding 'today' or 'tonight'\n• Using @ to indicate away team\n• Being more specific about the league";
      
      if (err.message?.includes("Match not found for")) {
        shortMessage = `Couldn't find current ${new Date().getFullYear()} data for that match.`;
        detailedMessage = "This might mean the season hasn't started, or data isn't yet available. Please try a different query or check back later.";
      }
      else if (err.message?.includes("Match not found")) {
        shortMessage = "Couldn't find that specific match.";
        detailedMessage = "Try:\n• Adding a date (e.g., 'Lakers @ Celtics today')\n• Using full team names\n• Checking if the game is scheduled\n• Using @ for away team format";
      } else if (err.message?.includes("Invalid response")) {
        shortMessage = "The AI couldn't find enough data.";
        detailedMessage = "Try:\n• 'NBA games today'\n• 'NFL games this week'\n• A specific matchup with @ or vs\n• Example: 'Lakers @ Celtics' (Lakers away)";
      }
      
      setError({ short: shortMessage, detailed: detailedMessage });
    }

    setIsSearching(false);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto bg-red-500/10 border-red-500/50 text-red-400">
          <AlertDescription>
            Failed to load matches. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <FreeLookupBanner 
        lookupsRemaining={lookupsRemaining} 
        isAuthenticated={isAuthenticated}
        isPremium={isPremium}
        isVIP={isVIP}
      />
      <LimitedOfferBanner />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE2YzAgNi42MjctNS4zNzMgMTItMTIgMTJzLTEyLTUuMzczLTEyLTEyIDUuMzczLTEyIDEyLTEyIDEyIDUuMzczIDEyIDEyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo Badge */}
            <div className="mb-6 flex justify-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/f7ec915ef_image.png" 
                alt="SWH Sports Wager Helper" 
                className="h-20 sm:h-24 w-auto object-contain" 
              />
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Win More.<br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Bet Smarter.
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-slate-300 mb-6 leading-relaxed">
              AI-powered sports analytics with real-time stats from StatMuse, ESPN, and official league sources.
            </p>

            {/* Live Data Badge */}
            <div className="flex justify-center mb-8">
              <LiveDataBadge sources={["StatMuse", "ESPN", "Basketball-Reference"]} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-emerald-400">{matches?.length || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Matches</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-cyan-400">Live</div>
                <div className="text-xs text-slate-400 mt-1">Real-Time</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-purple-400">AI</div>
                <div className="text-xs text-slate-400 mt-1">Powered</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-pink-400">Free</div>
                <div className="text-xs text-slate-400 mt-1">To Try</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Today's Best Bets */}
        <TodaysBestBets 
          onLookupUsed={recordLookup}
          canLookup={canLookup}
          onLimitReached={() => setShowLimitModal(true)}
        />

        {/* Search Section */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Analyze Any Match</h2>
              <p className="text-slate-400">Get instant win probabilities and betting insights</p>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400">
            <AlertTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              {error.short}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDetailedError(!showDetailedError)} 
                className="ml-auto text-red-300 hover:bg-red-500/20 hover:text-red-200"
              >
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

        {/* Loading State */}
        {isSearching && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-20 animate-ping" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-75 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
                <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Match Data</h3>
              <p className="text-slate-400">{loadingMessage}</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isSearching && (
          <>
            {matches.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
                    Your Predictions
                    <span className="text-slate-500">({matches.length})</span>
                  </h2>
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                  {matches.map((match, index) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onDelete={deleteMutation.mutate}
                      index={index}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </>
        )}
      </div>

      {/* Updated Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-sm text-red-300 text-center">
            <strong className="font-bold text-lg">⚠️ IMPORTANT DISCLAIMER:</strong><br />
            Sports Wager Helper predictions are AI-generated estimates for entertainment purposes only. 
            We make no guarantees of accuracy. Past performance does not guarantee future results. 
            Gambling involves risk of financial loss. Only bet what you can afford to lose. 
            <br /><br />
            <strong>21+ ONLY</strong> • Problem gambling? Call <strong>1-800-GAMBLER</strong>
            <br />
            Not affiliated with any sportsbook or gambling operator.
          </p>
        </div>
      </div>
    </div>
  );
}
