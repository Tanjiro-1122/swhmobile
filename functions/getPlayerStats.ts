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

Return comprehensive player data: name, team, position, sport, league, season stats, last 5 games with FULL DETAILED PER-GAME STATS (not just dates/opponents, but actual numbers for every stat), health status, next game prediction with betting insights, current odds/lines if available, strengths, weaknesses.

CRITICAL for recent_form array: Each game MUST include ALL statistical categories with actual numbers:
- Baseball: date, opponent, result, hits, at_bats, home_runs, rbis, stolen_bases, batting_average, strikeouts
- Basketball: date, opponent, result, points, rebounds, assists, steals, blocks, field_goals_made, field_goals_attempted, three_pointers_made, minutes_played
- Football: date, opponent, result, passing_yards, passing_touchdowns, rushing_yards, rushing_touchdowns, receptions, receiving_yards, receiving_touchdowns
- Hockey: date, opponent, result, goals, assists, points, plus_minus, shots_on_goal, time_on_ice
- Soccer: date, opponent, result, goals, assists, shots, shots_on_target, passes, pass_accuracy, tackles

Do NOT return empty or null values - provide actual game statistics.

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
            recent_form: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  date: { type: "string" },
                  opponent: { type: "string" },
                  result: { type: "string" },
                  hits: { type: "number" },
                  at_bats: { type: "number" },
                  home_runs: { type: "number" },
                  rbis: { type: "number" },
                  stolen_bases: { type: "number" },
                  strikeouts: { type: "number" },
                  batting_average: { type: "number" },
                  points: { type: "number" },
                  rebounds: { type: "number" },
                  assists: { type: "number" },
                  steals: { type: "number" },
                  blocks: { type: "number" },
                  field_goals_made: { type: "number" },
                  field_goals_attempted: { type: "number" },
                  three_pointers_made: { type: "number" },
                  minutes_played: { type: "number" },
                  passing_yards: { type: "number" },
                  passing_touchdowns: { type: "number" },
                  rushing_yards: { type: "number" },
                  rushing_touchdowns: { type: "number" },
                  receptions: { type: "number" },
                  receiving_yards: { type: "number" },
                  receiving_touchdowns: { type: "number" },
                  goals: { type: "number" },
                  shots_on_goal: { type: "number" },
                  time_on_ice: { type: "number" },
                  plus_minus: { type: "number" },
                  shots: { type: "number" },
                  shots_on_target: { type: "number" },
                  passes: { type: "number" },
                  pass_accuracy: { type: "number" },
                  tackles: { type: "number" }
                }
              } 
            },
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