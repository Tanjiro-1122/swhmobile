import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { withCache } from './utils/cache.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sport, type, forceRefresh } = await req.json();
    
    if (!sport || !type) {
      return Response.json({ error: 'Sport and type are required' }, { status: 400 });
    }

    const sources = {
      NFL: 'NFL.com & TeamRankings.com',
      MLB: 'MLB.com',
      NBA: 'NBA.com',
      NHL: 'NHL.com',
      Soccer: 'FIFA & Premier League'
    };

    const playerSchemas = {
      NFL: {
        name: { type: "string" },
        team: { type: "string" },
        position: { type: "string" },
        yds: { type: "number" },
        td: { type: "number" },
        cmp_att: { type: "string" },
        cmp_pct: { type: "number" },
        qbr: { type: "number" },
        rush_yds: { type: "number" },
        rec: { type: "number" },
        rec_yds: { type: "number" },
        total_td: { type: "number" }
      },
      MLB: {
        name: { type: "string" },
        team: { type: "string" },
        position: { type: "string" },
        avg: { type: "number" },
        hr: { type: "number" },
        rbi: { type: "number" },
        obp: { type: "number" },
        slg: { type: "number" },
        era: { type: "number" },
        w: { type: "number" },
        k: { type: "number" },
        whip: { type: "number" }
      },
      NBA: {
        name: { type: "string" },
        team: { type: "string" },
        position: { type: "string" },
        gp: { type: "number" },
        min: { type: "number" },
        pts: { type: "number" },
        reb: { type: "number" },
        ast: { type: "number" },
        fg_pct: { type: "number" },
        three_pct: { type: "number" }
      },
      NHL: {
        name: { type: "string" },
        team: { type: "string" },
        position: { type: "string" },
        gp: { type: "number" },
        g: { type: "number" },
        a: { type: "number" },
        pts: { type: "number" },
        plus_minus: { type: "number" },
        pim: { type: "number" },
        sog: { type: "number" },
        s_pct: { type: "number" },
        toi: { type: "string" }
      },
      Soccer: {
        name: { type: "string" },
        team: { type: "string" },
        position: { type: "string" },
        gp: { type: "number" },
        g: { type: "number" },
        a: { type: "number" },
        sot: { type: "number" },
        pass_pct: { type: "number" },
        tck: { type: "number" },
        min: { type: "number" },
        yc: { type: "number" },
        rc: { type: "number" }
      }
    };

    const playerPrompts = {
      NFL: `Search for the current top 10 best NFL players right now in the 2024-2025 season. For each player provide their current season stats: name, team, position, passing/rushing/receiving yards (yds), touchdowns (td), completion/attempts (cmp_att as string like "250/380"), completion percentage (cmp_pct), QBR (qbr), rushing yards (rush_yds), receptions (rec), receiving yards (rec_yds), and total touchdowns (total_td).`,
      MLB: `Search for the current top 10 best MLB players right now in the 2024-2025 season. For each player provide their current season stats: name, team, position, batting average (avg), home runs (hr), RBIs (rbi), on-base percentage (obp), slugging percentage (slg), ERA (era), wins (w), strikeouts (k), and WHIP (whip).`,
      NBA: `Search for the current top 10 best NBA players right now in the 2024-2025 season. For each player provide their current season stats: name, team, position, games played (gp), minutes per game (min), points per game (pts), rebounds per game (reb), assists per game (ast), field goal percentage (fg_pct), and three-point percentage (three_pct).`,
      NHL: `Search for the current top 10 best NHL players right now in the 2024-2025 season. For each player provide their current season stats: name, team, position, games played (gp), goals (g), assists (a), points (pts), plus/minus (plus_minus), penalty minutes (pim), shots on goal (sog), shooting percentage (s_pct), and time on ice (toi as string like "20:45").`,
      Soccer: `Search for the current top 10 best Soccer players right now in the 2024-2025 season. For each player provide their current season stats: name, team, position, games played (gp), goals (g), assists (a), shots on target (sot), pass completion percentage (pass_pct), tackles (tck), minutes played (min), yellow cards (yc), and red cards (rc).`
    };

    // Get current date for daily cache key
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${sport}:${type}:${today}`;

    if (forceRefresh) {
      console.log(`Force refresh requested for ${cacheKey}`);
    }

    const fetchData = async () => {
      if (type === 'players') {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `${playerPrompts[sport] || playerPrompts.NBA} Use the most recent data available from ${sources[sport] || sources.NBA}. Provide accurate 2024-2025 season statistics.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              players: {
                type: "array",
                items: {
                  type: "object",
                  properties: playerSchemas[sport] || playerSchemas.NBA
                }
              }
            }
          }
        });
        return result.players || [];
      } else {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Search for the current top 10 ${sport} team standings for 2024-2025 season. IMPORTANT: Return ONLY the top 10 teams, no more. For each team provide: name, wins (w), losses (l), win percentage (win_pct as decimal like 0.750), games back (gb as string or number), conference record (conf as string like "10-5"), division record (div as string like "5-2"), home record (home as string like "12-3"), road record (road as string like "8-7"), last 10 games record (last10 as string like "7-3"), and current streak (streak as string like "W3" or "L2"). Use the most recent standings from ${sources[sport] || sources.NBA}.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              teams: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    w: { type: "number" },
                    l: { type: "number" },
                    win_pct: { type: "string" },
                    gb: { type: "string" },
                    conf: { type: "string" },
                    div: { type: "string" },
                    home: { type: "string" },
                    road: { type: "string" },
                    last10: { type: "string" },
                    streak: { type: "string" }
                  }
                }
              }
            }
          }
        });
        return (result.teams || []).slice(0, 10);
      }
    };

    // Use cache with daily TTL (24 hours), skip cache if forceRefresh
    const data = forceRefresh 
      ? await fetchData() 
      : await withCache('sportsStats', cacheKey, fetchData);

    return Response.json({ 
      data, 
      cached: !forceRefresh,
      cacheKey 
    });

  } catch (error) {
    console.error('Error fetching top ten data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});