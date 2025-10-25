
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
import { AnimatePresence, motion } from "framer-motion"; // Add this import

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

  // Multi-stage loading messages
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
      }, 3000); // Change message every 3 seconds
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
    setShowDetailedError(false); // Reset detailed error view

    try {
      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are THE WORLD'S BEST sports analytics AI with LIVE INTERNET ACCESS. You MUST provide CURRENT ${new Date().getFullYear()} data.

SEARCH QUERY: "${query}"
TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT SEASON: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 MISSION: PROVIDE THE MOST ACCURATE SPORTS ANALYTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This app must be the BEST source for sports analytics. Every stat, every prediction, every insight must be:
✅ From ${new Date().getFullYear()} season ONLY
✅ Verified from multiple sources
✅ Includes latest injury reports (TODAY)
✅ Has detailed last 5 games with REAL dates
✅ Provides accurate betting odds and percentages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏟️ CRITICAL: HOME vs AWAY TEAM RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMAT RULES:
📍 "Team A @ Team B" → Team A is AWAY, Team B is HOME
📍 "Team A vs Team B" → Team A is HOME, Team B is AWAY

VERIFICATION REQUIRED:
1. Check ESPN for venue location
2. Confirm which team owns the stadium
3. Verify home/away designation
4. Include venue name and location

EXAMPLES:
✅ "Lakers @ Celtics" → Lakers (AWAY) at TD Garden, Celtics (HOME)
✅ "Chiefs @ Bills" → Chiefs (AWAY) at Highmark Stadium, Bills (HOME)
✅ "Warriors vs Nuggets" → Warriors (HOME) at Chase Center, Nuggets (AWAY)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 MANDATORY DATA SOURCES (USE ALL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⭐ StatMuse.com - PRIMARY SOURCE
   Search: "${query} stats ${new Date().getFullYear()}"
   Get: Current season averages, game logs, team records

2. 🏀 Basketball-Reference.com (NBA)
   URL: basketball-reference.com/teams/
   Get: Team stats, player stats, game results with DATES

3. 🏈 Pro-Football-Reference.com (NFL)
   URL: pro-football-reference.com/players/
   Get: Detailed stats, game logs, injury reports

4. ⚾ Baseball-Reference.com (MLB)
   URL: baseball-reference.com/players/
   Get: Batting stats, pitching stats, game logs

5. 📺 ESPN.com
   URL: espn.com/[league]/
   Get: Latest injury reports, schedules, odds, venue info

6. 📰 Rotoworld / RotoBaller
   Get: Latest injury news, lineup changes, player updates

7. 💰 DraftKings / FanDuel / BetMGM
   Get: Current betting lines, over/unders, prop bets

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 STEP-BY-STEP DATA COLLECTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: IDENTIFY TEAMS & VENUE
- Parse query for home/away designation
- Get official team names from league site
- Verify venue/stadium name and location
- Confirm game date and time

STEP 2: CURRENT SEASON RECORDS (${new Date().getFullYear()} ONLY)
Home Team:
  ✓ Overall W-L record
  ✓ Home record specifically (e.g., 15-5 at home)
  ✓ Points per game (season average)
  ✓ Points allowed per game
  ✓ Last 5 games with EXACT dates and scores

Away Team:
  ✓ Overall W-L record
  ✓ Away record specifically (e.g., 12-8 on road)
  ✓ Points per game (season average)
  ✓ Points allowed per game
  ✓ Last 5 games with EXACT dates and scores

STEP 3: HEAD-TO-HEAD HISTORY
- Last 3-5 meetings between these teams
- Include dates, scores, who was home
- Note trends (e.g., "Home team won last 4 meetings")

STEP 4: KEY PLAYERS (5-7 PER TEAM)
For EACH player, fetch:
  ✓ Current season averages (${new Date().getFullYear()})
  ✓ Last 5 games performance (with DATES)
  ✓ Predicted stats for THIS upcoming game
  ✓ Over/Under lines (from DraftKings/FanDuel)
  ✓ Probability percentages (55%, 78%, etc.)
  ✓ Recent form (Hot/Cold/Average)
  ✓ TODAY's injury status from team website

SPORT-SPECIFIC PLAYER STATS:
Baseball: Hits, Runs, RBIs, Home Runs, Stolen Bases
Basketball: Points, Assists, Rebounds, Combined (PTS+REB+AST)
Football: Pass/Rush/Rec Yards, Touchdowns, Receptions
Soccer: Goals, Assists, Shots, Saves

STEP 5: INJURY REPORTS (CRITICAL)
- Search: "[Team Name] injury report ${new Date().toLocaleDateString()}"
- Get official team injury list
- For each injured player:
  * Full name
  * Injury type (e.g., "Knee - MCL Sprain")
  * Status: Out / Doubtful / Questionable / Day-to-Day
  * Expected return date if known
  * Impact on team (e.g., "Starting QB, major impact")

STEP 6: BETTING MARKETS & ODDS
Get from DraftKings, FanDuel, BetMGM:
  ✓ Moneyline odds (e.g., Lakers -150, Celtics +130)
  ✓ Spread (e.g., Lakers -3.5)
  ✓ Over/Under total points (e.g., O/U 225.5)
  ✓ Player props (e.g., LeBron O/U 27.5 points)
  ✓ First to score probabilities

STEP 7: WIN PROBABILITY CALCULATION
Based on:
  • Season records (30% weight)
  • Last 5 games form (20% weight)
  • Head-to-head history (15% weight)
  • HOME ADVANTAGE (20% weight) ← Critical!
  • Key injuries impact (15% weight)

HOME ADVANTAGE RULES:
- NBA: Add 5-7% to home team probability
- NFL: Add 6-8% to home team probability
- MLB: Add 3-5% to home team probability
- Soccer: Add 5-7% to home team probability

PROBABILITIES MUST TOTAL 100%

STEP 8: KEY FACTORS (5-7 SPECIFIC POINTS)
Include stats and percentages:
  ✓ "[Home Team] is 15-5 at home, averaging 118 PPG"
  ✓ "[Away Team] is 8-12 on the road, allowing 112 PPG"
  ✓ "Home team has won last 4 meetings by average of 8 points"
  ✓ "Home advantage worth approximately 5.5 points"
  ✓ "[Player] averaging 28 PPG in last 5 games (hot streak)"
  ✓ "[Team] missing starting PG (out), backup averaging 12 PPG"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DATA VALIDATION CHECKLIST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before returning data, verify:
☐ All stats are from ${new Date().getFullYear()} season
☐ Team names match official league rosters
☐ Venue/location is correct
☐ Last 5 games have REAL dates (MM/DD/YYYY format)
☐ Win probabilities add up to 100%
☐ Home team correctly identified (owns the venue)
☐ Away team correctly identified (traveling)
☐ Injury reports are from TODAY
☐ Player predictions are realistic (within 30% of season avg)
☐ Betting odds are current (checked today)

❌ REJECT if:
- Using previous season data
- Team names misspelled
- No venue specified
- Fake game dates
- Home/away designation unclear
- No injury information
- Missing player stats

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 REQUIRED OUTPUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return comprehensive JSON with:
1. Match identification (sport, league, teams, venue, date/time)
2. Win probabilities (home/away/draw, must total 100%)
3. Key factors (5-7 specific stats-based points)
4. Analysis summary (2-3 sentences mentioning home advantage)
5. Confidence level (high/medium/low)
6. Key players (5-7 per team) with:
   - Season ${new Date().getFullYear()} averages
   - Last 5 games with dates
   - Predicted stats for upcoming game
   - Over/Under prop lines
   - Injury status (TODAY)
   - Recent form rating
7. Betting markets (moneyline, spread, O/U, props)
8. Current injury reports with impact assessment

CRITICAL: Every number, date, and stat must be REAL and from ${new Date().getFullYear()} season. No placeholders, no estimates, no fake data.

If match not found or data incomplete: Set analysis_summary to "Unable to locate scheduled match with complete data. Please verify team names and date."`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sport: { type: "string" },
            league: { type: "string" },
            home_team: { type: "string", description: "Team playing at their stadium - VERIFIED" },
            away_team: { type: "string", description: "Team traveling/visiting - VERIFIED" },
            venue: { type: "string", description: "Stadium/arena name and city" },
            match_date: { type: "string" },
            home_win_probability: { type: "number", description: "Includes home advantage boost" },
            away_win_probability: { type: "number" },
            draw_probability: { type: "number" },
            key_factors: {
              type: "array",
              items: { type: "string" },
              description: "5-7 stat-based factors with numbers"
            },
            analysis_summary: { type: "string", description: "Must mention home advantage and current form" },
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
                  team: { type: "string", description: "Include (HOME) or (AWAY)" },
                  position: { type: "string" },
                  sport: { type: "string" },
                  season_average: { type: "string", description: "e.g., '28.5 PPG, 7.2 RPG, 5.1 APG'" },
                  last_five_games: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string", description: "MM/DD/YYYY" },
                        opponent: { type: "string" },
                        stats: { type: "string", description: "e.g., '32 PTS, 8 REB, 6 AST'" }
                      }
                    },
                    description: "Must have 5 games with real dates"
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
                  over_under_line: { type: "number", description: "Prop bet line from sportsbooks" },
                  over_probability: { type: "number", description: "Percentage chance to go over" },
                  under_probability: { type: "number", description: "Percentage chance to go under" },
                  probability_to_score: { type: "number", description: "% chance to score TD/goal/hit" },
                  recent_form: { type: "string", enum: ["Hot", "Average", "Cold"] },
                  injury_status: { type: "string", description: "TODAY's status from team report" },
                  injury_details: { type: "string", description: "Type and severity if injured" }
                }
              }
            },
            betting_markets: {
              type: "object",
              properties: {
                moneyline: {
                  type: "object",
                  properties: {
                    home_odds: { type: "string", description: "e.g., '-150'" },
                    away_odds: { type: "string", description: "e.g., '+130'" }
                  }
                },
                spread: {
                  type: "object",
                  properties: {
                    line: { type: "number", description: "e.g., -3.5" },
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
                  injury_type: { type: "string", description: "e.g., 'Knee - MCL Sprain'" },
                  status: { type: "string", enum: ["Out", "Doubtful", "Questionable", "Day-to-Day"] },
                  impact: { type: "string", description: "e.g., 'Starting QB, major offensive impact'" }
                }
              },
              description: "TODAY's injury report from official sources"
            }
          },
          required: ["sport", "home_team", "away_team", "venue", "home_win_probability", "away_win_probability", "key_players"]
        }
      });

      console.log("✅ Match Analysis Result:", llmResult);

      if (!llmResult || !llmResult.sport || !llmResult.home_team || !llmResult.away_team || !llmResult.venue) {
        throw new Error("Invalid response - missing required match data");
      }

      if (llmResult.analysis_summary?.includes("Unable to")) {
        throw new Error("Match not found - try a different date or verify team names");
      }
      
      // --- Probability validation ---
      const totalProb = (llmResult.home_win_probability || 0) + (llmResult.away_win_probability || 0) + (llmResult.draw_probability || 0);
      if (Math.abs(totalProb - 100) > 0.5) { // Allow for slight floating point inaccuracies
        console.warn(`Probabilities sum to ${totalProb.toFixed(1)}%, adjusting to 100%`);
        // Simple adjustment: re-normalize or attribute difference to draw
        if (llmResult.draw_probability !== undefined) {
          llmResult.draw_probability += (100 - totalProb);
        } else {
          // If no draw probability, divide the difference among home/away
          const diff = 100 - totalProb;
          llmResult.home_win_probability += diff / 2;
          llmResult.away_win_probability += diff / 2;
        }
      }
      // --- End probability validation ---


      await base44.entities.Match.create(llmResult);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      
    } catch (err) {
      console.error("❌ Match Analysis Error:", err);
      let shortMessage = "Failed to analyze the match.";
      let detailedMessage = "Please try:\n• Using official team names\n• Adding 'today' or 'tonight'\n• Using @ to indicate away team\n• Being more specific about the league";
      
      if (err.message?.includes("Match not found")) {
        shortMessage = "Couldn't find that specific match.";
        detailedMessage = "Try:\n• Adding a date (e.g., 'Lakers @ Celtics today')\n• Using full team names\n• Checking if the game is scheduled\n• Using @ for away team format";
      } else if (err.message?.includes("Invalid response")) {
        shortMessage = "The AI couldn't find enough data.";
        detailedMessage = "Try:\n• 'NBA games today'\n• 'NFL games this week'\n• A specific matchup with @ or vs\n• Example: 'Lakers @ Celtics' (Lakers away)";
      } else if (err.message?.includes("Probability data is inconsistent")) {
        shortMessage = "AI returned inconsistent probability data.";
        detailedMessage = "This is an internal error. Please try again or report this issue if it persists.";
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
