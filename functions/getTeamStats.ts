import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();
    
    const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for team: "${query}" - PRIORITIZE THESE SOURCES IN THIS ORDER:

PRIMARY SOURCE (CHECK FIRST):
1. The Odds API - MUST check for current odds, spreads, totals, moneylines, betting trends

SECONDARY SOURCES:
2. ESPN.com (standings, schedules, team stats)
3. Official league sites (NBA.com, NFL.com, MLB.com, NHL.com, MLS.com)
4. Sports databases (Basketball-Reference, Pro-Football-Reference)
5. TeamRankings.com (advanced analytics)
6. TheScore, Bleacher Report (team news, analysis)
7. Sportsbooks (FanDuel, DraftKings, BetMGM for additional lines)

Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Return comprehensive team data: team name, sport, league, current record, standings position, season averages (offense/defense), last 5 games with detailed scores and stats, next game prediction with betting lines (spread, moneyline, total), key players, injuries, current odds from multiple books if available, strengths, weaknesses.

Include betting context:
- Current spread and movement
- Over/under totals
- Moneyline odds
- Recent betting trends
- Home/away splits
- ATS (Against The Spread) record

If no next game scheduled, say TBD.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            team_name: { type: "string" },
            sport: { type: "string" },
            league: { type: "string" },
            current_record: { type: "object" },
            season_averages: { type: "object" },
            last_five_games: { type: "array", items: { type: "object" } },
            form: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            key_players: { type: "array", items: { type: "string" } },
            injuries: { type: "array", items: { type: "object" } },
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
              }
            }
          },
          required: ["team_name", "sport"]
        }
      });
    
    return Response.json(result);

  } catch (error) {
    console.error('Team stats error:', error);
    console.error('Error stack:', error.stack);
    console.error('Query was:', await req.clone().json());
    return Response.json({ 
      error: error.message || 'An error occurred fetching team stats',
      details: error.toString(),
      type: 'team_stats_error'
    }, { status: 500 });
  }
});