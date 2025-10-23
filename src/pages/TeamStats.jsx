
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

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch only current user's teams
  const { data: teams, isLoading, error: loadError } = useQuery({
    queryKey: ['teams', currentUser?.email], // Add currentUser email to query key for user-specific data
    queryFn: async () => {
      if (!currentUser?.email) return []; // Don't fetch if no user email is available
      return await base44.entities.TeamStats.filter(
        { created_by: currentUser.email }, // Filter by the current user's email
        '-created_date'
      );
    },
    enabled: !!currentUser?.email, // Only enable this query if currentUser.email exists
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamStats.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', currentUser?.email] }); // Invalidate with user-specific key
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
        - Use StatMuse (statmuse.com) as PRIMARY source for all team statistics
        - Cross-reference with official league statistics and standings
        - Verify with ESPN, official league websites, Basketball-Reference, Pro-Football-Reference
        - All stats must be from the CURRENT active season
        - Check injury reports from official team sources (today's reports)
        - Verify team names and rosters are current
        
        Provide COMPREHENSIVE current season team statistics:
        
        1. TEAM IDENTIFICATION:
           - Full official team name (verify from StatMuse)
           - Sport and league
           - Current season record (W-L-D with exact numbers from StatMuse/official standings)
           - Win percentage (calculate from actual record)
           - Recent form string (e.g., "W-W-L-W-D" from last 5 games on StatMuse)
        
        2. CURRENT SEASON AVERAGES (Per Game):
           Use StatMuse and official league stats - Must include ALL relevant stats:
           
           BASKETBALL:
           - Points per game (team offense from StatMuse)
           - Points allowed per game (team defense from StatMuse)
           - Field goal % (team shooting from StatMuse)
           - 3-Point % (team three-point shooting)
           - Assists per game
           - Rebounds per game
           - Turnovers per game
           
           FOOTBALL/SOCCER:
           - Goals per game (from StatMuse)
           - Goals allowed per game (defensive record)
           - Possession % (average from matches)
           - Shots per game
           - Shots allowed per game
           - Passing accuracy %
           
           Source all statistics from StatMuse first, then verify with official league data.
        
        3. LAST 5 GAMES - COMPLETE GAME LOG:
           CRITICAL: Get ACTUAL game-by-game results from StatMuse game logs
           
           For EACH of the last 5 games include:
           - Exact date (MM/DD/YYYY from StatMuse)
           - Opponent team name
           - Result (Win/Loss/Draw)
           - Final score (Team score - Opponent score)
           - Home or Away
           - Team points/goals scored
           - Opponent points/goals
           - Key stats for that specific game (shooting %, possession, turnovers, etc.)
           
           Sources: StatMuse game logs, official league schedules, ESPN team recaps
        
        4. KEY PLAYERS ROSTER:
           - List 5-7 most important players currently on the roster (verify from StatMuse)
           - Ensure all players are active (not traded/injured long-term)
           - Verify names and positions
        
        5. CURRENT INJURY REPORT:
           - Check StatMuse injury updates AND official team injury reports from TODAY
           - For each injured player:
             * Player name
             * Specific injury
             * Status (Out / Day-to-Day / Probable / Questionable)
             * Expected return date if available
        
        6. NEXT SCHEDULED GAME:
           - Verify from StatMuse schedule or official team schedule
           - Opponent name
           - Exact date and time
           - Home or Away
           - Win/Loss prediction with reasoning based on:
             * Current form from last 5 games
             * Head-to-head record (get from StatMuse)
             * Home/away performance this season
             * Impact of current injuries
             * Statistical matchup advantages/disadvantages
        
        7. TEAM ANALYSIS:
           - Top 3-5 team strengths (based on statistical rankings from StatMuse)
           - 2-3 weaknesses or areas of concern
           - All analysis must be supported by actual statistics
        
        DATA VALIDATION:
        - All statistics must be from current ${new Date().getFullYear()} season
        - Last 5 games must be actual completed games (verify dates on StatMuse)
        - Next game must be in the future
        - Record and percentages must be mathematically accurate
        - All stats should match StatMuse and official league standings
        
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
      queryClient.invalidateQueries({ queryKey: ['teams', currentUser?.email] }); // Invalidate with user-specific key
    } catch (err) {
      setError("Failed to fetch team statistics. Please try again with a specific team name.");
      console.error("Team Stats Error:", err);
    }

    setIsSearching(false);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertDescription>
            Failed to load team statistics. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show a message if no user is logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Alert className="max-w-2xl mx-auto mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Please log in to view and save your team statistics.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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

        {/* Loading State for Search */}
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

        {/* Teams List (only shown when not searching and currentUser is available) */}
        {!isSearching && currentUser && (
          <>
            {teams.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Analyzed Teams ({teams.length})
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
