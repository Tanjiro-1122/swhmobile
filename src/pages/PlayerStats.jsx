
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import EmptyPlayerState from "../components/player/EmptyPlayerState";

export default function PlayerStats() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.PlayerStats.list('-created_date'),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerStats.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const handleSearch = async (query) => {
    setIsSearching(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports statistics analyst with access to LIVE, OFFICIAL sports data.
        
        Player Query: "${query}"
        
        TODAY'S DATE: ${new Date().toLocaleDateString()}
        CURRENT SEASON: ${new Date().getFullYear()} season
        
        CRITICAL DATA SOURCE REQUIREMENTS:
        - Use StatMuse (statmuse.com) as PRIMARY source for all player statistics
        - Cross-reference with official league statistics (NBA.com, NFL.com, PremierLeague.com, etc.)
        - Verify with ESPN, Basketball-Reference, Pro-Football-Reference
        - All stats must be from the CURRENT active season
        - Injury data from official team injury reports (check today's reports)
        - Next game info must be verified from official team schedules
        
        Provide COMPREHENSIVE current season statistics:
        
        1. PLAYER IDENTIFICATION:
           - Full official name (verify spelling from StatMuse)
           - Current team (verify they're still on this team)
           - Position
           - League
        
        2. CURRENT SEASON AVERAGES (Per Game):
           Use StatMuse and official league stats - Must include ALL relevant stats:
           
           BASKETBALL (NBA/NCAA):
           - Points per game (exact from StatMuse)
           - Assists per game (exact from StatMuse)
           - Rebounds per game (exact from StatMuse) - CRITICAL for PTS+REB+AST
           - Steals per game
           - Blocks per game
           - Field Goal % (actual shooting percentage)
           - 3-Point % (actual three-point shooting)
           - Free Throw %
           - Minutes per game
           
           FOOTBALL/SOCCER:
           - Goals per game
           - Assists per game
           - Shots per game
           - Passes per game
           - Tackles per game
           - Pass completion %
           - Minutes per game
           
           Source from StatMuse first, then verify with official league statistics.
        
        3. LAST 5-10 GAMES - COMPLETE GAME LOG:
           CRITICAL: Get ACTUAL game-by-game stats from StatMuse game logs
           
           For EACH of the last 5-10 games include:
           - Exact date (MM/DD/YYYY)
           - Opponent team name
           - Points/Goals scored (exact number from StatMuse game log)
           - Assists (exact number from game log)
           - Rebounds if basketball (exact number from game log)
           - Performance rating based on actual stats
           
           FOR BASKETBALL: MUST include points, rebounds, AND assists for every game
           Sources: StatMuse game logs, NBA.com game logs, ESPN player game logs
        
        4. CURRENT INJURY STATUS:
           - Check StatMuse injury updates AND official team injury reports from TODAY
           - Status: Healthy / Probable / Questionable / Doubtful / Out
           - If injured, specify the exact injury
        
        5. NEXT SCHEDULED GAME:
           - Verify from StatMuse schedule or official team schedule
           - Opponent name
           - Exact date and time
           - Home/Away location
           - Predicted performance based on:
             * Season averages from StatMuse
             * Recent form (last 5 games trend)
             * Matchup history vs this opponent
             * For basketball: predict points, rebounds, assists individually AND combined
        
        6. BETTING INSIGHTS:
           - Over/Under line (typical betting line for this player from sportsbooks)
           - Probability to score/reach milestones (based on season % from StatMuse)
           - Hot streak status (scoring above average in 3+ consecutive games)
           - Consistency rating (based on standard deviation of performance)
        
        7. ANALYSIS:
           - Top 3-5 strengths (based on statistical rankings from StatMuse)
           - 2-3 areas for improvement
           - Career highlights and awards (verify from official sources)
        
        DATA VALIDATION:
        - All statistics must be from current ${new Date().getFullYear()} season
        - Recent games must be actual completed games (verify dates on StatMuse)
        - Next game must be in the future
        - All percentages should be realistic (0-100)
        - Season averages should match StatMuse verified sources
        
        If player is not currently active or data is unavailable, indicate clearly.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            league: { type: "string" },
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
                minutes_per_game: { type: "number" }
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
          }
        }
      });

      await base44.entities.PlayerStats.create(result);
      queryClient.invalidateQueries({ queryKey: ['players'] });
    } catch (err) {
      setError("Failed to fetch player statistics. Please try again with a specific player name.");
      console.error(err);
    }

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <User className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold">Player Statistics</h1>
          </div>
          <p className="text-purple-100 text-lg max-w-2xl">
            Get comprehensive player stats including averages, recent form, betting insights, and next game predictions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
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
                <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Fetching player statistics...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds</p>
            </div>
          </div>
        )}

        {/* Players List */}
        {!isSearching && (
          <>
            {players.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Analyzed Players ({players.length})
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
