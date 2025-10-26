
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
        prompt: `You are a professional sports statistics analyst with REAL-TIME INTERNET ACCESS. Fetch LIVE, CURRENT, VERIFIED data.

MANDATORY DATA SOURCES - USE IN THIS ORDER:
1. StatMuse.com (statmuse.com) - PRIMARY for all team statistics
2. ESPN.com - Team pages, standings, schedules
3. Official League Websites: NBA.com, NFL.com, PremierLeague.com, MLB.com
4. Basketball-Reference.com or Pro-Football-Reference.com for detailed stats
5. TeamRankings.com for advanced analytics
6. Official team websites for injury reports

TEAM SEARCH: "${query}"
TODAY: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT SEASON: ${new Date().getFullYear()}-${new Date().getFullYear() + 1} (Basketball/Hockey)
CURRENT SEASON: ${new Date().getFullYear()} (Soccer/Football/Baseball)

VERIFICATION PROCESS - FOLLOW THESE STEPS:
1. Search: "${query} ${new Date().getFullYear()} stats" on StatMuse.com
2. Verify team exists and get official full name from league website
3. Get current standings: "${query} standings ${new Date().getFullYear()}"
4. Pull last 10 game results: "${query} schedule results"
5. Get roster from official team website
6. Check injury report: "${query} injury report ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}"
7. Find next game: "${query} schedule upcoming"

REQUIRED DATA - ALL FIELDS MUST BE COMPLETE:

1. TEAM IDENTIFICATION (verify from official league):
   - Full Official Name (e.g., "Los Angeles Lakers", NOT just "Lakers")
   - Sport (Basketball, Soccer, Football, Baseball, Hockey)
   - League (NBA, NFL, Premier League, La Liga, etc.)
   - City/Location
   - Conference/Division (if applicable)

2. CURRENT SEASON RECORD (from official standings page):
   Search: "${query} standings ${new Date().getFullYear()}"
   - Wins: exact number from current standings
   - Losses: exact number from current standings
   - Draws: (only for soccer/hockey, exact from standings)
   - Win Percentage: calculate (Wins / Total Games)
   - Current Ranking: position in division/conference/league
   - Streak: "W3" (won last 3), "L2" (lost last 2), etc.

3. SEASON AVERAGES - SPORT-SPECIFIC ONLY:
   
   FOR BASKETBALL (NBA, NCAAB):
   Search: "${query} stats ${new Date().getFullYear()}" on Basketball-Reference
   - Points Per Game (PPG): team average
   - Points Allowed Per Game: opponent average
   - Field Goal % (FG%)
   - Three-Point % (3P%)
   - Assists Per Game (APG)
   - Rebounds Per Game (RPG)
   - Turnovers Per Game
   - Blocks Per Game
   - Steals Per Game
   
   DO NOT INCLUDE: goals, possession %, passes
   
   FOR SOCCER/FOOTBALL:
   Search: "${query} stats ${new Date().getFullYear()}" on WhoScored or FBref
   - Goals Per Game
   - Goals Allowed Per Game
   - Possession % (average)
   - Shots Per Game
   - Shots Allowed Per Game
   - Pass Completion % (accuracy)
   - Tackles Per Game
   - Clean Sheets (games without conceding)
   
   DO NOT INCLUDE: rebounds, field goal %, three-point %
   
   FOR AMERICAN FOOTBALL (NFL):
   Search: "${query} stats ${new Date().getFullYear()}" on Pro-Football-Reference
   - Points Per Game
   - Points Allowed Per Game
   - Total Yards Per Game (offense)
   - Yards Allowed Per Game (defense)
   - Passing Yards Per Game
   - Rushing Yards Per Game
   - Turnovers (giveaways/game)
   - Takeaways Per Game
   - Third Down Conversion %
   - Red Zone Scoring %
   
   DO NOT INCLUDE: assists, rebounds, possession %

4. LAST 10 GAMES (with EXACT data from game logs):
   Search: "${query} schedule results" on ESPN or team website
   
   For EACH of last 5-10 games provide:
   - Exact date (MM/DD/YYYY)
   - Opponent (full official team name)
   - Result: "W" or "L" or "D"
   - Score: "115-108" (team score first)
   - Home/Away: "Home" or "Away"
   - Team Points: their score
   - Opponent Points: opponent's score
   - Key Stats: {} object with 2-3 notable stats from that game
   
   Example:
   {
     "date": "12/15/2024",
     "opponent": "Boston Celtics",
     "result": "W",
     "score": "118-112",
     "home_away": "Home",
     "team_points": 118,
     "opponent_points": 112,
     "key_stats": {"field_goal_pct": "52%", "three_pointers": 15, "rebounds": 48}
   }

5. FORM STRING (from last 10 games):
   Create string like "W-W-L-W-W-L-W-W-W-L" based on results
   - W = Win
   - L = Loss
   - D = Draw (soccer only)
   Most recent game on the right

6. KEY PLAYERS (5-7 from current roster):
   Search: "${query} roster ${new Date().getFullYear()}"
   - List players by: "[First Last] ([Position])"
   - Include starters and key bench players
   - Example: "LeBron James (SF)", "Anthony Davis (PF)"

7. INJURIES (TODAY'S official injury report):
   Search: "${query} injury report ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}"
   For EACH injured player:
   - Player Name (full name)
   - Injury: specific injury ("ankle sprain", "knee soreness")
   - Status: "Out", "Doubtful", "Questionable", "Day-to-Day"
   - Games Missed: number
   - Expected Return: date or "TBD"

8. NEXT GAME PREDICTION:
   Search: "${query} schedule" for upcoming game
   - Opponent: "[Team Name]" (exact official name)
   - Date: "MM/DD/YYYY HH:MM" (exact from schedule)
   - Location: "Home" or "Away"
   - Prediction: 2-3 sentences predicting outcome with stats:
     Example: "Lakers favored at home (12-3 home record) averaging 118 PPG. Opponent struggling on road (4-10) allowing 115 PPG. Key matchup: Lakers' elite defense (ranked 3rd, 105 PPG allowed) vs opponent's inconsistent offense. Prediction: Lakers win by 8-12 points."

9. STRENGTHS (3-5 statistical strengths):
   Example: "#1 ranked defense allowing only 102 PPG (league average 112)"
   Example: "Elite three-point shooting at 39% (2nd in league)"
   Base on rankings and stats vs league average

10. WEAKNESSES (2-3 statistical weaknesses):
    Example: "Turnover-prone with 16 TO/game (28th in league, avg is 13)"
    Example: "Poor rebounding (42 RPG, ranked 25th)"
    Base on rankings and stats vs league average

VALIDATION - VERIFY BEFORE RETURNING:
✓ Team name is OFFICIAL full name from league
✓ Win-loss record matches current standings exactly
✓ Last 5-10 games have actual dates and real scores
✓ All stats are from ${new Date().getFullYear()} season
✓ Stats match the sport (no mixing)
✓ Injury report is current (within 24 hours)
✓ Next game exists on official schedule
✓ Form string matches last game results

FAILURE CONDITIONS:
If team not found:
- Return error in prediction field explaining issue
- Suggest using full official team name with league

CRITICAL: Stats must match the sport. Basketball teams should NEVER have "goals per game" or "possession %". Soccer teams should NEVER have "rebounds" or "three-point %".

Return complete JSON with ALL fields using LIVE VERIFIED DATA from ${new Date().getFullYear()} season.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            team_name: { type: "string" },
            sport: { type: "string" },
            league: { type: "string" },
            city: { type: "string" },
            current_record: {
              type: "object",
              properties: {
                wins: { type: "number" },
                losses: { type: "number" },
                draws: { type: "number" },
                win_percentage: { type: "number" },
                current_ranking: { type: "string" },
                streak: { type: "string" }
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
                turnovers_per_game: { type: "number" },
                blocks_per_game: { type: "number" }, // Added for Basketball
                steals_per_game: { type: "number" }, // Added for Basketball
                tackles_per_game: { type: "number" }, // Added for Soccer
                clean_sheets: { type: "number" }, // Added for Soccer
                total_yards_per_game: { type: "number" }, // Added for American Football
                yards_allowed_per_game: { type: "number" }, // Added for American Football
                passing_yards_per_game: { type: "number" }, // Added for American Football
                rushing_yards_per_game: { type: "number" }, // Added for American Football
                takeaways_per_game: { type: "number" }, // Added for American Football
                third_down_conversion_percentage: { type: "number" }, // Added for American Football
                red_zone_scoring_percentage: { type: "number" } // Added for American Football
              }
            },
            last_five_games: { // Naming retained as per existing schema item, though prompt asks for more
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
                  status: { type: "string" },
                  games_missed: { type: "number" }, // Added
                  expected_return: { type: "string" } // Added
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
            },
            data_sources: { // Added
              type: "object",
              properties: {
                stats_source: { type: "string" },
                standings_source: { type: "string" },
                injury_source: { type: "string" },
                schedule_source: { type: "string" }
              }
            }
          },
          required: ["team_name", "sport", "current_record"]
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
