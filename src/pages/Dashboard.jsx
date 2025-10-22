import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SearchBar from "../components/sports/SearchBar";
import MatchCard from "../components/sports/MatchCard";
import EmptyState from "../components/sports/EmptyState";

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
        prompt: `Analyze this sports match request: "${query}"
        
        Find the upcoming match details and provide COMPREHENSIVE betting analysis including:
        
        1. MATCH WIN PROBABILITIES based on:
           - Recent team performance and form
           - Head-to-head records
           - Player injuries and suspensions
           - Home/away advantage
           - Current league standings
           - Expert predictions and betting odds
        
        2. KEY PLAYERS PREDICTIONS:
           - Identify 3-5 key players from both teams
           - For each player provide:
             * Predicted points/goals (based on sport)
             * Predicted assists
             * Predicted rebounds (if basketball)
             * Probability to score (percentage)
             * Recent form (e.g., "Excellent", "Good", "Average")
             * Injury status (e.g., "Healthy", "Questionable", "Doubtful")
        
        3. ADDITIONAL BETTING MARKETS:
           - Over/Under total points/goals with probabilities
           - Both teams to score probabilities
           - Predicted total score range
           - First to score probabilities
        
        Be specific about teams, date, league, and provide realistic statistical predictions.
        All probabilities should be based on current form, statistics, and expert analysis.`,
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
            <h1 className="text-4xl font-bold">Sports Betting Analyzer</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Get data-driven predictions for match outcomes, player performance, and multiple betting markets using real-time statistics
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
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