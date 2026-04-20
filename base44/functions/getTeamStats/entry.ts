import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── IP RATE LIMIT (server-side, reinstall-proof) ───────────────────────────
const PAID_TIERS = ['legacy','vip_annual','premium_monthly','influencer',
  'unlimited_monthly','unlimited_yearly','half_year','basic_monthly'];
const FREE_LIMIT = 5;

async function checkIpRateLimit(req: Request, base44: any): Promise<Response | null> {
  try {
    // Try to get the real IP from headers (Vercel/Cloudflare set these)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Get user — if authenticated + paid, bypass entirely
    // Wrapped in its own try/catch so cross-origin/unauthenticated errors fail open
    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }

    if (user && PAID_TIERS.includes(user.subscription_type || '')) return null;
    if (user?.role === 'admin') return null;

    // For authenticated free users, check their server-side monthly counter
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

    const svc = base44.asServiceRole;
    let records: any[] = [];
    try {
      const res = await svc.entities.IpRateLimit.filter({ ip, month_key: monthKey });
      records = res || [];
    } catch { records = []; }

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
    }

    return null; // under limit, allow through
  } catch (e) {
    // If anything in rate-limit logic crashes, fail open so searches still work
    console.error('Rate limit check failed, failing open:', e);
    return null;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // IP rate limit check (reinstall-proof, server-side)
    const limitResponse = await checkIpRateLimit(req, base44);
    if (limitResponse) return limitResponse;

    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: 'Search query is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional sports analyst with REAL-TIME INTERNET ACCESS. You MUST fetch LIVE, CURRENT data from StatMuse.com, ESPN, and official league websites.

SEARCH QUERY: "${query}"
TODAY\'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT SEASON: ${new Date().getFullYear()} (or ${new Date().getFullYear()}-${new Date().getFullYear() + 1} for NBA/NHL)

STEP 1: IDENTIFY THE TEAM
Search: "${query} stats ${new Date().getFullYear()}" on StatMuse.com or ESPN
- Get team\'s full official name, sport, and league
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

STEP 6: NEXT GAME PREDICTION (DETAILED - REQUIRED)
Search: "[team name] schedule" on ESPN

Get next game details:
- Next opponent (full team name)
- Date and time (exact)
- Location (Home/Away with city)

THEN CREATE A DETAILED PREDICTION:
- predicted_outcome: "Win", "Loss", or "Draw" (one word only)
- predicted_score: Specific score based on team averages (e.g., "115-108" for basketball, "3-1" for soccer, "28-24" for NFL)
- confidence: "High" (80%+ confident), "Medium" (60-79%), or "Low" (<60%)
- reasoning: 3-4 sentences explaining WHY this prediction, including:
  * Team\'s recent form (last 5 games record)
  * Head-to-head history against this opponent
  * Key statistical advantages/disadvantages
  * Impact of injuries or home/away factors
  * Specific numbers to support the prediction

EXAMPLE REASONING FORMAT:
"The Lakers are predicted to win based on their strong 4-1 record in last 5 games, averaging 118 PPG at home. They\'ve won 7 of the last 10 matchups against the Pistons by an average of 12 points. Detroit is struggling on the road (2-8) and allowing 115 PPG. With LeBron and AD healthy, Lakers have a significant advantage in frontcourt scoring."

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
✓ Next game prediction MUST include all 4 fields: predicted_outcome, predicted_score, confidence, reasoning
✓ Reasoning must be detailed with specific statistics

If team not found, return an error in the reasoning field.

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
                predicted_outcome: { type: "string" },
                predicted_score: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              },
              required: ["opponent", "predicted_outcome", "confidence", "reasoning"]
            }
          },
          required: ["team_name", "sport", "next_game"]
        }
    });
    
    if (!result || !result.team_name || (result.next_game && result.next_game.reasoning && result.next_game.reasoning.includes("not found"))) {
        return new Response(JSON.stringify({ error: "Team not found or data could not be retrieved. Please check the spelling." }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Team stats error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred fetching team stats',
      details: error.toString()
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
