
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, TrendingUp } from "lucide-react";
import TeamSearchBar from "../components/team/TeamSearchBar";
import TeamStatsDisplay from "../components/team/TeamStatsDisplay";
import EmptyTeamState from "../components/team/EmptyTeamState";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";

export default function TeamStats() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const queryClient = useQueryClient();

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier, isLoading } = useFreeLookupTracker();

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

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.TeamStats.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamStats.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
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
        prompt: `You are a professional sports analyst with REAL-TIME INTERNET ACCESS. You MUST fetch LIVE, CURRENT data from StatMuse.com, ESPN, and official league websites.

SEARCH QUERY: "${query}"
TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT SEASON: ${new Date().getFullYear()} (or ${new Date().getFullYear()}-${new Date().getFullYear() + 1} for NBA/NHL)

STEP 1: IDENTIFY THE TEAM
Search: "${query} stats ${new Date().getFullYear()}" on StatMuse.com or ESPN
- Get team's full official name, sport, and league
- Verify they are currently active

STEP 2: GET CURRENT RECORD
Search: "[team name] standings ${new Date().getFullYear()}" on ESPN or official league website
- Current wins, losses, draws (if applicable)
- Win percentage
- Conference/division standing

STEP 3: SEASON AVERAGES (sport-specific)

FOR BASKETBALL (NBA/NCAAB):
Search: "[team name] team stats ${new Date().getFullYear()}" on StatMuse or Basketball-Reference
- Points per game
- Points allowed per game
- Field goal %
- Three-point %
- Rebounds per game
- Assists per game
- Turnovers per game

FOR BASEBALL (MLB):
Search: "[team name] team stats ${new Date().getFullYear()}" on Baseball-Reference
- Runs per game
- Runs allowed per game
- Team batting average
- Team ERA
- Home runs per game
- Stolen bases

FOR SOCCER/FOOTBALL:
Search: "[team name] stats ${new Date().getFullYear()}" on FBref.com or WhoScored
- Goals per game
- Goals allowed per game
- Possession %
- Shots per game
- Pass accuracy %
- Clean sheets

FOR AMERICAN FOOTBALL (NFL):
Search: "[team name] team stats ${new Date().getFullYear()}" on Pro-Football-Reference or ESPN
- Points per game (offense)
- Points allowed per game (defense)
- Total yards per game
- Yards allowed per game
- Turnovers per game
- Sacks per game

STEP 4: LAST 5 GAMES
Search: "[team name] game log ${new Date().getFullYear()}" on ESPN
Get results from last 5 games:
- Date
- Opponent
- Result (W/L/D)
- Score
- Home or Away
- Key stats for that game

STEP 5: FORM
Based on last 5 games, create a form string:
Example: "W-W-L-W-D" or "W-L-W-W-L"

STEP 6: NEXT GAME
Search: "[team name] schedule" on ESPN
- Next opponent
- Date and time
- Location (home/away)
- Brief prediction based on form

STEP 7: STRENGTHS & WEAKNESSES
Based on stats:
- List 3-5 team strengths (e.g., "Elite offense averaging 120 PPG")
- List 3-5 weaknesses (e.g., "Poor defense allowing 115 PPG")

STEP 8: KEY PLAYERS
List 3-5 most important players with their positions

STEP 9: INJURY REPORT
Search: "[team name] injury report" on ESPN or official team site
List any injured key players with:
- Player name
- Injury type
- Status (Out/Questionable/Day-to-Day)

CRITICAL RULES:
✓ Use ONLY stats from CURRENT ${new Date().getFullYear()} season
✓ DO NOT mix sport stats (no "rebounds" for baseball, no "home runs" for basketball)
✓ All stats from StatMuse, ESPN, or official league sources
✓ Last 5 games must show ACTUAL results, not estimates
✓ Team names must be spelled correctly (official names)

If team not found, return an error in the prediction field.

Return complete JSON with ALL fields populated using VERIFIED LIVE DATA.`,
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
          },
          required: ["team_name", "sport"]
        }
      });

      if (!result || !result.team_name) {
        throw new Error("Invalid response - team not found or missing data");
      }

      if (result.next_game?.prediction?.includes("not found") || result.next_game?.prediction?.includes("Unable to find")) {
        throw new Error("Team not found - please check spelling and try again");
      }

      await base44.entities.TeamStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      
    } catch (err) {
      console.error("Team analysis error:", err);
      setError("Failed to analyze team. Please try again with full team name or different spelling.");
    }

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Team Stats & Analysis</h1>
              <p className="text-gray-600">Analyze any team's performance and get insights</p>
            </div>
          </div>
        </div>

        <Card className="p-6 mb-8 border-2 border-blue-200 bg-white shadow-xl">
          <TeamSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-2 border-red-200">
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        )}

        {isSearching && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-20 animate-ping" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-75 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Team Data</h3>
              <p className="text-gray-700">Fetching stats from StatMuse & ESPN...</p>
            </div>
          </div>
        )}

        {!isSearching && (
          <>
            {teams && teams.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-6">
                {teams.map((team) => (
                  <TeamStatsDisplay
                    key={team.id}
                    team={team}
                    onDelete={deleteMutation.mutate}
                  />
                ))}
              </div>
            ) : (
              <EmptyTeamState />
            )}
          </>
        )}
      </div>
    </div>
  );
}
