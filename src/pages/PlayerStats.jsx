
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import EmptyPlayerState from "../components/player/EmptyPlayerState";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import LimitedOfferBanner from "../components/auth/LimitedOfferBanner";

export default function PlayerStats() {
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

  const { data: players, isLoading, error: loadError } = useQuery({
    queryKey: ['players', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.PlayerStats.filter(
        { created_by: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerStats.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
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
        prompt: `You are a professional sports statistics AI with LIVE INTERNET ACCESS. You MUST fetch REAL, VERIFIED player data.

PLAYER SEARCH: "${query}"
TODAY: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT SEASON: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 MANDATORY DATA SOURCES (CHECK ALL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⭐ StatMuse.com - PRIMARY SOURCE
   Search: "${query} stats ${new Date().getFullYear()}"
   Get: Season averages, game logs, team

2. 🏀 Basketball-Reference.com (NBA players)
   URL: basketball-reference.com/players/
   Get: Detailed stats, per-game averages, shooting %

3. 🏈 Pro-Football-Reference.com (NFL players)
   URL: pro-football-reference.com/players/
   Get: Passing/rushing/receiving stats, per-game

4. 📺 ESPN.com Player Pages
   URL: espn.com/[league]/player/_/id/[player]
   Get: Current team, position, injury status

5. 🏟️ Official Team Websites
   Check: Current roster, injury reports, depth charts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 VERIFICATION PROCESS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: IDENTIFY PLAYER & SPORT
- Search StatMuse for "${query}"
- Determine sport (NBA/NFL/Soccer)
- Verify player is ACTIVE in ${new Date().getFullYear()} season

STEP 2: GET CURRENT TEAM & POSITION
- Check official team roster
- Verify player is on CURRENT roster
- Get exact position (e.g., "Point Guard", "Quarterback")

STEP 3: SEASON AVERAGES (${new Date().getFullYear()} ONLY)

FOR NBA/BASKETBALL:
✓ Points per game (from Basketball-Reference)
✓ Rebounds per game
✓ Assists per game
✓ Steals & Blocks per game
✓ FG%, 3P%, FT% (shooting percentages)
✓ Minutes per game

FOR NFL QUARTERBACKS:
✓ Passing yards per game (from Pro-Football-Reference)
✓ Passing TDs per game
✓ Interceptions per game
✓ Completion percentage
✓ Passer rating
✓ Rushing yards (if applicable)

FOR NFL RUNNING BACKS:
✓ Rushing yards per game (PRIMARY)
✓ Rushing TDs per game
✓ Carries per game
✓ Yards per carry
✓ Receptions & receiving yards
✓ Receiving TDs

FOR NFL WR/TE:
✓ Receptions per game (PRIMARY)
✓ Receiving yards per game
✓ Receiving TDs per game
✓ Targets per game
✓ Yards per reception
✓ Catch percentage

FOR SOCCER:
✓ Goals per game
✓ Assists per game
✓ Shots per game
✓ Pass completion %
✓ Minutes per game

STEP 4: GET LAST 5-10 GAME LOGS
- Search: "[Player Name] game log ${new Date().getFullYear()}"
- For EACH game get:
  * Exact date (MM/DD/YYYY)
  * Opponent (full team name)
  * Actual stats from THAT specific game
  * Performance rating vs season average

STEP 5: CHECK INJURY STATUS (TODAY)
- Search: "[Player Name] injury report ${new Date().toLocaleDateString()}"
- Status: Healthy/Day-to-Day/Out/Questionable
- If injured: type of injury, expected return

STEP 6: NEXT GAME PREDICTION
- Get team's next opponent from schedule
- Predict stats within ±30% of season average
- Consider matchup and recent form

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DATA VALIDATION RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ REJECT if:
- Player name misspelled or wrong
- Not on current ${new Date().getFullYear()} roster
- Stats from previous seasons
- Game logs without actual dates
- Fake/placeholder data

✅ ACCEPT only if:
- All stats from ${new Date().getFullYear()} season
- Player verified on team website
- Game logs have real dates & opponents
- Season averages match StatMuse

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 SPORT-SPECIFIC REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NBA: Focus on PPG, APG, RPG, FG%, 3P%
NFL QB: Focus on passing yards, TDs, completion %
NFL RB: Focus on rushing yards, YPC, TDs
NFL WR/TE: Focus on receptions, receiving yards, TDs
Soccer: Focus on goals, assists, shots

CRITICAL: Return ONLY stats relevant to player's position

RETURN: Valid JSON with ALL position-appropriate fields filled using REAL ${new Date().getFullYear()} data.`,
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
                minutes_per_game: { type: "number" },
                passing_yards_per_game: { type: "number" },
                passing_touchdowns_per_game: { type: "number" },
                interceptions_per_game: { type: "number" },
                completion_percentage: { type: "number" },
                rushing_yards_per_game: { type: "number" },
                rushing_touchdowns_per_game: { type: "number" },
                carries_per_game: { type: "number" },
                receiving_yards_per_game: { type: "number" },
                receiving_touchdowns_per_game: { type: "number" },
                receptions_per_game: { type: "number" },
                targets_per_game: { type: "number" },
                yards_per_carry: { type: "number" },
                yards_per_reception: { type: "number" }
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
                  passing_yards: { type: "number" },
                  passing_touchdowns: { type: "number" },
                  interceptions: { type: "number" },
                  rushing_yards: { type: "number" },
                  rushing_touchdowns: { type: "number" },
                  receiving_yards: { type: "number" },
                  receiving_touchdowns: { type: "number" },
                  receptions: { type: "number" },
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
                over_under_yards: { type: "number" },
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
          },
          required: ["player_name", "sport", "team"]
        }
      });

      console.log("✅ Player Stats Result:", result);

      if (!result || !result.player_name || !result.sport || !result.team) {
        throw new Error("Invalid response - missing required player data");
      }

      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
    } catch (err) {
      console.error("❌ Player Stats Error:", err);
      let errorMessage = "Failed to fetch player statistics. ";
      
      if (err.message?.includes("Invalid response")) {
        errorMessage += "Couldn't find that player. Try:\n• Using the player's full name (e.g., 'Patrick Mahomes')\n• Including the sport (e.g., 'Christian McCaffrey NFL')\n• Checking the spelling";
      } else {
        errorMessage += "Please try:\n• Full name (e.g., 'Josh Allen NFL')\n• Adding sport/league (e.g., 'Tyreek Hill NFL')\n• Current active players only";
      }
      
      setError(errorMessage);
    }

    setIsSearching(false);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertDescription>
            Failed to load player statistics. Please refresh the page.
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
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black">Player Statistics</h1>
              <p className="text-purple-100 text-lg mt-2">
                Season averages, recent form & next game predictions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50 text-red-400">
            <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
          </Alert>
        )}

        {isSearching ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200 opacity-20" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-white justify-center mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-lg">Fetching live player statistics...</span>
              </div>
              <p className="text-slate-400">Searching StatMuse, ESPN & official sources</p>
            </div>
          </div>
        ) : (
          <>
            {players.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
                    Analyzed Players
                    <span className="text-slate-500">({players.length})</span>
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
