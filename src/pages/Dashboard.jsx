
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Sparkles, Zap, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SearchBar from "../components/sports/SearchBar";
import MatchCard from "../components/sports/MatchCard";
import EmptyState from "../components/sports/EmptyState";
import TodaysBestBets from "../components/sports/TodaysBestBets";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import LimitedOfferBanner from "../components/auth/LimitedOfferBanner";
import LiveDataBadge from "../components/shared/LiveDataBadge"; // Added import

export default function Dashboard() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
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

  const handleSearch = async (query) => {
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a sports analytics AI with INTERNET ACCESS. You MUST use real-time data from the web.

SEARCH QUERY: "${query}"
TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏟️ CRITICAL: HOME vs AWAY TEAM RULES (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**THESE RULES ARE ABSOLUTE AND MUST BE FOLLOWED:**

📍 FORMAT "Team A @ Team B":
   - Team A = AWAY (traveling team)
   - Team B = HOME (playing at their stadium)
   - Example: "Lakers @ Celtics" → Lakers AWAY, Celtics HOME
   
📍 FORMAT "Team A vs Team B":
   - Team A = HOME (playing at their stadium)
   - Team B = AWAY (traveling team)
   - Example: "Chiefs vs Bills" → Chiefs HOME, Bills AWAY

🚨 VERIFICATION STEPS (DO NOT SKIP):
1. Check ESPN game page for location/venue
2. Verify which team's arena/stadium is hosting
3. Look for "at [Stadium Name]" in game details
4. Home team plays at THEIR OWN venue
5. Away team is TRAVELING to opponent's venue

❌ COMMON MISTAKES TO AVOID:
- DO NOT guess home/away randomly
- DO NOT swap home/away teams
- DO NOT use team names without verifying location
- DO NOT proceed without confirmation of venue

✅ EXAMPLES:
"Lakers @ Celtics" = Lakers (AWAY) at TD Garden, Celtics (HOME)
"Chiefs vs Bills" = Chiefs (HOME) at Arrowhead Stadium, Bills (AWAY)  
"Heat @ Warriors" = Heat (AWAY) at Chase Center, Warriors (HOME)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 MANDATORY DATA SOURCES (USE IN THIS ORDER):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⭐ StatMuse.com - PRIMARY SOURCE
   - Search: "${query} stats ${new Date().getFullYear()}"
   - Get: Current season records, PPG, recent form
   - VERIFY: Home/away designation from schedule
   
2. 🏀 Basketball-Reference.com (NBA/Basketball)
   - Team standings, player stats, game logs
   - URL: basketball-reference.com/teams/
   - CHECK: Game location and venue
   
3. 🏈 Pro-Football-Reference.com (NFL/Football)
   - Team records, player stats, game results
   - URL: pro-football-reference.com/teams/
   - VERIFY: Home/away from box scores

4. 📺 ESPN.com - CRITICAL FOR VENUE
   - Live schedules, injury reports, team pages
   - **VERIFY HOME/AWAY from game location**
   - URL: espn.com/nba/ or espn.com/nfl/
   - Look for venue name and "at [location]"

5. 🏟️ Official League Websites
   - NBA.com, NFL.com, PremierLeague.com
   - Verify team names and rosters
   - Confirm game location

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 STEP-BY-STEP VERIFICATION PROCESS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: PARSE THE QUERY FORMAT
- If contains "@" → Team before @ is AWAY, team after @ is HOME
- If contains "vs" → Team before vs is HOME, team after vs is AWAY
- If unclear → Search ESPN for game location

STEP 2: VERIFY ON ESPN
- Go to ESPN game page
- Find venue/location (e.g., "at Staples Center")
- Confirm which team owns that venue
- That team is HOME, other team is AWAY

STEP 3: DOUBLE CHECK RECORDS
Home Team (verified from venue):
  ✓ W-L record from Basketball-Reference or Pro-Football-Reference
  ✓ Points per game (season average)
  ✓ Last 5 games results (with dates)
  ✓ **Home record specifically** (e.g., 8-2 at home)

Away Team (verified as traveling):
  ✓ W-L record from same source
  ✓ Points per game (season average)
  ✓ Last 5 games results (with dates)
  ✓ **Away record specifically** (e.g., 5-5 on the road)

STEP 4: GET HEAD-TO-HEAD DATA
- Search: "[Home Team] vs [Away Team] ${new Date().getFullYear()}"
- Last 3-5 meetings
- Note which team was home in each game
- Who won and by how much

STEP 5: CHECK INJURIES (TODAY'S REPORT)
- Search: "[Team Name] injury report ${new Date().toLocaleDateString()}"
- Find official team injury list
- Impact on predictions

STEP 6: CALCULATE WIN PROBABILITIES
Based on:
  • Season records (35% weight)
  • Last 5 games form (20% weight)
  • Head-to-head history (15% weight)
  • **HOME COURT/FIELD ADVANTAGE (20% weight)** ← HOME TEAM GETS SIGNIFICANT BOOST
  • Key injuries (10% weight)

🏠 HOME ADVANTAGE:
- NBA: ~55-60% home win rate historically
- NFL: ~57-58% home win rate historically
- ADD 5-10 percentage points to home team's base probability
- Reduce away team's probability by same amount

MUST TOTAL 100%: Home + Away + Draw = 100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DATA VALIDATION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ REJECT if:
- Team names don't match official rosters
- Stats are from previous seasons
- No scheduled match found
- Win probabilities don't total 100%
- Using placeholder/fake data
- **HOME/AWAY DESIGNATION IS INCORRECT OR UNVERIFIED**

✅ ACCEPT only if:
- All stats from ${new Date().getFullYear()} season
- Team names verified on league website
- Match scheduled and confirmed
- Probabilities are realistic (5-95% range)
- **HOME TEAM CORRECTLY IDENTIFIED** (owns the venue)
- **AWAY TEAM CORRECTLY IDENTIFIED** (traveling)
- Venue/location explicitly stated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 REQUIRED OUTPUT FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MATCH IDENTIFICATION:
   - Sport (Basketball/Football/Soccer)
   - League (NBA/NFL/Premier League)
   - **home_team**: [FULL OFFICIAL NAME] - **MUST BE TEAM PLAYING AT THEIR VENUE**
   - **away_team**: [FULL OFFICIAL NAME] - **MUST BE TRAVELING TEAM**
   - Match date & time with timezone
   - **Location/venue** (e.g., "Staples Center, Los Angeles" or "Arrowhead Stadium, Kansas City")
   - Venue ownership confirmation (e.g., "Home venue for [Home Team]")

2. WIN PROBABILITIES (MUST TOTAL 100%):
   **Home Win: ___%** (include +5-10% home advantage boost)
   **Away Win: ___%** (reduced due to travel/away factor)
   Draw: ___% (0 if not applicable)

3. KEY FACTORS (5 specific points with STATS):
   ✓ "[Home Team] is 8-2 at home this season, averaging 118 PPG at home"
   ✓ "[Away Team] is 3-7 on the road, averaging 105 PPG away"
   ✓ "[Home Team] has won last 4 home games vs [Away Team]"
   ✓ "Home court advantage worth approximately 6 points in NBA"
   ✓ "[Home Team] star player healthy, [Away Team] missing key defender"

4. ANALYSIS SUMMARY (2-3 sentences with stats)
   **MUST MENTION**: Home court/field advantage explicitly
   Example: "The Lakers have significant home court advantage at Staples Center where they're 12-3 this season..."

5. CONFIDENCE LEVEL:
   - HIGH: >70% probability, strong home advantage + data
   - MEDIUM: 50-70%, competitive match
   - LOW: Insufficient data or unpredictable

6. KEY PLAYERS (3-4 per team):
   For EACH player:
   - Name (verified on current roster)
   - **Team designation: "[Player] (HOME - [Team])" or "[Player] (AWAY - [Team])"**
   - Position
   - ${new Date().getFullYear()} season averages (PPG/APG/RPG)
   - Predicted stats for THIS game
   - Recent form (Hot/Cold/Average)
   - Injury status from TODAY

7. BETTING MARKETS:
   Over/Under: Based on team averages
   Both Teams Score (if soccer)
   **First to Score**: Favor HOME team (60/40 split typically)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 FINAL CRITICAL REMINDERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Use StatMuse FIRST, always
• Verify EVERYTHING on official league sites
• Only ${new Date().getFullYear()} season data
• Real dates, real scores, real stats
• **VERIFY VENUE/LOCATION FROM ESPN OR TEAM SCHEDULE**
• **HOME TEAM = TEAM WHOSE VENUE IS HOSTING THE GAME**
• **AWAY TEAM = TEAM TRAVELING TO OPPONENT'S VENUE**
• **ADD HOME COURT/FIELD ADVANTAGE TO PROBABILITIES**
• If match not found: Say "Unable to locate scheduled match" in analysis_summary

RETURN: Valid JSON matching schema exactly. NO placeholder data. HOME/AWAY MUST BE CORRECT.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sport: { type: "string" },
            league: { type: "string" },
            home_team: { type: "string", description: "Team playing at their home stadium/arena - MUST BE VERIFIED" },
            away_team: { type: "string", description: "Team traveling/visiting - MUST BE VERIFIED" },
            venue: { type: "string", description: "Stadium/arena name and location" },
            match_date: { type: "string" },
            home_win_probability: { type: "number", description: "Includes home advantage boost" },
            away_win_probability: { type: "number" },
            draw_probability: { type: "number" },
            key_factors: {
              type: "array",
              items: { type: "string" }
            },
            analysis_summary: { type: "string", description: "Must mention home advantage" },
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
                  team: { type: "string", description: "Include (HOME) or (AWAY) designation" },
                  position: { type: "string" },
                  predicted_points: { type: "number" },
                  predicted_assists: { type: "number" },
                  predicted_rebounds: { type: "number" },
                  predicted_goals: { type: "number" },
                  probability_to_score: { type: "number" },
                  recent_form: { type: "string" },
                  injury_status: { type: "string" }
                }
              }
            },
            betting_markets: {
              type: "object",
              properties: {
                over_under: {
                  type: "object",
                  properties: {
                    line: { type: "number" },
                    over_probability: { type: "number" },
                    under_probability: { type: "number" }
                  }
                },
                both_teams_score: {
                  type: "object",
                  properties: {
                    yes_probability: { type: "number" },
                    no_probability: { type: "number" }
                  }
                },
                total_goals_range: {
                  type: "object",
                  properties: {
                    predicted_total: { type: "number" },
                    range: { type: "string" }
                  }
                },
                first_to_score: {
                  type: "object",
                  properties: {
                    home_probability: { type: "number", description: "Should be 55-65% typically" },
                    away_probability: { type: "number", description: "Should be 35-45% typically" }
                  }
                }
              }
            }
          },
          required: ["sport", "home_team", "away_team", "venue", "home_win_probability", "away_win_probability", "analysis_summary"]
        }
      });

      console.log("✅ Match Analysis Result:", result);

      if (!result || !result.sport || !result.home_team || !result.away_team || !result.venue) {
        throw new Error("Invalid response - missing required match data (home/away/venue)");
      }

      if (result.analysis_summary?.includes("Unable to")) {
        throw new Error("Match not found - try a different date or check team names");
      }

      await base44.entities.Match.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      
    } catch (err) {
      console.error("❌ Match Analysis Error:", err);
      let errorMessage = "Failed to analyze the match. ";
      
      if (err.message?.includes("Match not found")) {
        errorMessage += "Couldn't find that specific match. Try:\n• Adding a date (e.g., 'Lakers @ Celtics today')\n• Using full team names\n• Checking if the game is scheduled\n• Using @ for away team (Lakers @ Celtics = Lakers away)";
      } else if (err.message?.includes("Invalid response")) {
        errorMessage += "The AI couldn't find enough data. Try:\n• 'NBA games today'\n• 'Premier League matches this weekend'\n• A specific team matchup with @ or vs\n• Example: 'Chiefs vs Bills' (Chiefs home) or 'Lakers @ Celtics' (Lakers away)";
      } else {
        errorMessage += "Please try:\n• Using official team names (e.g., 'Los Angeles Lakers')\n• Adding 'today' or 'tonight'\n• Using @ to indicate away team (Team A @ Team B = Team A is away)\n• Being more specific about the league";
      }
      
      setError(errorMessage);
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
            <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
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
              <p className="text-slate-400">Fetching live stats from StatMuse & ESPN...</p>
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
