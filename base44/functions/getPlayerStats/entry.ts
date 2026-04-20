import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── IP RATE LIMIT (server-side, reinstall-proof) ───────────────────────────
const PAID_TIERS = ['legacy','vip_annual','premium_monthly','influencer',
  'unlimited_monthly','unlimited_yearly','half_year','basic_monthly'];
const FREE_LIMIT = 5;

async function checkIpRateLimit(req: Request, base44: any): Promise<Response | null> {
  // Try to get the real IP from headers (Vercel/Cloudflare set these)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown';

  // Get user — if authenticated + paid, bypass entirely
  let user: any = null;
  try { user = await base44.auth.me(); } catch {}
  if (user && PAID_TIERS.includes(user.subscription_type || '')) return null;

  // Admin bypass
  if (user?.role === 'admin') return null;

  // For authenticated free users, also check their server-side monthly counter
  if (user) {
    const used = user.monthly_free_lookups_used || 0;
    if (used >= FREE_LIMIT) {
      return new Response(JSON.stringify({
        error: 'free_limit_reached',
        message: 'You have used all 5 free monthly searches. Subscribe to keep going.',
        lookups_used: used,
        limit: FREE_LIMIT
      }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
    return null; // authenticated free user within limit — let through
  }

  // Unauthenticated: enforce IP-based limit
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Look up existing record
  const svc = base44.asServiceRole;
  let records: any[] = [];
  try {
    const res = await svc.entities.IpRateLimit.filter({ ip, month_key: monthKey });
    records = res || [];
  } catch {}

  const existing = records[0];
  const usedCount = existing?.search_count || 0;

  if (usedCount >= FREE_LIMIT) {
    return new Response(JSON.stringify({
      error: 'free_limit_reached',
      message: 'You have used all 5 free searches this month. Sign up to continue.',
      lookups_used: usedCount,
      limit: FREE_LIMIT
    }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  // Increment
  try {
    if (existing) {
      await svc.entities.IpRateLimit.update(existing.id, { search_count: usedCount + 1 });
    } else {
      await svc.entities.IpRateLimit.create({ ip, month_key: monthKey, search_count: 1 });
    }
  } catch (e) {
    console.error('Rate limit write error:', e);
    // Don't block the user if the write fails — fail open
  }

  return null; // under limit, allow through
}
// ─────────────────────────────────────────────────────────────────────────────


Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { query } = await req.json();

    // IP rate limit check (reinstall-proof, server-side)
    const limitResponse = await checkIpRateLimit(req, base44);
    if (limitResponse) return limitResponse;

    if (!query) {
      return new Response(JSON.stringify({ error: 'Search query is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports analyst with REAL-TIME INTERNET ACCESS. You MUST fetch LIVE, CURRENT data from StatMuse.com, Basketball-Reference.com, and ESPN.

SEARCH QUERY: "${query}"
TODAY\'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT SEASON: ${new Date().getFullYear()} (or ${new Date().getFullYear()}-${new Date().getFullYear() + 1} for NBA/NHL)

⚠️ CRITICAL REQUIREMENT: The "recent_form" array (last 5 games) MUST include COMPLETE stats for EVERY game. Missing data is NOT acceptable. These per-game stats are used for sports betting prop bets and MUST be accurate and complete.

STEP 1: IDENTIFY THE PLAYER
Search: "${query} stats ${new Date().getFullYear()}" on StatMuse.com
- Get player\'s full name, team, position, sport, and league
- Verify they are currently active

STEP 2: GET SEASON AVERAGES (sport-specific)

FOR BASKETBALL (NBA/NCAAB):
Search: "[player name] stats ${new Date().getFullYear()}" on StatMuse or Basketball-Reference
- Points per game (PPG)
- Rebounds per game (RPG)
- Assists per game (APG)
- Steals per game
- Blocks per game
- Field goal % (FG%) - return as decimal (e.g., 0.456 for 45.6%)
- Three-point % (3P%) - return as decimal (e.g., 0.350 for 35.0%)
- Three-pointers made per game
- Free throw % (FT%) - return as decimal (e.g., 0.850 for 85.0%)
- Minutes per game

FOR BASEBALL (MLB):
FOR BATTERS:
Search: "[player name] batting stats ${new Date().getFullYear()}" on StatMuse or Baseball-Reference
- Batting Average (AVG)
- Home Runs (HR)
- Runs Batted In (RBI)
- Stolen Bases (SB)
- Hits per game
- On-base percentage (OBP)
- Slugging percentage (SLG)

FOR PITCHERS:
Search: "[player name] pitching stats ${new Date().getFullYear()}" on StatMuse or Baseball-Reference
- Earned Run Average (ERA)
- Strikeouts (K)
- Wins (W)
- Saves (SV)
- Innings pitched per game
- WHIP (Walks + Hits per Inning Pitched)

FOR SOCCER/FOOTBALL:
Search: "[player name] stats ${new Date().getFullYear()}" on FBref.com or WhoScored
- Goals per 90 minutes
- Assists per 90 minutes
- Shots per game
- Pass completion %
- Tackles per game
- Key passes per game

FOR AMERICAN FOOTBALL (NFL):
⚠️ CRITICAL: All NFL stats MUST be PER GAME AVERAGES, not season totals!
Calculate: Total Season Stats ÷ Games Played = Per Game Average

FOR QUARTERBACKS:
Search: "[player name] QB stats ${new Date().getFullYear()}" on Pro-Football-Reference
- passing_yards_per_game: (Total Passing Yards ÷ Games Played) - typically 200-350 range
- Touchdowns per game
- Interceptions per game
- Completion percentage
- QB rating
- rushing_yards_per_game: (Total Rushing Yards ÷ Games Played) - typically 5-40 range for QBs

FOR RUNNING BACKS:
- rushing_yards_per_game: (Total Rushing Yards ÷ Games Played) - typically 40-120 range
- Yards per carry (YPC)
- Rushing touchdowns per game
- receptions_per_game: (Total Receptions ÷ Games Played) - typically 2-6 range
- Receiving yards per game

FOR WIDE RECEIVERS/TIGHT ENDS:
- receptions_per_game: (Total Receptions ÷ Games Played) - typically 4-8 range
- Receiving yards per game - typically 50-100 range
- Receiving touchdowns per game
- Yards after catch per game
- Catch percentage

⚠️ VALIDATION: If passing_yards_per_game > 500, it's a season total - divide by games played!
⚠️ VALIDATION: If rushing_yards_per_game > 200, it's a season total - divide by games played!
⚠️ VALIDATION: If receptions_per_game > 20, it's a season total - divide by games played!

STEP 3: RECENT FORM - DETAILED LAST 5 GAMES (⚠️ ABSOLUTELY CRITICAL!)

🚨 MANDATORY DATA SOURCES FOR GAME-BY-GAME STATS:
1. Basketball-Reference.com - "[player name] game log ${new Date().getFullYear()}"
2. StatMuse.com - "[player name] last 5 games"
3. ESPN.com - "[player name] game log"

⚠️ YOU MUST FETCH EVERY SINGLE STAT FOR EACH OF THE LAST 5 GAMES. DO NOT LEAVE ANY FIELDS BLANK OR USE PLACEHOLDERS.

FOR BASKETBALL - EACH GAME MUST INCLUDE ALL OF THESE (NO EXCEPTIONS):
REQUIRED URL: https://www.basketball-reference.com/players/[player-id]/gamelog/${new Date().getFullYear()}

For EACH of the last 5 games, you MUST provide:
✅ date (exact format: "MM/DD/YYYY" or "Jan 15, 2025")
✅ opponent (team name - e.g., "Los Angeles Lakers")
✅ result (format: "W 115-108" or "L 102-110")
✅ points (exact integer - e.g., 28)
✅ rebounds (exact integer - e.g., 7)
✅ assists (exact integer - e.g., 5)
✅ steals (exact integer - REQUIRED, cannot be blank)
✅ blocks (exact integer - REQUIRED, cannot be blank)
✅ three_pointers_made (exact integer - e.g., 4 - REQUIRED, cannot be blank)
✅ field_goals_made (exact integer - e.g., 10 - REQUIRED)
✅ field_goals_attempted (exact integer - e.g., 18 - REQUIRED)
✅ free_throws_made (exact integer - e.g., 6 - REQUIRED)
✅ free_throws_attempted (exact integer - e.g., 8 - REQUIRED)
✅ minutes_played (exact integer - e.g., 35 - REQUIRED, cannot be blank)
✅ performance_rating (text: "Excellent" if above season avg, "Good" if close, "Average", or "Poor")

CRITICAL BASKETBALL STATS THAT ARE OFTEN MISSING:
- steals (STL) - Find this in the game log table on Basketball-Reference, usually 4th or 5th column
- blocks (BLK) - Find this immediately after steals in game log
- three_pointers_made (3PM) - Find this before field goals in game log
- field_goals_made/attempted (FGM/FGA) - Core stat, always in game log
- free_throws_made/attempted (FTM/FTA) - Core stat, always in game log
- minutes_played (MIN) - Usually first or second column in game log

VERIFICATION: After extracting basketball game data, verify EVERY stat is a number (not null, not "-", not blank). If any stat is missing from the game log, return 0 for that game but include a note in performance_rating.

FOR BASEBALL BATTERS - Each game must include:
- Date
- Opponent
- Result
- Hits (exact number)
- At-bats (exact number)
- Home runs (exact number)
- RBIs (exact number)
- Stolen bases (exact number)
- Batting average for that game

FOR BASEBALL PITCHERS - Each game must include:
- Date
- Opponent
- Result
- Innings pitched (e.g., 6.0)
- Strikeouts (exact number)
- Earned runs (exact number)
- Hits allowed
- Walks

FOR SOCCER - Each game must include:
- Date
- Opponent
- Result
- Goals scored (exact number)
- Assists (exact number)
- Shots on target
- Key passes
- Tackles made
- Minutes played

FOR NFL QB - Each game must include:
- Date
- Opponent
- Result
- Passing yards (exact number)
- Passing touchdowns
- Interceptions thrown
- Completion percentage
- Rushing yards

FOR NFL RB/WR - Each game must include:
- Date
- Opponent
- Result
- Rushing yards (RB) or Receptions (WR)
- Rushing touchdowns or Receiving yards
- Yards per carry or Receiving touchdowns

STEP 4: NEXT GAME PREDICTION
Search: "[team name] schedule" on ESPN
- Find next scheduled game (opponent, date, location)
- PREDICT SPECIFIC STATS for that game based on:
  * Player\'s season averages
  * Last 5 games performance trend (calculate average from the 5 games)
  * Historical performance against this opponent
  * Current form (hot/cold streak)

BASKETBALL PREDICTION FORMAT:
"28 PTS, 7 REB, 5 AST, 2 STL, 1 BLK, 4 3PM" (specific numbers with all key stats)

BASEBALL BATTER PREDICTION:
"2 hits, 1 HR, 3 RBI, .300 AVG for the game"

BASEBALL PITCHER PREDICTION:
"6 IP, 7 K, 2 ER, 1.00 ERA for the game"

SOCCER PREDICTION:
"1 goal, 1 assist, 4 shots on target"

NFL QB PREDICTION:
"285 passing yards, 2 TDs, 1 INT, 25 rushing yards"

STEP 5: BETTING INSIGHTS
- Over/Under line for relevant stat (e.g., points for NBA, home runs for MLB)
- Probability to score/perform well (0-100%)
- Is player on a hot streak? (boolean - true if last 3 games above season average)
- Consistency rating: Calculate variation in last 5 games:
  * If std deviation < 15% of mean: "Very Consistent"
  * If 15-30%: "Moderately Consistent"
  * If > 30%: "Inconsistent"

STEP 6: INJURY STATUS
Search: "[player name] injury report" or "[team name] injury report today"
- Current injury status: "Healthy", "Questionable", "Out", "Day-to-Day"
- If injured, specify the injury

CRITICAL RULES:
✓ Use ONLY stats from the CURRENT ${new Date().getFullYear()} season
✓ DO NOT mix sport stats (no "rebounds" for baseball, no "home runs" for basketball)
✓ Recent form MUST show ACTUAL game results with EXACT numbers from game logs, not estimates
✓ Each of the 5 games must have complete stat lines appropriate for the sport
✓ EVERY FIELD must be populated with a number, not null, not "-", not blank
✓ If a stat truly cannot be found for a game, use 0 (zero) instead of leaving it blank
✓ All stats must be from StatMuse, ESPN, Basketball-Reference, Pro-Football-Reference, or official league sources
✓ Predictions must be SPECIFIC NUMBERS, not ranges
✓ Percentages should be returned as decimals (0.45 for 45%, not 45)

VALIDATION BEFORE RETURNING:
1. Check that "recent_form" array has exactly 5 games
2. For each game, verify EVERY required stat for that sport is a number (not null)
3. For basketball: verify steals, blocks, 3PM, FG made/attempted, FT made/attempted, and minutes are ALL present
4. If any critical stat is missing, re-search specifically for that stat on Basketball-Reference game log

If player not found, return an error in the reasoning field of next_game.

Return complete JSON with ALL fields populated using VERIFIED LIVE DATA.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            role: { type: "string" },
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
                three_pointers_made_per_game: { type: "number" },
                free_throw_percentage: { type: "number" },
                minutes_per_game: { type: "number" },
                goals_per_game: { type: "number" },
                shots_per_game: { type: "number" },
                passes_per_game: { type: "number" },
                tackles_per_game: { type: "number" },
                passing_yards_per_game: { type: "number" },
                rushing_yards_per_game: { type: "number" },
                receptions_per_game: { type: "number" },
                batting_average: { type: "number" },
                home_runs: { type: "number" },
                rbis: { type: "number" },
                stolen_bases: { type: "number" },
                era: { type: "number" },
                strikeouts: { type: "number" },
                wins: { type: "number" },
                saves: { type: "number" }
              }
            },
            recent_form: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  opponent: { type: "string" },
                  result: { type: "string" },
                  points: { type: "number" },
                  assists: { type: "number" },
                  rebounds: { type: "number" },
                  steals: { type: "number" },
                  blocks: { type: "number" },
                  three_pointers_made: { type: "number" },
                  field_goals_made: { type: "number" },
                  field_goals_attempted: { type: "number" },
                  free_throws_made: { type: "number" },
                  free_throws_attempted: { type: "number" },
                  minutes_played: { type: "number" },
                  goals: { type: "number" },
                  shots_on_target: { type: "number" },
                  key_passes: { type: "number" },
                  tackles: { type: "number" },
                  passing_yards: { type: "number" },
                  passing_touchdowns: { type: "number" },
                  interceptions_thrown: { type: "number" },
                  rushing_yards: { type: "number" },
                  rushing_touchdowns: { type: "number" },
                  receptions: { type: "number" },
                  receiving_yards: { type: "number" },
                  receiving_touchdowns: { type: "number" },
                  hits: { type: "number" },
                  home_runs: { type: "number" },
                  rbis: { type: "number" },
                  stolen_bases: { type: "number" },
                  at_bats: { type: "number" },
                  strikeouts: { type: "number" },
                  innings_pitched: { type: "number" },
                  earned_runs: { type: "number" },
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
                predicted_performance: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              },
              required: ["opponent", "predicted_performance", "confidence", "reasoning"]
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
          },
          required: ["player_name", "sport", "team", "next_game"]
        }
    });

    if (!result || !result.player_name || (result.next_game && result.next_game.reasoning && result.next_game.reasoning.includes("not found"))) {
        return new Response(JSON.stringify({ error: "Player not found or data could not be retrieved. Please check the spelling." }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Player stats error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred fetching player stats',
      details: error.toString()
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});