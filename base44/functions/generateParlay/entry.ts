import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ─── IP RATE LIMIT (server-side, reinstall-proof) ───────────────────────────
const PAID_TIERS = ['legacy','vip_annual','premium_monthly','influencer',
  'unlimited_monthly','unlimited_yearly','half_year','basic_monthly'];
const FREE_LIMIT = 5;

async function checkIpRateLimit(req: Request, base44: any): Promise<Response | null> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown';

  let user: any = null;
  try { user = await base44.auth.me(); } catch {}
  if (user && PAID_TIERS.includes(user.subscription_type || '')) return null;
  if (user?.role === 'admin') return null;

  if (user) {
    const used = user.monthly_free_lookups_used || 0;
    if (used >= FREE_LIMIT) {
      return new Response(JSON.stringify({
        error: 'free_limit_reached',
        message: 'You have used all 5 free monthly searches. Subscribe to keep going.',
        lookups_used: used, limit: FREE_LIMIT
      }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
    return null;
  }

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
      lookups_used: usedCount, limit: FREE_LIMIT
    }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    if (existing) {
      await svc.entities.IpRateLimit.update(existing.id, { search_count: usedCount + 1 });
    } else {
      await svc.entities.IpRateLimit.create({ ip, month_key: monthKey, search_count: 1 });
    }
  } catch (e) { console.error('Rate limit write error:', e); }

  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── LIVE ODDS FETCHER ───────────────────────────────────────────────────────
// Maps user-friendly sport names to The Odds API sport keys
const SPORT_KEY_MAP: Record<string, string[]> = {
  nba: ['basketball_nba'],
  basketball: ['basketball_nba'],
  nfl: ['americanfootball_nfl'],
  football: ['americanfootball_nfl'],
  mlb: ['baseball_mlb'],
  baseball: ['baseball_mlb'],
  nhl: ['icehockey_nhl'],
  hockey: ['icehockey_nhl'],
  soccer: ['soccer_epl', 'soccer_usa_mls'],
  mls: ['soccer_usa_mls'],
  epl: ['soccer_epl'],
  ncaab: ['basketball_ncaab'],
  ncaaf: ['americanfootball_ncaaf'],
  ufc: ['mma_mixed_martial_arts'],
  mma: ['mma_mixed_martial_arts'],
};

async function fetchLiveOdds(sport: string): Promise<string> {
  const oddsApiKey = Deno.env.get('ODDS_API_KEY');
  if (!oddsApiKey) return 'Live odds unavailable (API key not configured).';

  const normalizedSport = sport.toLowerCase().trim();
  const sportKeys = SPORT_KEY_MAP[normalizedSport] || SPORT_KEY_MAP['nba'];
  
  const allGames: any[] = [];
  
  for (const sportKey of sportKeys) {
    try {
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${oddsApiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`
      );
      if (!response.ok) continue;
      const games = await response.json();
      if (Array.isArray(games)) allGames.push(...games);
    } catch (e) {
      console.warn(`Failed to fetch odds for ${sportKey}:`, e);
    }
  }

  if (allGames.length === 0) {
    return `No live odds found for ${sport} today. Games may not be scheduled or odds not yet posted.`;
  }

  // Format into a clean string for the AI prompt
  const today = new Date().toISOString().split('T')[0];
  const todaysGames = allGames.filter(g => g.commence_time?.startsWith(today));
  const gamesToUse = todaysGames.length > 0 ? todaysGames : allGames.slice(0, 8);

  const formatted = gamesToUse.slice(0, 10).map(game => {
    const gameTime = new Date(game.commence_time).toLocaleTimeString('en-US', { 
      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short'
    });
    
    let oddsLine = `${game.home_team} vs ${game.away_team} @ ${gameTime}`;
    
    const bookmakers = game.bookmakers?.slice(0, 2) || [];
    const oddsDetails: string[] = [];
    
    for (const bk of bookmakers) {
      for (const market of bk.markets || []) {
        if (market.key === 'h2h') {
          const lines = market.outcomes?.map((o: any) => `${o.name} ML: ${o.price > 0 ? '+' : ''}${o.price}`).join(' | ');
          if (lines) oddsDetails.push(`Moneyline: ${lines}`);
        }
        if (market.key === 'spreads') {
          const lines = market.outcomes?.map((o: any) => `${o.name} ${o.point > 0 ? '+' : ''}${o.point} (${o.price > 0 ? '+' : ''}${o.price})`).join(' | ');
          if (lines) oddsDetails.push(`Spread: ${lines}`);
        }
        if (market.key === 'totals') {
          const lines = market.outcomes?.map((o: any) => `${o.name} ${o.point} (${o.price > 0 ? '+' : ''}${o.price})`).join(' | ');
          if (lines) oddsDetails.push(`Total: ${lines}`);
        }
      }
      break; // Just use first bookmaker for cleanliness
    }
    
    return `${oddsLine}\n  ${oddsDetails.join('\n  ')}`;
  }).join('\n\n');

  return `LIVE ODDS FROM THE ODDS API (${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} ET):\n\n${formatted}`;
}
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const limitResponse = await checkIpRateLimit(req, base44);
        if (limitResponse) return limitResponse;

        const { sport, risk_level, stake_amount } = await req.json();

        if (!sport || !risk_level) {
            return Response.json({ 
                error: 'Missing required parameters: sport and risk_level' 
            }, { status: 400 });
        }

        // ── Fetch real live odds BEFORE calling the AI ──
        const liveOddsData = await fetchLiveOdds(sport);

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a professional sports betting analyst. Generate a parlay bet using the REAL LIVE ODDS provided below.

TODAY: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
SPORT: ${sport}
RISK LEVEL: ${risk_level}
STAKE: $${stake_amount || 50}

══════════════════════════════════════════
${liveOddsData}
══════════════════════════════════════════

IMPORTANT: Use ONLY the odds shown above. These are real, current lines from major sportsbooks.
If you need more context on teams/injuries/form, use your knowledge — but the ODDS NUMBERS must come from the data above.

RISK LEVEL GUIDELINES:
${risk_level === 'conservative' ? `
CONSERVATIVE: 2-3 legs, heavy favorites (>65% win prob), target combined +150 to +250
` : risk_level === 'balanced' ? `
BALANCED: 3-4 legs, mix of favorites/underdogs/totals, target +250 to +500
` : `
AGGRESSIVE: 4-6 legs, include underdogs and props, target +500 to +1500
`}

PARLAY BUILDING RULES:
1. Select ${risk_level === 'conservative' ? '2-3' : risk_level === 'balanced' ? '3-4' : '4-6'} legs from the live odds above
2. Do NOT pick opposite sides of the same game
3. Each leg must have specific stats-based reasoning (injuries, recent form, matchup)
4. Calculate combined decimal odds (multiply all legs)
5. Payout = $${stake_amount || 50} × decimal_odds

MATH VERIFICATION:
- American to decimal: positive (e.g. +150) → (150/100)+1 = 2.50; negative (e.g. -110) → (100/110)+1 = 1.909
- Combined decimal = Leg1_decimal × Leg2_decimal × Leg3_decimal...
- American combined: if decimal > 2.0, American = (decimal-1)×100; if decimal < 2.0, American = -100/(decimal-1)

OUTPUT — respond ONLY with this exact JSON:
{
  "parlay_name": "Brief catchy name",
  "sport": "${sport}",
  "risk_level": "${risk_level}",
  "confidence": "High/Medium/Low",
  "legs": [
    {
      "match_description": "Team A vs Team B",
      "game_time": "7:00 PM ET",
      "pick": "Team A -5.5",
      "odds": "-110",
      "reasoning": "Specific reason with stats (e.g., Team A 8-2 ATS at home, opponent 2-8 on road, key injury to..."
    }
  ],
  "total_odds": "+450",
  "decimal_odds": 5.50,
  "stake_amount": ${stake_amount || 50},
  "potential_payout": 275,
  "potential_profit": 225,
  "reasoning": "2-3 sentences on overall strategy and why these legs complement each other",
  "risk_factors": ["Factor 1", "Factor 2"],
  "ai_confidence_score": 72,
  "data_sources": {
    "odds_source": "The Odds API (Live)",
    "stats_source": "ESPN, StatMuse, Pro-Football-Reference",
    "last_updated": "${new Date().toISOString()}"
  }
}`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    parlay_name: { type: "string" },
                    sport: { type: "string" },
                    risk_level: { type: "string" },
                    confidence: { type: "string" },
                    ai_confidence_score: { type: "number" },
                    legs: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                match_description: { type: "string" },
                                game_time: { type: "string" },
                                pick: { type: "string" },
                                odds: { type: "string" },
                                reasoning: { type: "string" }
                            },
                            required: ["match_description", "pick", "odds", "reasoning"]
                        }
                    },
                    total_odds: { type: "string" },
                    decimal_odds: { type: "number" },
                    stake_amount: { type: "number" },
                    potential_payout: { type: "number" },
                    potential_profit: { type: "number" },
                    reasoning: { type: "string" },
                    risk_factors: { type: "array", items: { type: "string" } },
                    data_sources: {
                        type: "object",
                        properties: {
                            odds_source: { type: "string" },
                            stats_source: { type: "string" },
                            last_updated: { type: "string" }
                        }
                    }
                },
                required: ["parlay_name", "sport", "risk_level", "legs", "total_odds", "stake_amount", "potential_payout", "reasoning"]
            }
        });

        if (!result || !result.legs || result.legs.length === 0) {
            throw new Error("Failed to generate valid parlay");
        }

        return Response.json(result);

    } catch (error) {
        console.error('Parlay generation error:', error);
        return Response.json({ 
            error: error.message || 'Failed to generate parlay' 
        }, { status: 500 });
    }
});
