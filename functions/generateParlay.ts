import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sport, risk_level, stake_amount } = await req.json();

        if (!sport || !risk_level) {
            return Response.json({ 
                error: 'Missing required parameters: sport and risk_level' 
            }, { status: 400 });
        }

        // Check cache first (24 hour cache - once daily)
        const CACHE_HOURS = 24;
        const todayDate = new Date().toISOString().split('T')[0];
        const cacheKey = `${sport}_${risk_level}_${todayDate}`;
        
        const cached = await base44.entities.CachedParlay.filter({ cache_key: cacheKey });
        const now = new Date();
        
        if (cached.length > 0) {
            const cacheEntry = cached[0];
            const expiresAt = new Date(cacheEntry.expires_at);
            
            if (expiresAt > now && cacheEntry.parlay_data) {
                console.log('Using cached parlay for', cacheKey);
                return Response.json(cacheEntry.parlay_data);
            }
        }

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a professional sports betting analyst with REAL-TIME INTERNET ACCESS. Generate a parlay bet for the user.

SEARCH REQUIREMENTS:
1. Search for TODAY'S games in ${sport}
2. Use StatMuse.com, ESPN.com, and official league sites for live data
3. Find games happening TODAY: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

USER PARAMETERS:
- Sport: ${sport}
- Risk Level: ${risk_level}
- Stake Amount: $${stake_amount || 50}

RISK LEVEL GUIDELINES:
${risk_level === 'conservative' ? `
CONSERVATIVE (Low Risk, Higher Win Probability):
- Include 2-3 legs only
- Focus on heavy favorites (win probability >65%)
- Prefer moneylines and small spreads
- Target combined odds: +150 to +250
- Expected win rate: 35-45%
` : risk_level === 'balanced' ? `
BALANCED (Moderate Risk, Moderate Reward):
- Include 3-4 legs
- Mix of favorites and underdogs
- Include spread bets and totals
- Target combined odds: +250 to +500
- Expected win rate: 20-35%
` : `
AGGRESSIVE (High Risk, High Reward):
- Include 4-6 legs
- Include underdogs and prop bets
- Higher-risk spread bets and player props
- Target combined odds: +500 to +1500
- Expected win rate: 10-20%
`}

PARLAY CONSTRUCTION PROCESS:

STEP 1 - Find Today's Games:
Search: "${sport} games today ${new Date().toLocaleDateString()}" on ESPN.com
- Identify 5-8 games happening TODAY
- Note game times, matchups, and current odds

STEP 2 - Analyze Each Game:
For each game, gather:
- Current odds (moneyline, spread, over/under)
- Team records and recent form (last 5 games)
- Injury reports
- Head-to-head history
- Home/away splits

STEP 3 - Select Value Bets:
Identify bets that meet the risk profile:
- Check for line value (sharp money indicators)
- Look for trends (team on hot streak, opponent struggling)
- Consider matchup advantages
- Verify injury impact

STEP 4 - Build the Parlay:
Select ${risk_level === 'conservative' ? '2-3' : risk_level === 'balanced' ? '3-4' : '4-6'} legs that:
- Have good statistical backing
- Don't conflict (avoid opposite sides of same game)
- Fit the risk profile
- Combine to target odds range

STEP 5 - Calculate Odds and Payout:
- Convert American odds to decimal for each leg
- Multiply decimal odds: Leg1 × Leg2 × Leg3...
- Convert back to American odds format
- Calculate potential payout: stake × decimal odds

OUTPUT FORMAT (REQUIRED JSON):
{
  "parlay_name": "Brief catchy name",
  "sport": "${sport}",
  "risk_level": "${risk_level}",
  "confidence": "High/Medium/Low",
  "legs": [
    {
      "match_description": "Team A vs Team B",
      "game_time": "7:00 PM ET",
      "pick": "Team A -5.5" or "Over 220.5" or "Team A ML",
      "odds": "-110",
      "reasoning": "Specific stats why this pick (e.g., 'Team A 8-2 at home, opponent 2-8 on road')"
    }
  ],
  "total_odds": "+450",
  "decimal_odds": 5.50,
  "stake_amount": ${stake_amount || 50},
  "potential_payout": 275,
  "potential_profit": 225,
  "reasoning": "2-3 sentences explaining the overall parlay strategy and why these legs work together",
  "risk_factors": ["Factor 1", "Factor 2"],
  "data_sources": {
    "odds_source": "Source name",
    "stats_source": "StatMuse, ESPN",
    "last_updated": "${new Date().toISOString()}"
  }
}

VALIDATION CHECKLIST:
✓ All games are TODAY (${new Date().toLocaleDateString()})
✓ All odds are current (within last 24 hours)
✓ Each leg has specific reasoning with stats
✓ Total odds match calculated decimal odds
✓ Payout calculation is correct: stake × decimal_odds
✓ Legs don't conflict with each other
✓ Risk level matches leg count and odds range

FAILURE CONDITIONS:
If no games today: Return error in reasoning: "No ${sport} games scheduled for today. Please try a different sport or check back on a game day."

Generate the parlay with VERIFIED LIVE DATA for TODAY'S games only.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    parlay_name: { type: "string" },
                    sport: { type: "string" },
                    risk_level: { type: "string" },
                    confidence: { type: "string" },
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
                    risk_factors: {
                        type: "array",
                        items: { type: "string" }
                    },
                    data_sources: {
                        type: "object",
                        properties: {
                            odds_source: { type: "string" },
                            stats_source: { type: "string" },
                            last_updated: { type: "string" }
                        }
                    }
                },
                required: [
                    "parlay_name",
                    "sport",
                    "risk_level",
                    "legs",
                    "total_odds",
                    "stake_amount",
                    "potential_payout",
                    "reasoning"
                ]
            }
        });

        if (!result || !result.legs || result.legs.length === 0) {
            throw new Error("Failed to generate valid parlay");
        }

        // Cache the result for 6 hours
        const expiresAt = new Date(now.getTime() + CACHE_HOURS * 60 * 60 * 1000);
        if (cached.length > 0) {
            await base44.entities.CachedParlay.delete(cached[0].id);
        }
        await base44.entities.CachedParlay.create({
            cache_key: cacheKey,
            parlay_data: result,
            expires_at: expiresAt.toISOString()
        });

        return Response.json(result);

    } catch (error) {
        console.error('Parlay generation error:', error);
        return Response.json({ 
            error: error.message || 'Failed to generate parlay' 
        }, { status: 500 });
    }
});