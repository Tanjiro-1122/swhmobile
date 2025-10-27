
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import PlayerSearchBar from "../components/player/PlayerSearchBar";
import PlayerStatsDisplay from "../components/player/PlayerStatsDisplay";
import EmptyPlayerState from "../components/player/EmptyPlayerState";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";

export default function PlayerStats() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const queryClient = useQueryClient();

  const { lookupsRemaining, isAuthenticated, recordLookup, canLookup, userTier } = useFreeLookupTracker();

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
        prompt: `You are a professional sports data analyst. Find CURRENT statistics for: "${query}"

CRITICAL: ACCEPT NICKNAMES AND PARTIAL NAMES!

COMMON NAME VARIATIONS TO RECOGNIZE:
- "Stephen Curry" OR "Steph Curry" = Wardell Stephen Curry II
- "Kevin Durant" OR "KD" = Kevin Wayne Durant
- "LeBron James" OR "LeBron" OR "King James" = LeBron Raymone James Sr.
- "Giannis" = Giannis Antetokounmpo
- "Luka" OR "Luka Doncic" = Luka Dončić
- "Nikola Jokic" = Nikola Jokić
- "Joel Embiid" = Joel Hans Embiid
- "Jayson Tatum" OR "JT" = Jayson Christopher Tatum Sr.
- "Damian Lillard" OR "Dame" = Damian Lamonte Ollie Lillard Sr.
- "Anthony Davis" OR "AD" = Anthony Marshon Davis Jr.
- "Patrick Mahomes" = Patrick Lavon Mahomes II
- "Travis Kelce" = Travis Michael Kelce
- "Tyreek Hill" = Tyreek Hill
- "Lamar Jackson" = Lamar Demeatrice Jackson Jr.
- "Josh Allen" = Joshua Patrick Allen
- "Cristiano Ronaldo" OR "Ronaldo" OR "CR7" = Cristiano Ronaldo dos Santos Aveiro
- "Lionel Messi" OR "Messi" = Lionel Andrés Messi
- "Kylian Mbappe" = Kylian Mbappé
- "Erling Haaland" = Erling Braut Haaland

SEARCH STRATEGY:
1. If user searches "Stephen Curry", search for: "Stephen Curry stats 2024" OR "Steph Curry Warriors"
2. Accept ANY common variation of the name
3. Map to full legal name ONLY in the final result
4. Do NOT reject searches if exact legal name not provided

MANDATORY DATA SOURCES:
1. StatMuse.com - Search: "${query} stats 2024" or "${query} stats 2025"
2. Basketball-Reference.com - Search: "${query} basketball reference 2024-25"
3. ESPN.com - Search: "${query} espn stats"
4. Official NBA/NFL/team websites

TODAY: ${new Date().toLocaleDateString()}

STEP 1: IDENTIFY PLAYER (Accept Nicknames!)
- Search using the EXACT query provided: "${query}"
- Accept shortened names, nicknames, common names
- Find their FULL LEGAL NAME for the response (but search with any variation)
- Current team (e.g., "Los Angeles Lakers")
- Position (e.g., "SF" or "Small Forward")
- Sport (Basketball, Football, Soccer, Baseball, Hockey)
- League (NBA, NFL, Premier League, etc.)
- Jersey number if available
- ROLE: Is player a STARTER or BENCH player?
  * Search: "${query} starting lineup" or "${query} depth chart 2024"
  * Options: "Starter", "Bench", "Sixth Man", "Rotation", "Unknown"
  * Basketball: If minutes per game > 28, likely Starter. If 20-28, could be Sixth Man. If < 20, likely Bench
  * Football: Check team depth chart - is player listed as starter (1st string) or backup?
  * Soccer: Check starting XI lineup - regular starter or substitute?

EXAMPLE SEARCHES THAT MUST WORK:
- "Stephen Curry" → Find Wardell Stephen Curry II, return as "Stephen Curry (Wardell Stephen Curry II)"
- "Steph Curry" → Same result
- "KD" → Find Kevin Durant, return as "Kevin Durant (Kevin Wayne Durant)"
- "LeBron" → Find LeBron James, return as "LeBron James (LeBron Raymone James Sr.)"
- "Giannis" → Find Giannis Antetokounmpo
- "Messi" → Find Lionel Messi

STEP 2: CURRENT SEASON STATS (2024-25 for basketball, 2024 for football)

For BASKETBALL (NBA/NCAAB):
Search: "${query} stats per game 2024-25"
Required:
- Points per game (PPG) - e.g., 25.3
- Rebounds per game (RPG) - e.g., 7.4
- Assists per game (APG) - e.g., 7.1
- Field Goal % - e.g., 51.2
- 3-Point % - e.g., 38.5
- Free Throw % - e.g., 73.8
- Minutes per game - e.g., 35.2

For FOOTBALL (NFL):
Search: "${query} stats 2024 season"
Required:
- QB: Passing yards/game, TDs, INTs, Completion %
- RB: Rushing yards/game, TDs, Yards per carry
- WR: Receptions/game, Receiving yards, TDs

For SOCCER:
Search: "${query} stats 2024"
Required:
- Goals per 90 minutes
- Assists per 90 minutes
- Shots per game
- Pass accuracy

STEP 3: LAST 5 GAMES
Search: "${query} game log" or "${query} last 5 games"
Get exact stats from last 5 games:
- Date (e.g., "12/15/2024")
- Opponent (e.g., "vs Warriors")
- Points/Yards/Goals scored
- Assists
- Rebounds (basketball)
- Result (W/L)

Example:
[
  {"date": "12/15/2024", "opponent": "vs Warriors", "points": 28, "assists": 7, "rebounds": 9},
  {"date": "12/13/2024", "opponent": "@ Suns", "points": 31, "assists": 5, "rebounds": 8}
]

STEP 4: INJURY STATUS (IMPORTANT: Return as simple string)
Search: "${query} injury report" or "[team name] injury report"
Return ONE of these exact strings:
- "Healthy" (if no injury)
- "Questionable" (if status uncertain)
- "Out" (if definitely not playing)
- "Day-to-Day" (if minor injury)
- "Probable" (if likely to play)
- "Doubtful" (if unlikely to play)

If no injury found, return "Healthy"

STEP 5: NEXT GAME
Search: "[team name] schedule" (e.g., "Lakers schedule" or "Warriors schedule")
Find next upcoming game:
- Opponent (e.g., "vs Boston Celtics")
- Date (e.g., "12/20/2024 7:30 PM ET")
- Location (e.g., "Home - Crypto.com Arena" or "Away - TD Garden")

STEP 6: PREDICT NEXT GAME PERFORMANCE
Based on season averages and recent form, predict:

For Basketball: "Expected: 26 PTS, 8 REB, 7 AST"
For Football QB: "Expected: 275 passing yards, 2 TDs"
For Football RB: "Expected: 95 rushing yards, 1 TD"
For Soccer: "Expected: 1 goal, 1 assist"

STEP 7: BETTING INSIGHTS
Calculate:
- Over/Under line (season PPG ± 2-3)
- Probability to score (based on recent games)
- Hot streak: true if scored above average in 3+ of last 5 games
- Consistency rating: "High" if std deviation low, "Medium" if moderate, "Low" if high variance

STEP 8: STRENGTHS & WEAKNESSES
List 3-5 of each based on stats:

Strengths examples:
- "Elite three-point shooter (40%+ from 3)"
- "Excellent playmaker (8+ assists per game)"
- "Strong rebounder for position"

Weaknesses examples:
- "Free throw shooting needs improvement (65%)"
- "High turnover rate (3.5 per game)"
- "Below average defensive rating"

STEP 9: CAREER HIGHLIGHTS
List 5-10 major achievements:
- "4x NBA Champion"
- "4x NBA MVP"
- "19x NBA All-Star"
- "All-time leading scorer"
- "Olympic Gold Medalist"

IMPORTANT ERROR HANDLING:
If you CANNOT find ANY data for this player:
1. Try common nickname variations (Steph, KD, LeBron, etc.)
2. Try adding team name: "${query} Lakers" or "${query} Warriors"
3. Check if player is retired
4. Check if player exists

If player truly doesn't exist or is retired:
- Set predicted_performance to: "Unable to find current (2024-25) statistics for this player. They may be retired or inactive. Try: 'Stephen Curry Warriors' or 'LeBron James Lakers'"
- Set all numeric stats to 0 or null
- Set injury_status to "Unknown"
- Set role to "Unknown"
- Set team to "Unknown"

OTHERWISE: You MUST return complete, realistic data.

PLAYER NAME IN RESPONSE:
- Use the COMMON/POPULAR name in player_name field
- Examples: "Stephen Curry" (not Wardell Stephen Curry II), "Kevin Durant" (not Kevin Wayne Durant)
- Use the name people actually call them

VALIDATION:
Before returning, verify:
✓ player_name uses common name (Stephen Curry, not Wardell)
✓ sport is one of: Basketball, Football, Soccer, Baseball, Hockey
✓ team is not "Unknown" (unless player not found)
✓ role is one of: Starter, Bench, Sixth Man, Rotation, Unknown
✓ At least ONE stat in season_averages has a non-zero value
✓ next_game.predicted_performance contains specific numbers
✓ injury_status is a simple string
✓ At least 3 career_highlights listed
✓ At least 3 strengths and 3 weaknesses

Return complete JSON with ALL required fields populated.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            role: { 
              type: "string",
              enum: ["Starter", "Bench", "Sixth Man", "Rotation", "Unknown"],
              description: "Player's role on team"
            },
            league: { type: "string" },
            jersey_number: { type: ["string", "null"] },
            season_averages: {
              type: "object",
              properties: {
                points_per_game: { type: ["number", "null"] },
                assists_per_game: { type: ["number", "null"] },
                rebounds_per_game: { type: ["number", "null"] },
                steals_per_game: { type: ["number", "null"] },
                blocks_per_game: { type: ["number", "null"] },
                field_goal_percentage: { type: ["number", "null"] },
                three_point_percentage: { type: ["number", "null"] },
                free_throw_percentage: { type: ["number", "null"] },
                goals_per_game: { type: ["number", "null"] },
                shots_per_game: { type: ["number", "null"] },
                passes_per_game: { type: ["number", "null"] },
                tackles_per_game: { type: ["number", "null"] },
                passing_yards_per_game: { type: ["number", "null"] },
                rushing_yards_per_game: { type: ["number", "null"] },
                receptions_per_game: { type: ["number", "null"] },
                minutes_per_game: { type: ["number", "null"] }
              }
            },
            recent_form: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  opponent: { type: "string" },
                  points: { type: ["number", "null"] },
                  assists: { type: ["number", "null"] },
                  rebounds: { type: ["number", "null"] },
                  goals: { type: ["number", "null"] },
                  passing_yards: { type: ["number", "null"] },
                  rushing_yards: { type: ["number", "null"] },
                  performance_rating: { type: ["string", "null"] }
                },
                required: ["date", "opponent"]
              }
            },
            injury_status: {
              type: "string",
              description: "Must be one of: Healthy, Questionable, Out, Day-to-Day, Probable, Doubtful, Unknown"
            },
            next_game: {
              type: "object",
              properties: {
                opponent: { type: "string" },
                date: { type: "string" },
                location: { type: "string" },
                predicted_performance: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              },
              required: ["opponent", "date", "location", "predicted_performance", "confidence", "reasoning"]
            },
            career_highlights: {
              type: "array",
              items: { type: "string" }
            },
            betting_insights: {
              type: "object",
              properties: {
                over_under_points: { type: ["number", "null"] },
                probability_to_score: { type: ["number", "null"] },
                hot_streak: { type: ["boolean", "null"] },
                consistency_rating: { type: ["string", "null"] }
              }
            },
            strengths: {
              type: "array",
              items: { type: "string" }
            },
            weaknesses: {
              type: "array",
              items: { type: "string" }
            },
            data_sources: {
              type: "object",
              properties: {
                stats_source: { type: ["string", "null"] },
                injury_source: { type: ["string", "null"] },
                schedule_source: { type: ["string", "null"] }
              }
            }
          },
          required: ["player_name", "sport", "team", "position", "role", "league", "injury_status", "next_game", "career_highlights", "betting_insights", "strengths", "weaknesses"]
        }
      });

      console.log("✅ Player Stats Result:", result);

      // Check if the AI couldn't find the player or returned incomplete data indicating a lookup failure
      if (!result || !result.player_name || result.team === "Unknown" ||
          result?.next_game?.predicted_performance?.toLowerCase().includes("unable to find") ||
          result?.next_game?.predicted_performance?.toLowerCase().includes("player not found")) {
        throw new Error(`Could not find current statistics for "${query}". 

Please try:
• "${query}" with full name
• Adding current team: "Stephen Curry Warriors" or "LeBron James Lakers"
• Using nicknames: "Steph Curry", "KD", "King James"

Common issues:
• Player recently retired or traded
• Name spelling (try "Stephen" not "Steven")
• Include current 2024-25 team`);
      }

      await base44.entities.PlayerStats.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['players'] });
      
    } catch (err) {
      console.error("❌ Player Stats Error:", err);
      setError(err.message || `Failed to find player statistics for "${query}". Please try with full name and current team.`);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

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

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <PlayerSearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {error && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-300">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800 whitespace-pre-line ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-gray-600 justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Searching internet for player statistics...</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">This may take 10-20 seconds</p>
            </div>
          </div>
        ) : (
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
