
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TeamSearchBar from "../components/team/TeamSearchBar";
import TeamStatsDisplay from "../components/team/TeamStatsDisplay";
import EmptyTeamState from "../components/team/EmptyTeamState";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import LimitedOfferBanner from "../components/auth/LimitedOfferBanner";

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
        prompt: `You are a professional sports statistics AI with LIVE INTERNET ACCESS. You MUST fetch REAL, VERIFIED team data.

TEAM SEARCH: "${query}"
TODAY: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
SEASON: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 MANDATORY DATA SOURCES (CHECK ALL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⭐ StatMuse.com - PRIMARY SOURCE
   Search: "${query} stats ${new Date().getFullYear()}"
   Get: Team record, season averages, recent games

2. 🏀 Basketball-Reference.com (NBA teams)
   URL: basketball-reference.com/teams/
   Get: Standings, team stats, game results

3. 🏈 Pro-Football-Reference.com (NFL teams)
   URL: pro-football-reference.com/teams/
   Get: Team records, offensive/defensive stats

4. 📺 ESPN.com Team Pages
   Get: Current standings, schedules, news

5. 🏟️ Official Team Website
   Get: Roster, injury reports, next game

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 VERIFICATION PROCESS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: IDENTIFY TEAM
- Search StatMuse: "${query}"
- Get OFFICIAL full team name
- Verify sport and league

STEP 2: GET CURRENT SEASON RECORD
- W-L-D from current ${new Date().getFullYear()} season
- Win percentage
- Current standing in division/conference
- Home record
- Away record

STEP 3: SEASON AVERAGES (${new Date().getFullYear()} ONLY)

FOR NBA/BASKETBALL:
✓ Points per game (team offense)
✓ Points allowed per game (team defense)
✓ Field goal %
✓ 3-point %
✓ Rebounds per game
✓ Assists per game
✓ Turnovers per game

FOR NFL/FOOTBALL:
✓ Points per game
✓ Points allowed per game
✓ Total yards per game (offense)
✓ Yards allowed per game (defense)
✓ Passing yards per game
✓ Rushing yards per game
✓ Turnovers/takeaways
✓ Third down %
✓ Red zone efficiency

FOR SOCCER:
✓ Goals per game
✓ Goals allowed per game
✓ Possession %
✓ Shots per game
✓ Passing accuracy %

STEP 4: LAST 5 GAMES (MUST HAVE REAL DATES)
For EACH of last 5 games:
- Exact date (MM/DD/YYYY)
- Opponent (full official name)
- Result (W/L/D)
- Final score
- Home or away
- Key team stats from that game

STEP 5: CURRENT FORM
- W-L-D pattern (e.g., "W-W-L-W-L")
- Winning/losing streak

STEP 6: KEY PLAYERS (5-7 players)
- Search team roster
- List starters and key contributors
- Verify they're on CURRENT roster

STEP 7: INJURY REPORT (TODAY)
- Search: "[Team Name] injury report ${new Date().toLocaleDateString()}"
- List injured players with:
  * Player name
  * Injury type
  * Status (Out/Day-to-Day/Questionable)

STEP 8: NEXT GAME
- Opponent
- Date and time
- Home or away
- Win/loss prediction with reasoning

STEP 9: TEAM ANALYSIS
STRENGTHS (3-5 with stats):
- E.g., "#1 ranked defense allowing 98 PPG"
- E.g., "Won 8 of last 10 games"

WEAKNESSES (2-3 with stats):
- E.g., "28th in 3-point shooting at 32%"
- E.g., "Lost 4 straight on the road"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DATA VALIDATION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ REJECT if:
- Team name doesn't match official name
- Stats from previous seasons
- Last 5 games don't have real dates
- W-L record doesn't match standings
- Using fake data

✅ ACCEPT only if:
- All stats from ${new Date().getFullYear()} season
- Team verified on league website
- Last 5 games have actual dates and scores
- Current standings match

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL REMINDERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Use StatMuse as PRIMARY source
• Cross-reference with Basketball-Reference or Pro-Football-Reference
• Only ${new Date().getFullYear()} season data
• Last 5 games MUST have real dates and opponents
• If team not found: indicate in response

RETURN: Valid JSON with ALL fields populated using REAL ${new Date().getFullYear()} data.`,
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
    <div className="min-h-screen">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} />
      <LimitedOfferBanner />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black">Team Statistics</h1>
              <p className="text-green-100 text-lg mt-2">
                Season stats, last 5 games & complete team analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <TeamSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50 text-red-400">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSearching ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-green-200 opacity-20" />
                <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-white justify-center mb-2">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="font-bold text-lg">Fetching team statistics...</span>
              </div>
              <p className="text-slate-400">This may take 10-15 seconds</p>
            </div>
          </div>
        ) : (
          <>
            {teams.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full" />
                    Analyzed Teams
                    <span className="text-slate-500">({teams.length})</span>
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
