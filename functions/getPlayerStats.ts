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
        prompt: `Search for athlete: "${query}" across ALL available sources including:
- ESPN.com (stats, schedules, injury reports)
- Official league sites (NBA.com, NFL.com, MLB.com, NHL.com, MLS.com)
- Sports databases (Basketball-Reference, Pro-Football-Reference)
- The Odds API (betting lines, props, odds movements)
- TheScore, Bleacher Report (recent news, updates)
- FanDuel, DraftKings (fantasy projections, player props)

Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Return comprehensive player data: name, team, position, sport, league, season stats, last 5 games with detailed stats, health status, next game prediction with betting insights, current odds/lines if available, strengths, weaknesses.

IMPORTANT FIELDS:
- role: Must be one of "Starter", "Bench", "Sixth Man", "Rotation", or "Unknown" - indicate if player starts or comes off bench
- health_status: Must be one of "Healthy", "Day-to-Day", "Out 1-2 Weeks", "Out 2-4 Weeks", "Out 4-6 Weeks", "Out 6+ Weeks", or "Out for Season"
- injury_details: If not healthy, specify the injury (e.g., "Sprained ankle", "Hamstring strain")

Stats by sport:
- Basketball: PPG, RPG, APG, SPG, BPG, 3PM, FG%, FT%, minutes
- Football: passing/rushing/receiving yards, TDs, completions, targets
- Baseball: AVG, HR, RBI, SB (batters) or ERA, K, W, WHIP (pitchers)
- Hockey: G, A, PTS, +/-, SOG, TOI
- Soccer: goals, assists, shots, key passes, tackles

Include current betting lines/props if available.
If no next game scheduled, say TBD.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            player_name: { type: "string" },
            sport: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            role: { type: "string", enum: ["Starter", "Bench", "Sixth Man", "Rotation", "Unknown"] },
            league: { type: "string" },
            season_averages: { type: "object" },
            recent_form: { type: "array", items: { type: "object" } },
            health_status: { type: "string", enum: ["Healthy", "Day-to-Day", "Out 1-2 Weeks", "Out 2-4 Weeks", "Out 4-6 Weeks", "Out 6+ Weeks", "Out for Season"] },
            injury_details: { type: "string" },
            next_game: {
              type: "object",
              properties: {
                opponent: { type: "string" },
                date: { type: "string" },
                location: { type: "string" },
                predicted_performance: { type: "string" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              }
            },
            betting_insights: { type: "object" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } }
          },
          required: ["player_name", "sport", "team"]
        }
      });
    
    return Response.json(result);

  } catch (error) {
    console.error('Player stats error:', error);
    console.error('Error stack:', error.stack);
    console.error('Query was:', await req.clone().json());
    return Response.json({ 
      error: error.message || 'An error occurred fetching player stats',
      details: error.toString(),
      type: 'player_stats_error'
    }, { status: 500 });
  }
});