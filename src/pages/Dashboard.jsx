import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Sparkles, Zap, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchBar from "../components/sports/SearchBar";
import TodaysBestBets from "../components/sports/TodaysBestBets";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import WelcomeTutorial from "../components/onboarding/WelcomeTutorial";
import VIPDiscordCard from "../components/community/VIPDiscordCard";

export default function Dashboard() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchSuccess, setSearchSuccess] = useState(false);
  const queryClient = useQueryClient();
  
  const { lookupsRemaining, isAuthenticated: isAuth, recordLookup, canLookup, userTier } = useFreeLookupTracker();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    checkAuth();
  }, []);

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

  const isVIPorLegacy = currentUser?.subscription_type === 'vip_annual' || currentUser?.subscription_type === 'legacy';

  const handleSearch = async (query) => {
    
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchSuccess(false);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports analyst with REAL-TIME INTERNET ACCESS. You MUST fetch LIVE, CURRENT data.

CRITICAL DATA SOURCES - YOU MUST USE THESE:
1. StatMuse.com (statmuse.com) - PRIMARY source for all statistics
2. ESPN.com - Match schedules, team records, injury reports
3. Official League Sites: NBA.com, NFL.com, PremierLeague.com, MLB.com
4. Basketball-Reference.com or Pro-Football-Reference.com for historical data
5. TheScore.com or CBS Sports for live updates

SEARCH QUERY: "${query}"
TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT SEASON (e.g., ${new Date().getFullYear()}-${new Date().getFullYear() + 1} for NBA/NHL, ${new Date().getFullYear()} for MLB/NFL/Soccer): Use the most recent completed or ongoing season.

VERIFICATION PROCESS - FOLLOW THESE STEPS:
1. Search "${query} schedule ${new Date().toLocaleDateString()}" on ESPN.com
2. Verify match exists and get EXACT date/time
3. Search "[team name] stats ${new Date().getFullYear()}" on StatMuse.com
4. Cross-reference with official league website
5. Check injury report: "[team] injury report today"
6. Get weather: "[stadium/city] weather [game date]" if outdoor sport

REQUIRED DATA WITH SOURCES:

1. MATCH IDENTIFICATION (verify from ESPN schedule):
   - Sport (exact: NBA, NFL, MLB, Premier League, etc.)
   - League (official full name)
   - Home Team (OFFICIAL name from league website)
   - Away Team (OFFICIAL name from league website)
   - Match Date/Time (exact from schedule)
   - Venue/Stadium

2. CURRENT SEASON RECORDS (from StatMuse + League standings):
   Home Team Record: X-Y (from standings page)
   Away Team Record: X-Y (from standings page)
   
3. WIN PROBABILITIES (calculate from multiple factors):
   Base calculation on:
   - Current season win % (from standings)
   - Last 10 games record (from recent results)
   - Head-to-head last 3 seasons (from StatMuse)
   - Home court advantage (~60% for home team baseline)
   - Key player injuries (reduce win % by 5-15% per star player out)
   
   Home Win: X%
   Away Win: Y%
   Draw: Z% (ONLY for soccer/hockey)
   
   IMPORTANT: Must total exactly 100%

4. DETAILED MATCH PREDICTION (REQUIRED):
   - Predicted Winner: "[Team Name]" (the team most likely to win)
   - Predicted Score: "115-108" (specific final score based on averages)
   - Win Margin: "+7 points" or "2 goals" (difference)
   - Confidence: "High" (80%+), "Medium" (65-79%), or "Low" (<65%)
   - Reasoning: 3-4 sentences with SPECIFIC STATS:
     Example: "Lakers have won 8 of last 10 home games (80% win rate) averaging 118 PPG. Celtics are 2-8 on road trips averaging 105 PPG. Lakers star players are healthy while Celtics missing starting PG (team averages 8 fewer assists without him). Historical H2H shows Lakers won last 4 meetings by average margin of 9 points."

5. KEY FACTORS (5-7 bullet points with STATISTICS):
   Example format:
   - "Home team won 12 of last 15 games (80% win rate since Jan 1)"
   - "Away team averaging 118 PPG vs opponent allowing 112 PPG (6-point offensive advantage)"
   - "Home team's star player averaging 32 PPG in last 5 games (career high)"
   - "Weather forecast: 45°F with 15mph winds (affects passing game in NFL)"
   - "Away team on 3rd road game in 4 days (fatigue factor)"

6. KEY PLAYERS (3-4 per team) - SPORT-SPECIFIC STATS ONLY:
   
   FOR BASKETBALL (NBA/NCAAB):
   Search: "[player name] stats ${new Date().getFullYear()}" on StatMuse
   - Season averages: PPG, RPG, APG, FG%, 3P%, MPG
   - Last 5 games: actual stats from game logs
   - PREDICTED performance for THIS game: "32 PTS, 9 REB, 7 AST"
   - Recent form: "Averaging 28 PPG in last 5 games"
   - Injury status: Check official injury report
   
   FOR SOCCER:
   Search: "[player name] stats ${new Date().getFullYear()}" on FBref.com or WhoScored
   - Season averages: Goals/90min, Assists/90min, Shots/game
   - Last 5 games: goals, assists from match logs
   - PREDICTED performance: "2 goals, 1 assist, 6 shots"
   - Recent form: "3 goals in last 3 matches"
   
   FOR AMERICAN FOOTBALL (NFL):
   Search: "[player name] stats ${new Date().getFullYear()}" on Pro-Football-Reference
   - QB: Pass yards/game, TDs, INTs, Completion %
   - RB: Rush yards/game, YPC, TDs
   - WR: Receptions/game, Yards, TDs
   - PREDICTED performance: "285 passing yards, 2 TDs, 1 INT"
   
   CRITICAL: DO NOT MIX STATS - Basketball players should NEVER have "goals", Soccer players should NEVER have "rebounds" or "3-pointers"

7. INJURY REPORT (REQUIRED - from official team/league source):
   Search: "[team name] injury report ${new Date().toLocaleDateString()}"
   For EACH injured player:
   - Player name (exact)
   - Team
   - Injury description: "ankle sprain", "knee soreness"
   - Status: "Out", "Questionable", "Doubtful", "Day-to-Day"
   - Impact on team: "High" if star player (>20 PPG), "Medium" if starter, "Low" if bench
   - Games missed: number

8. WEATHER IMPACT (REQUIRED for outdoor sports - NFL, MLB, Soccer):
   Search: "[stadium name] weather forecast [game date]" on Weather.com
   - Conditions: "Clear", "Rainy", "Snowy", "Overcast", "Windy"
   - Temperature: "45°F (feels like 38°F with wind chill)"
   - Wind Speed: "15 mph sustained, gusts to 25 mph"
   - Precipitation: "40% chance of rain in 2nd half"
   - Impact Rating: "High", "Medium", "Low", "None"
   - Betting Impact: "Heavy wind reduces passing game efficiency, favor Under on total points"
   
   For indoor sports (NBA, NHL indoor arenas): Set to null or "N/A - Indoor venue"

9. HEAD-TO-HEAD HISTORY (from StatMuse or Basketball-Reference):
   Search: "[home team] vs [away team] history"
   Last 5 meetings (with dates and scores):
   - "11/15/2024: Lakers 118 - Celtics 112 (Home win)"
   - Include who won, final score, location

10. BETTING MARKETS (sport-appropriate):
    Over/Under Total:
    - Line: Calculate from season averages (Home PPG + Away PPG ± 5)
    - Over probability: X%
    - Under probability: Y%
    
    Spread:
    - Predicted spread based on win probability difference
    - Cover probability for favorite

VALIDATION CHECKLIST:
✓ All stats from CURRENT ${new Date().getFullYear()} season only
✓ Team names match official league records
✓ Player stats match the sport (no mixing)
✓ Injury report is from TODAY'S date
✓ Weather is for GAME DAY (if applicable)
✓ Predictions include specific numbers, not ranges
✓ Probabilities total 100%
✓ All "predicted performance" fields are sport-appropriate

DATA VERIFICATION:
Before returning, verify:
1. Match date exists on ESPN schedule
2. Team records match official standings
3. Player stats are current season averages
4. Injury report is within last 24 hours
5. Weather forecast is for correct date/time

FAILURE CONDITIONS:
If match not found: Return reasoning in prediction.reasoning: "Unable to find scheduled match for [query]. Please verify team names and date. Try searching with full team names and league (e.g., 'Los Angeles Lakers vs Boston Celtics NBA')."

Return complete JSON with ALL fields populated using VERIFIED LIVE DATA.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sport: { type: "string" },
            league: { type: "string" },
            home_team: { type: "string" },
            away_team: { type: "string" },
            match_date: { type: "string" },
            venue: { type: "string" },
            home_win_probability: { type: "number" },
            away_win_probability: { type: "number" },
            draw_probability: { type: "number" },
            prediction: {
              type: "object",
              properties: {
                winner: { type: "string" },
                predicted_score: { type: "string" },
                win_margin: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              },
              required: ["winner", "predicted_score", "confidence", "reasoning"]
            },
            key_factors: {
              type: "array",
              items: { type: "string" }
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
                  predicted_passing_yards: { type: "number" },
                  predicted_rushing_yards: { type: "number" },
                  probability_to_score: { type: "number" },
                  recent_form: { type: "string" },
                  injury_status: { type: "string" },
                  predicted_performance: { type: "string" }
                }
              }
            },
            head_to_head: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  result: { type: "string" },
                  score: { type: "string" }
                }
              }
            },
            betting_markets: {
              type: "object",
              properties: {
                over_under: { type: "object", properties: {
                  line: { type: "number" },
                  over_probability: { type: "number" },
                  under_probability: { type: "number" }
                }},
                spread: {
                  type: "object",
                  properties: {
                    line: { type: "string" },
                    cover_probability: { type: "number" }
                  }
                },
                both_teams_score: { type: "object" },
                first_to_score: { type: "object" }
              }
            },
            injuries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  player_name: { type: "string" },
                  team: { type: "string" },
                  injury: { type: "string" },
                  status: { type: "string" },
                  impact: { type: "string" },
                  games_missed: { type: "number" }
                },
                required: ["player_name", "team", "status"]
              }
            },
            weather_impact: {
              type: "object",
              properties: {
                conditions: { type: "string" },
                temperature: { type: "string" },
                wind_speed: { type: "string" },
                precipitation: { type: "string" },
                impact_rating: { type: "string" },
                betting_impact: { type: "string" }
              }
            },
            data_sources: {
              type: "object",
              properties: {
                stats_source: { type: "string" },
                schedule_source: { type: "string" },
                injury_source: { type: "string" },
                weather_source: { type: "string" },
                head_to_head_source: { type: "string" },
                betting_market_source: { type: "string" }
              }
            }
          },
          required: [
            "sport",
            "league",
            "home_team",
            "away_team",
            "match_date",
            "venue",
            "home_win_probability",
            "away_win_probability",
            "prediction",
            "key_factors",
            "key_players",
            "injuries",
            "weather_impact",
            "head_to_head",
            "betting_markets",
            "data_sources"
          ]
        }
      });

      console.log("✅ Match Analysis Result:", result);

      if (!result || !result.sport || !result.home_team || !result.away_team || !result.prediction) {
        throw new Error("Invalid response - missing required match data or prediction");
      }

      if (result.prediction?.reasoning?.includes("Unable to find scheduled match")) {
        throw new Error("Match not found - try a different date or check team names");
      }

      await base44.entities.Match.create(result);
      recordLookup();
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setSearchSuccess(true);
      
    } catch (err) {
      console.error("❌ Match Analysis Error:", err);
      setError("Failed to analyze the match. Please try again with more specific details (team names, league, or date).");
    }

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <WelcomeTutorial />
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <div className="max-w-7xl mx-auto">
        {/* VIP Discord Card */}
        {isVIPorLegacy && (
          <div className="mb-12">
            <VIPDiscordCard />
          </div>
        )}

        {/* Today's Best Bets Section */}
        <div className="mb-12">
          <TodaysBestBets 
            onLookupUsed={recordLookup}
            canLookup={canLookup}
            onLimitReached={() => setShowLimitModal(true)}
          />
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analyze Any Match</h2>
                <p className="text-gray-600">Get instant win probabilities and betting insights</p>
              </div>
            </div>
            <SearchBar onSearch={handleSearch} isSearching={isSearching} />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-2 border-red-200">
            <AlertDescription className="whitespace-pre-line text-red-900">{error}</AlertDescription>
          </Alert>
        )}

        {searchSuccess && !isSearching && (
          <Alert className="mb-6 bg-green-50 border-2 border-green-200">
            <AlertDescription className="text-green-900">
              ✅ Match analysis complete! View it in <a href="/SavedResults" className="underline font-bold">Saved Results</a>
            </AlertDescription>
          </Alert>
        )}

        {isSearching && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-20 animate-ping" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full opacity-75 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-emerald-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Match Data</h3>
              <p className="text-gray-700">Fetching live stats from StatMuse & ESPN...</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="max-w-7xl mx-auto px-6 pb-12 mt-12">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-700">
            <strong className="font-bold text-gray-900">⚠️ Responsible Gambling:</strong> These predictions are for informational purposes only. 
            Always gamble responsibly and never bet more than you can afford to lose. Statistics are sourced from StatMuse, ESPN, and official league data.
          </p>
        </div>
      </div>
    </div>
  );
}