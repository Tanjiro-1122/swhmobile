
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TeamSearchBar from "../components/team/TeamSearchBar";
import TeamStatsDisplay from "../components/team/TeamStatsDisplay";
import EmptyTeamState from "../components/team/EmptyTeamState";

export default function TeamStats() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.TeamStats.list('-created_date'),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamStats.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const handleSearch = async (query) => {
    setIsSearching(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports team analyst with access to LIVE, OFFICIAL team statistics.
        
        Team Query: "${query}"
        
        TODAY'S DATE: ${new Date().toLocaleDateString()}
        CURRENT SEASON: ${new Date().getFullYear()} season
        
        CRITICAL DATA SOURCE REQUIREMENTS:
        - Use ONLY official league statistics and standings
        - Source from ESPN, official league websites, verified sports databases
        - All stats must be from the CURRENT active season
        - Verify team names are official and current
        - Check rosters and injury reports from official sources
        
        Provide COMPREHENSIVE current season team statistics:
        
        1. TEAM IDENTIFICATION:
           - Full official team name
           - Sport and league
           - Current season record (W-L-D with exact numbers from standings)
           - Win percentage
           - Recent form string (e.g., "W-W-L-W-D" from last 5 games)
        
        2. CURRENT SEASON AVERAGES (Per Game):
           Must include ALL relevant stats for the sport:
           
           BASKETBALL:
           - Points per game (team offense)
           - Points allowed per game (team defense)
           - Field goal %
           - 3-Point %
           - Assists per game
           - Rebounds per game
           - Turnovers per game
           
           FOOTBALL/SOCCER:
           - Goals per game
           - Goals allowed per game
           - Possession %
           - Shots per game
           - Shots allowed per game
           - Passing accuracy %
           
           Use official season statistics from verified sources only.
        
        3. LAST 5 GAMES - COMPLETE GAME LOG:
           CRITICAL: Provide ACTUAL game-by-game results from official records
           
           For EACH of the last 5 games include:
           - Exact date (MM/DD/YYYY)
           - Opponent team name
           - Result (Win/Loss/Draw)
           - Final score (Team score - Opponent score)
           - Home or Away
           - Team points/goals scored
           - Opponent points/goals
           - Key stats for that specific game (shooting %, possession, turnovers, etc.)
           
           Sources: Official league game logs, ESPN team schedules, verified game recaps
        
        4. KEY PLAYERS ROSTER:
           - List 5-7 most important players currently on the roster
           - Verify they are active (not traded/injured long-term)
        
        5. CURRENT INJURY REPORT:
           - Check official team injury reports from TODAY
           - For each injured player:
             * Player name
             * Specific injury
             * Status (Out / Day-to-Day / Probable / Questionable)
        
        6. NEXT SCHEDULED GAME:
           - Verify from official team schedule
           - Opponent name
           - Exact date and time
           - Home or Away
           - Win/Loss prediction with reasoning based on:
             * Current form
             * Head-to-head record
             * Home/away performance
             * Injury impact
        
        7. TEAM ANALYSIS:
           - Top 3-5 team strengths (based on statistical rankings)
           - 2-3 weaknesses or areas of concern
           - Supported by actual statistics
        
        DATA VALIDATION:
        - All statistics must be from current ${new Date().getFullYear()} season
        - Last 5 games must be actual completed games (verify dates)
        - Next game must be in the future
        - Record and percentages must be accurate
        - All stats should match official league standings
        
        If team name is unclear or data unavailable, indicate clearly.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            team_name: { type: "string" },
            sport: { type: "string" },
            league: { type: "string" },
            current_record: {
              type: "object",
              properties: {
                wins: { type: "number" },
                losses: { type: "number" },
                draws: { type: "number" },
                win_percentage: { type: "number" }
              }
            },
            season_averages: {
              type: "object",
              properties: {
                points_per_game: { type: "number" },
                points_allowed_per_game: { type: "number" },
                goals_per_game: { type: "number" },
                goals_allowed_per_game: { type: "number" },
                possession_percentage: { type: "number" },
                shots_per_game: { type: "number" },
                shots_allowed_per_game: { type: "number" },
                passing_accuracy: { type: "number" },
                field_goal_percentage: { type: "number" },
                three_point_percentage: { type: "number" },
                assists_per_game: { type: "number" },
                rebounds_per_game: { type: "number" },
                turnovers_per_game: { type: "number" }
              }
            },
            last_five_games: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  opponent: { type: "string" },
                  result: { type: "string" },
                  score: { type: "string" },
                  home_away: { type: "string" },
                  team_points: { type: "number" },
                  opponent_points: { type: "number" },
                  key_stats: { type: "object" }
                }
              }
            },
            form: { type: "string" },
            strengths: {
              type: "array",
              items: { type: "string" }
            },
            weaknesses: {
              type: "array",
              items: { type: "string" }
            },
            key_players: {
              type: "array",
              items: { type: "string" }
            },
            injuries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  player_name: { type: "string" },
                  injury: { type: "string" },
                  status: { type: "string" }
                }
              }
            },
            next_game: {
              type: "object",
              properties: {
                opponent: { type: "string" },
                date: { type: "string" },
                location: { type: "string" },
                prediction: { type: "string" }
              }
            }
          }
        }
      });

      await base44.entities.TeamStats.create(result);
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    } catch (err) {
      setError("Failed to fetch team statistics. Please try again with a specific team name.");
      console.error(err);
    }

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold">Team Statistics</h1>
          </div>
          <p className="text-green-100 text-lg max-w-2xl">
            Get comprehensive team stats including season averages, last 5 games, key players, injuries, and next game predictions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <TeamSearchBar onSearch={handleSearch} isSearching={isSearching} />
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
                <div className="absolute inset-0 rounded-full border-4 border-green-200" />
                <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="font-medium">Fetching team statistics...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds</p>
            </div>
          </div>
        )}

        {/* Teams List */}
        {!isSearching && (
          <>
            {teams.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Analyzed Teams ({teams.length})
                  </h2>
                </div>
                <div className="space-y-6">
                  {teams.map((team, index) => (
                    <TeamStatsDisplay
                      key={team.id}
                      team={team}
                      onDelete={deleteMutation.mutate}
                      index={index}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyTeamState />
            )}
          </>
        )}
      </div>
    </div>
  );
}
