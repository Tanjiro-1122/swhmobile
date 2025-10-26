import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Sparkles, Zap, Target, Crown, Clock, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchBar from "../components/sports/SearchBar";
import MatchCard from "../components/sports/MatchCard";
import EmptyState from "../components/sports/EmptyState";
import TodaysBestBets from "../components/sports/TodaysBestBets";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showVipPromo, setShowVipPromo] = useState(true);
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
    setShowVipPromo(false);
    
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

CRITICAL: You have internet access via the add_context_from_internet parameter. You MUST:
1. Search StatMuse.com for current ${new Date().getFullYear()} season statistics
2. Check ESPN.com for match schedules and team records
3. Verify data from official league websites (NBA.com, NFL.com, PremierLeague.com)
4. Use Basketball-Reference.com or Pro-Football-Reference.com for detailed stats

TASK: Find the specific match the user is asking about and provide:

1. MATCH IDENTIFICATION:
   - Sport (Basketball/Soccer/Football/etc)
   - League (NBA/Premier League/NFL/etc)
   - Home team (use OFFICIAL full name from league website)
   - Away team (use OFFICIAL full name from league website)
   - Match date/time (search for scheduled date - could be today, tomorrow, or this week)

2. WIN PROBABILITIES (must total 100%):
   Home Win: Calculate based on:
   - Current season records (W-L from official stats)
   - Last 5 games results for both teams
   - Head-to-head history (last 3-5 meetings)
   - Home court/field advantage (home team win % at home)
   - Current injuries (search "[team name] injury report")
   
   Away Win: Calculate similarly
   Draw: If applicable (soccer/hockey), otherwise 0

3. KEY FACTORS (4-5 specific points with stats):
   Example format:
   - "Home team won 8 of last 10 games (80% win rate)"
   - "Away team averaging 115 PPG vs opponent allowing 108 PPG"
   - "Home team's star player out with injury"
   - "Away team 2-6 on the road this season"

4. ANALYSIS SUMMARY (2-3 sentences):
   Explain your prediction based on the statistics you found

5. CONFIDENCE LEVEL:
   - "high" if data strongly supports one outcome (>70% probability)
   - "medium" if competitive match (50-70%)
   - "low" if insufficient data or unpredictable

6. KEY PLAYERS (3-4 per team):
   For EACH player provide:
   - Name (verify they're on current roster via team website)
   - Team and position
   - Season averages (PPG/APG/RPG from StatMuse or Basketball-Reference)
   - Predicted stats for THIS game (within ±30% of season average)
   - Recent form: "Hot" if averaging above normal last 3 games, "Cold" if below
   - Injury status: Check today's injury report

7. BETTING MARKETS:
   Over/Under:
   - Line: Average both teams' season PPG
   - Probabilities: 50/50 split or adjust based on pace
   
   Both Teams Score (if soccer): Based on scoring rates
   First to Score: Slight favor to home team (55/45)

VALIDATION RULES:
- Team names must match official league rosters
- All statistics must be from ${new Date().getFullYear()} season
- Win probabilities must be realistic (no team should have >95% or <5%)
- If you can't find the match, say "Unable to find scheduled match" in analysis_summary

FORMAT: Return valid JSON matching the schema exactly. No placeholder data.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sport: { type: "string" },
            league: { type: "string" },
            home_team: { type: "string" },
            away_team: { type: "string" },
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
                    home_probability: { type: "number" },
                    away_probability: { type: "number" }
                  }
                }
              }
            }
          },
          required: ["sport", "home_team", "away_team", "home_win_probability", "away_win_probability", "analysis_summary"]
        }
      });

      console.log("✅ Match Analysis Result:", result);

      if (!result || !result.sport || !result.home_team || !result.away_team) {
        throw new Error("Invalid response - missing required match data");
      }

      if (result.analysis_summary?.includes("Unable to find")) {
        throw new Error("Match not found - try a different date or check team names");
      }

      await base44.entities.Match.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      
    } catch (err) {
      console.error("❌ Match Analysis Error:", err);
      let errorMessage = "Failed to analyze the match. ";
      
      if (err.message?.includes("Match not found")) {
        errorMessage += "Couldn't find that specific match. Try:\n• Adding a date (e.g., 'Lakers vs Celtics today')\n• Using full team names\n• Checking if the game is scheduled";
      } else if (err.message?.includes("Invalid response")) {
        errorMessage += "The AI couldn't find enough data. Try:\n• 'NBA games today'\n• 'Premier League matches this weekend'\n• A specific team matchup";
      } else {
        errorMessage += "Please try:\n• Using official team names (e.g., 'Los Angeles Lakers')\n• Adding 'today' or 'tonight'\n• Being more specific about the league";
      }
      
      setError(errorMessage);
    }

    setIsSearching(false);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-600 p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto bg-red-500/10 border-red-500/50 text-red-400">
          <AlertDescription>
            Failed to load matches. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-600">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      {/* VIP Promotional Section */}
      {showVipPromo && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* VIP Header Banner */}
            <div className="bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 rounded-3xl p-6 border-4 border-white shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-12 h-12 text-yellow-600" />
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900">VIP LIFETIME MEMBER -</h1>
                    <p className="text-xl md:text-2xl font-bold text-slate-800">Unlimited Access Forever</p>
                  </div>
                </div>
                <Crown className="w-12 h-12 text-yellow-600" />
              </div>
            </div>

            {/* VIP Member Status */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-3xl p-6 border-4 border-white shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-white" />
                <span className="text-2xl md:text-3xl font-black text-white">🎉 You're VIP Lifetime Member #4!</span>
              </div>
            </motion.div>

            {/* Countdown Badges */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-lg px-8 py-3 rounded-2xl shadow-xl animate-pulse">
                🔥 LIMITED TIME OFFER
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg px-8 py-3 rounded-2xl shadow-xl">
                <Clock className="w-5 h-5 mr-2" />
                ENDING SOON
              </Badge>
            </div>

            {/* Spots Counter */}
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl py-4 px-8 border-4 border-white shadow-2xl">
              <p className="text-3xl font-black text-white text-center">14 SPOTS LEFT!</p>
            </div>

            {/* Main Headline */}
            <div className="text-center py-6">
              <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-4">
                🎊 First 20 Users Get LIFETIME
              </h2>
              <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
                Unlimited Access!
              </h2>
              <p className="text-xl md:text-2xl text-white font-bold mt-6">
                You already have lifetime access! Share this offer with friends before spots run out.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-gradient-to-br from-yellow-200 to-orange-200 rounded-3xl p-8 border-4 border-yellow-300 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-slate-700" />
                  <span className="text-xl font-bold text-slate-900">VIP Spots Claimed</span>
                </div>
                <span className="text-5xl font-black text-slate-900">6/20</span>
              </div>
              
              <div className="w-full bg-white/50 rounded-full h-8 mb-4 overflow-hidden border-2 border-slate-300">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '30%' }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full"
                />
              </div>

              <div className="flex justify-between text-slate-700 font-bold">
                <span>⚡ 6 claimed</span>
                <span>14 remaining</span>
              </div>
            </div>

            {/* Final Warning */}
            <div className="bg-gradient-to-r from-orange-400 to-red-400 rounded-3xl p-6 border-4 border-white shadow-2xl">
              <p className="text-xl md:text-2xl font-black text-white text-center">
                ⏰ Only 14 lifetime spots remaining! Once claimed, this offer disappears forever!
              </p>
            </div>

            {/* Get Started Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setShowVipPromo(false)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-2xl py-8 rounded-3xl shadow-2xl font-black"
              >
                <Trophy className="w-8 h-8 mr-3" />
                START ANALYZING MATCHES
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Main Content - Only show when VIP promo is dismissed */}
      {!showVipPromo && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Today's Best Bets Section */}
          <div className="mb-12">
            <TodaysBestBets 
              onLookupUsed={recordLookup}
              canLookup={canLookup}
              onLimitReached={() => setShowLimitModal(true)}
            />
          </div>

          {/* Search Section */}
          <div className="mb-12">
            <div className="bg-white/90 backdrop-blur-xl border-4 border-white rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Analyze Any Match</h2>
                  <p className="text-slate-600">Get instant win probabilities and betting insights</p>
                </div>
              </div>
              <SearchBar onSearch={handleSearch} isSearching={isSearching} />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50 text-red-400">
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-20 animate-ping" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-75 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analyzing Match Data</h3>
                <p className="text-white/80">Fetching live stats from StatMuse & ESPN...</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {!isSearching && (
            <>
              {matches.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                      <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
                      Your Match Predictions
                      <span className="text-white/70">({matches.length})</span>
                    </h2>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-8">
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
      )}

      {/* Footer Disclaimer */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-2xl p-6">
          <p className="text-sm text-white">
            <strong className="font-bold">⚠️ Responsible Gambling:</strong> These predictions are for informational purposes only. 
            Always gamble responsibly and never bet more than you can afford to lose. Statistics are sourced from StatMuse, ESPN, and official league data.
          </p>
        </div>
      </div>
    </div>
  );
}