
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TeamSearchBar from "../components/team/TeamSearchBar";
import TeamStatsDisplay from "../components/team/TeamStatsDisplay";
import EmptyTeamState from "../components/team/EmptyTeamState";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";

export default function TeamStats() {
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

  const { data: teams, isLoading, error: loadError } = useQuery({
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
        prompt: `You are a sports statistics AI with INTERNET ACCESS. You MUST fetch real, current data from the web.

TEAM SEARCH: "${query}"
TODAY: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
SEASON: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}

CRITICAL: You have internet access. You MUST search these sources:
1. StatMuse.com - Primary source for team statistics
2. ESPN.com team pages
3. Official league websites (NBA.com, NFL.com, PremierLeague.com)
4. Basketball-Reference.com or Pro-Football-Reference.com
5. Team official websites for roster and injury reports

STEP-BY-STEP PROCESS:
1. Identify the team's full official name and league
2. Search StatMuse for "${query} stats ${new Date().getFullYear()}"
3. Get current season record (wins, losses, draws)
4. Get season averages (PPG, defensive stats, etc.)
5. Get last 5 game results with dates, opponents, scores
6. Check official injury report from team website
7. Find next scheduled game

REQUIRED DATA TO EXTRACT:

1. TEAM INFO (verify from official league):
   - Full official name (e.g., "Los Angeles Lakers" not just "Lakers")
   - Sport and league
   - Current season record (W-L-D with exact numbers from standings)
   - Win percentage
   - Recent form: last 5 games in W/L format (e.g., "W-W-L-W-L")

2. SEASON AVERAGES (from StatMuse ${new Date().getFullYear()} season):
   For Basketball: PPG, Opp PPG, FG%, 3P%, APG, RPG, TO/game
   For Soccer: Goals/game, Goals allowed, Possession%, Shots, Passing accuracy
   For Football: Points/game, Points allowed, Total yards, Turnovers

3. LAST 5 GAMES (from official game logs):
   For EACH game provide:
   - Exact date (MM/DD/YYYY)
   - Opponent (full team name)
   - Result: "W" or "L" or "D"
   - Score (e.g., "115-108")
   - Home or away
   - Key stats from that specific game

4. KEY PLAYERS (5-7 from current roster):
   - Search team's official roster
   - List player names and positions
   - Verify they're currently active

5. INJURIES (check TODAY'S injury report):
   - Search "[team name] injury report [today's date]"
   - For each injured player: name, injury, status (Out/Day-to-Day/Questionable)

6. NEXT GAME (from team schedule):
   - Opponent
   - Date and time
   - Home or away
   - Win/loss prediction with brief reasoning

7. ANALYSIS:
   - Strengths: 3-5 statistical strengths (e.g., "#1 ranked defense allowing 98 PPG")
   - Weaknesses: 2-3 statistical weaknesses (e.g., "28th in 3-point shooting at 32%")

VALIDATION:
- All stats must be from ${new Date().getFullYear()} season
- Last 5 games must have actual dates and scores from game logs
- Win-loss record must match current standings
- If team not found, indicate in the response

FORMAT: Return valid JSON with ALL fields populated using REAL data.`,
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

      console.log("✅ Team Stats Result:", result);

      if (!result || !result.team_name || !result.sport) {
        throw new Error("Invalid response - missing required team data");
      }

      await base44.entities.TeamStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      
    } catch (err) {
      console.error("❌ Team Stats Error:", err);
      let errorMessage = "Failed to fetch team statistics. ";
      
      if (err.message?.includes("Invalid response")) {
        errorMessage += "Couldn't find that team. Try:\n• Using the full official name (e.g., 'Los Angeles Lakers')\n• Adding the league (e.g., 'Manchester United Premier League')\n• Checking the spelling";
      } else {
        errorMessage += "Please try:\n• Full team name (e.g., 'Golden State Warriors')\n• Including league (e.g., 'Real Madrid La Liga')\n• Current professional teams only";
      }
      
      setError(errorMessage);
    }

    setIsSearching(false);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertDescription>
            Failed to load team statistics. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

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

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <TeamSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-green-200" />
                <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-gray-600 justify-center">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="font-medium">Fetching team statistics...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">This may take 10-15 seconds</p>
            </div>
          </div>
        ) : (
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
