
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SearchBar from "../components/sports/SearchBar";
import MatchCard from "../components/sports/MatchCard";
import EmptyState from "../components/sports/EmptyState";
import TodaysBestBets from "../components/sports/TodaysBestBets"; // New import

export default function Dashboard() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => base44.entities.Match.list('-created_date'),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });

  const handleSearch = async (query) => {
    setIsSearching(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a sports betting analyst with access to LIVE, CURRENT sports data from the internet.
        
        User Query: "${query}"
        
        CRITICAL INSTRUCTIONS:
        - Use ONLY the most recent, up-to-date data from TODAY (${new Date().toLocaleDateString()})
        - Source data from official league websites, ESPN, official team stats, and verified sports data providers
        - All statistics must be from the CURRENT ${new Date().getFullYear()} season
        - Verify match is actually scheduled and upcoming
        
        Provide COMPREHENSIVE betting analysis including:
        
        1. MATCH WIN PROBABILITIES based on:
           - Current season form and standings
           - Recent head-to-head records (last 5 meetings)
           - Live injury reports from official sources
           - Home/away performance this season
           - Current betting odds from major bookmakers
           - Expert predictions from verified analysts
           - Weather conditions (if outdoor sport)
        
        2. KEY PLAYERS PREDICTIONS (3-5 players per team):
           For each player provide:
           - Current season averages (from official league stats)
           - Last 5 games performance with ACTUAL stats
           - Predicted points/goals (realistic based on season average ±20%)
           - Predicted assists (realistic based on season average ±20%)
           - Predicted rebounds if basketball (realistic based on season average ±20%)
           - Probability to score (based on scoring rate this season)
           - Recent form description (based on last 3-5 games)
           - Current injury status from official injury reports
           
           FOR BASKETBALL: Always include points, rebounds, and assists for PTS+REB+AST combined stat
        
        3. ADDITIONAL BETTING MARKETS (with realistic probabilities):
           - Over/Under total points/goals:
             * Use average of both teams' season scoring
             * Line should be realistic (e.g., NBA: 215-235, Soccer: 2.5-3.5)
             * Calculate probabilities based on actual scoring patterns
           
           - Both Teams to Score (soccer/hockey):
             * Based on teams' scoring consistency this season
             * Consider defensive records
           
           - Total Score Range:
             * Predict realistic final score based on season averages
             * Provide confidence range
           
           - First to Score:
             * Based on average time to first goal/score this season
             * Consider home advantage statistics
        
        4. CONFIDENCE LEVEL:
           - HIGH: Clear statistical advantage, no major injuries, consistent form
           - MEDIUM: Close match-up, some uncertainty factors
           - LOW: High variance, key injuries, or inconsistent recent form
        
        VALIDATION:
        - Ensure all percentages add to 100% (home + away + draw if applicable)
        - All predicted stats should be realistic (within 2 standard deviations of season average)
        - Match date must be in the future
        - Use actual team names, not abbreviations
        
        Return comprehensive analysis with ALL required fields filled with CURRENT, VERIFIED data.`,
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
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    } catch (err) {
      setError("Failed to analyze the match. Please try again with more specific details.");
      console.error(err);
    }

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Trophy className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold">Sports Wager Helper</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Get data-driven predictions for match outcomes, player performance, and multiple betting markets using real-time statistics
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Today's Best Bets Section */}
        <div className="mb-8">
          <TodaysBestBets />
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Analyzing match data and player statistics...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds</p>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        {!isSearching && (
          <>
            {matches.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Analyzed Matches ({matches.length})
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
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

      {/* Footer Info */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> These probabilities and player predictions are for informational purposes only and based on available data at the time of analysis. 
            Actual outcomes may vary. Always gamble responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}
