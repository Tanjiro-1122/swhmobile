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

export default function Dashboard() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgNi42MjctNS4zNzMgMTItMTIgMTJzLTEyLTUuMzczLTEyLTEyIDUuMzczLTEyIDEyLTEyIDEyIDUuMzczIDEyIDEyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex-1 min-w-[300px]">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Live AI Analysis</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
                Win More.<br />
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Bet Smarter.
                </span>
              </h1>
              
              <p className="text-xl text-emerald-100 max-w-2xl leading-relaxed mb-6">
                AI-powered sports analytics with real-time stats from StatMuse, ESPN, and official league sources. Get match predictions, player insights, and team analysis.
              </p>

              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{matches?.length || 0}</div>
                    <div className="text-xs text-emerald-100">Matches Analyzed</div>
                  </div>
                </div>
                
                <div className="w-px h-12 bg-white/20" />
                
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">Live</div>
                    <div className="text-xs text-emerald-100">Real-time Data</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="w-64 h-64 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl opacity-20 blur-3xl" />
                <div className="relative w-full h-full bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center">
                  <Trophy className="w-32 h-32 text-white opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Analyze Any Match</h2>
                <p className="text-slate-400">Get instant win probabilities and betting insights</p>
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

        {!isSearching && (
          <>
            {matches.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
                    Your Match Predictions
                    <span className="text-slate-500">({matches.length})</span>
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

      {/* Footer Disclaimer */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-sm text-amber-400">
            <strong className="font-bold">⚠️ Responsible Gambling:</strong> These predictions are for informational purposes only. 
            Always gamble responsibly and never bet more than you can afford to lose. Statistics are sourced from StatMuse, ESPN, and official league data.
          </p>
        </div>
      </div>
    </div>
  );
}