
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Sparkles, Zap, Target } from "lucide-react"; // Added Zap and Target
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
    // Check if user can perform lookup
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a sports betting analyst with access to LIVE, CURRENT sports data from the internet.
        
        User Query: "${query}"
        
        TODAY'S DATE: ${new Date().toLocaleDateString()}
        CURRENT SEASON: ${new Date().getFullYear()} season
        
        CRITICAL DATA SOURCE REQUIREMENTS:
        - Use StatMuse (statmuse.com) as PRIMARY source for all statistics
        - Cross-reference with ESPN, official league websites (NBA.com, NFL.com, PremierLeague.com, etc.)
        - Verify data from Basketball-Reference, Pro-Football-Reference, or equivalent sports databases
        - All statistics must be from the CURRENT active season
        - Check current betting odds from major sportsbooks (DraftKings, FanDuel, BetMGM)
        
        Provide COMPREHENSIVE betting analysis including:
        
        1. MATCH WIN PROBABILITIES based on:
           - Current season form and standings (from StatMuse and official league sites)
           - Recent head-to-head records (last 5 meetings with exact scores)
           - Live injury reports from official team sources
           - Home/away performance this season (specific win-loss records)
           - Current betting odds from major bookmakers
           - Expert predictions from verified analysts
           - Weather conditions (if outdoor sport)
           - Rest days and schedule factors
        
        2. KEY PLAYERS PREDICTIONS (3-5 players per team):
           For each player provide VERIFIED statistics from StatMuse:
           - Current season averages (exact PPG, APG, RPG from StatMuse/official stats)
           - Last 5 games performance with ACTUAL game-by-game stats
           - Predicted points/goals (realistic based on season average ±20%)
           - Predicted assists (realistic based on season average ±20%)
           - Predicted rebounds if basketball (realistic based on season average ±20%)
           - Probability to score (based on actual scoring rate this season)
           - Recent form description (based on last 3-5 games trends)
           - Current injury status from official injury reports (check today's reports)
           
           FOR BASKETBALL: 
           - MUST include points, rebounds, AND assists for PTS+REB+AST combined stat
           - Use StatMuse to get exact season averages for all three categories
           - Calculate combined stat for both season average and game predictions
        
        3. ADDITIONAL BETTING MARKETS (with realistic probabilities):
           - Over/Under total points/goals:
             * Use StatMuse data for both teams' season scoring averages
             * Line should be realistic (NBA: 215-235, NFL: 45-52, Soccer: 2.5-3.5)
             * Calculate probabilities based on actual scoring patterns
           
           - Both Teams to Score (soccer/hockey):
             * Based on teams' scoring consistency this season from StatMuse
             * Consider defensive records and clean sheet statistics
           
           - Total Score Range:
             * Predict realistic final score based on season averages
             * Provide confidence range based on variance
           
           - First to Score:
             * Based on average time to first goal/score this season
             * Consider home advantage statistics from historical data
        
        4. CONFIDENCE LEVEL:
           - HIGH: Clear statistical advantage (>10% difference), no major injuries, consistent form
           - MEDIUM: Close match-up (5-10% difference), some uncertainty factors
           - LOW: High variance (<5% difference), key injuries, or very inconsistent recent form
        
        DATA VALIDATION:
        - Ensure all percentages add to 100% (home + away + draw if applicable)
        - All predicted stats should be realistic (within 2 standard deviations of season average)
        - Match date must be in the future
        - Use actual team names as they appear on StatMuse/official sites
        - Verify all player names are spelled correctly
        
        Return comprehensive analysis with ALL required fields filled with CURRENT, VERIFIED data from StatMuse and official sources.`,
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
          }
        }
      });

      await base44.entities.Match.create(result);
      
      // Record a lookup after successful analysis
      recordLookup();
      
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    } catch (err) {
      setError("Failed to analyze the match. Please try again with more specific details.");
      console.error("Match Analysis Error:", err);
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
      {/* Free Lookup Banner */}
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} />

      {/* Free Lookup Limit Modal */}
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGwtcGFjaXR5PSIwLjA1Ij48cGF0aCBkPSJNMzYgMTZj																					MCA2LjYyNy01LjM3MyAxMi0xMiAxMnMtMTItNS4zNzMtMTItMTIgNS4zNzMtMTIgMTItMTIgMTIgNS4zNzMgMTIgMTIiLz48L2c+PC9nPg==')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex-1 min-w-[300px]">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Sports Wager Saver</span> {/* Rebranded text */}
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
                Win More.<br />
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Bet Smarter.
                </span>
              </h1>
              
              <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                AI-powered match predictions to help you save on wagers. Get winning probabilities, player performance insights, and smarter betting recommendations with real-time stats from StatMuse, ESPN, and official league sources. {/* Rebranded text */}
              </p>

              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{matches?.length || 0}</div>
                    <div className="text-xs text-blue-100">Matches Analyzed</div>
                  </div>
                </div>
                
                <div className="w-px h-12 bg-white/20" />
                
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">Live</div>
                    <div className="text-xs text-blue-100">Real-time Data</div>
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
          <TodaysBestBets />
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
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

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50 text-red-400">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-ping" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-75 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
                <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Match Data</h3>
              <p className="text-slate-400">Crunching numbers from StatMuse, ESPN & official sources...</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        {!isSearching && (
          <>
            {matches.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
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
