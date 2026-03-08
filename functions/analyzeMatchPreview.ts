import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { home_team, away_team, sport } = await req.json();
    
    if (!home_team || !away_team) {
      return Response.json({ error: 'Both home_team and away_team are required' }, { status: 400 });
    }

    const matchQuery = `${home_team} vs ${away_team} ${sport || ''}`.trim();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // Run all analysis perspectives in parallel
    const [matchOverview, headToHead, keyMatchups, bettingMarkets] = await Promise.all([
      // 1. Match Overview & Statistical Breakdown
      base44.integrations.Core.InvokeLLM({
        prompt: `DEEP MATCH PREVIEW: ${matchQuery}
TODAY: ${today}

You are an elite sports analyst providing a COMPREHENSIVE match preview. Search for the LATEST real data.

Provide:
1. TEAM RECORDS: Current season record, home/away splits, recent form (last 5 games)
2. OFFENSIVE STATS: Points/goals per game, shooting %, key offensive metrics
3. DEFENSIVE STATS: Points/goals allowed, defensive efficiency, turnovers forced
4. INJURY REPORT: All current injuries for both teams with impact assessment
5. PREDICTION: Winner, predicted score, confidence level with reasoning
6. KEY FACTORS: Top 5 factors that will decide this game

Be specific with real numbers. Do not make up stats.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sport: { type: "string" },
            league: { type: "string" },
            match_date: { type: "string" },
            venue: { type: "string" },
            home_team: {
              type: "object",
              properties: {
                name: { type: "string" },
                record: { type: "string" },
                home_record: { type: "string" },
                recent_form: { type: "string" },
                ppg: { type: "number" },
                opp_ppg: { type: "number" },
                offensive_rating: { type: "number" },
                defensive_rating: { type: "number" },
                key_stats: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } } } },
                injuries: { type: "array", items: { type: "object", properties: { player: { type: "string" }, status: { type: "string" }, impact: { type: "string" } } } }
              }
            },
            away_team: {
              type: "object",
              properties: {
                name: { type: "string" },
                record: { type: "string" },
                away_record: { type: "string" },
                recent_form: { type: "string" },
                ppg: { type: "number" },
                opp_ppg: { type: "number" },
                offensive_rating: { type: "number" },
                defensive_rating: { type: "number" },
                key_stats: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } } } },
                injuries: { type: "array", items: { type: "object", properties: { player: { type: "string" }, status: { type: "string" }, impact: { type: "string" } } } }
              }
            },
            prediction: {
              type: "object",
              properties: {
                winner: { type: "string" },
                predicted_score: { type: "string" },
                home_win_probability: { type: "number" },
                away_win_probability: { type: "number" },
                draw_probability: { type: "number" },
                confidence: { type: "string" },
                confidence_numeric: { type: "number" },
                reasoning: { type: "string" }
              }
            },
            key_factors: { type: "array", items: { type: "object", properties: { factor: { type: "string" }, description: { type: "string" }, favors: { type: "string" } } } }
          }
        }
      }),

      // 2. Head-to-Head History
      base44.integrations.Core.InvokeLLM({
        prompt: `HEAD-TO-HEAD HISTORY: ${matchQuery}

Search for the last 5-10 matchups between these teams. For each game provide the date, score, venue, and a brief note.
Also provide overall H2H stats: total wins for each side, average score, trends.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            total_meetings: { type: "number" },
            home_team_wins: { type: "number" },
            away_team_wins: { type: "number" },
            draws: { type: "number" },
            avg_combined_score: { type: "number" },
            trend_summary: { type: "string" },
            recent_meetings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  score: { type: "string" },
                  winner: { type: "string" },
                  venue: { type: "string" },
                  note: { type: "string" }
                }
              }
            }
          }
        }
      }),

      // 3. Key Player Matchups
      base44.integrations.Core.InvokeLLM({
        prompt: `KEY PLAYER MATCHUPS: ${matchQuery}

Identify the 3-4 most important individual player matchups that will decide this game.
For each matchup, provide both players' season stats and who has the edge and why.
Also identify 2 X-factors (role players or bench players who could swing the game).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            key_matchups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  matchup_title: { type: "string" },
                  player_a: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, season_stats: { type: "string" }, recent_form: { type: "string" } } },
                  player_b: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, season_stats: { type: "string" }, recent_form: { type: "string" } } },
                  edge: { type: "string" },
                  edge_reason: { type: "string" }
                }
              }
            },
            x_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  player_name: { type: "string" },
                  team: { type: "string" },
                  reason: { type: "string" },
                  impact_potential: { type: "string" }
                }
              }
            }
          }
        }
      }),

      // 4. Betting Markets Analysis
      base44.integrations.Core.InvokeLLM({
        prompt: `BETTING MARKETS ANALYSIS: ${matchQuery}

Analyze the current betting landscape for this matchup. Provide:
1. Moneyline odds for both teams
2. Point spread/handicap
3. Over/Under total
4. Key prop bets to watch
5. Where the value lies (best bets)
6. Sharp money indicators and line movement trends

Use real current odds data from sportsbooks.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            moneyline: { type: "object", properties: { home: { type: "string" }, away: { type: "string" } } },
            spread: { type: "object", properties: { line: { type: "string" }, home_odds: { type: "string" }, away_odds: { type: "string" } } },
            over_under: { type: "object", properties: { total: { type: "number" }, over_odds: { type: "string" }, under_odds: { type: "string" }, ai_lean: { type: "string" } } },
            prop_bets: { type: "array", items: { type: "object", properties: { description: { type: "string" }, odds: { type: "string" }, ai_recommendation: { type: "string" } } } },
            best_bets: { type: "array", items: { type: "object", properties: { bet: { type: "string" }, reasoning: { type: "string" }, confidence: { type: "string" } } } },
            sharp_money: { type: "string" },
            line_movement: { type: "string" }
          }
        }
      })
    ]);

    return Response.json({
      overview: matchOverview,
      head_to_head: headToHead,
      key_matchups: keyMatchups,
      betting_markets: bettingMarkets,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Match preview error:', error);
    return Response.json({ error: error.message || 'Failed to generate match preview' }, { status: 500 });
  }
});