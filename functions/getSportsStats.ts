import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { sport } = body;

    console.log('[getSportsStats] Fetching top 10 for:', sport);

    if (!sport) {
      return Response.json({ error: 'Sport is required' }, { status: 400 });
    }

    // Very simple prompts - just get top 10 teams and players
    const prompts = {
      nfl: 'Search ESPN NFL standings. Give me the top 10 NFL teams by record right now with: team name, wins, losses, win %, points per game, and division. Also give me top 10 NFL players by stats (QBs by yards, RBs by yards, WRs by yards) with: name, team, position, and their main stat.',
      nba: 'Search ESPN NBA standings. Give me the top 10 NBA teams by record right now with: team name, wins, losses, win %, points per game, and conference. Also give me top 10 NBA players by points per game with: name, team, position, PPG, assists, rebounds.',
      mlb: 'Search ESPN MLB standings. Give me the top 10 MLB teams from 2024 season with: team name, wins, losses, win %, runs per game, and division. Also give me top 10 MLB players by batting average or ERA with: name, team, position, and their main stats.',
      nhl: 'Search ESPN NHL standings. Give me the top 10 NHL teams by points right now with: team name, wins, losses, points, goals per game, and division. Also give me top 10 NHL players by points with: name, team, position, goals, and assists.',
      soccer: 'Search FIFA rankings. Give me the top 10 national soccer teams with: team name, ranking, recent record, and confederation. Also give me top 10 soccer players by goals in European leagues with: name, club team, position, goals, and league.'
    };

    const prompt = prompts[sport] || prompts.nfl;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${prompt}

Format as JSON with this structure:
{
  "sport": "${sport}",
  "season": "2024-2025",
  "teams": [{"rank": 1, "name": "Team Name", "wins": 10, "losses": 2, "winPct": "0.833", "pointsFor": "28.5", "pointsAgainst": "20.1", "streak": "W3", "division": "AFC West"}],
  "players": [{"rank": 1, "name": "Player Name", "team": "Team Name", "position": "QB", "stat1Label": "Pass Yds", "stat1Value": "3200", "stat2Label": "TD", "stat2Value": "24", "stat3Label": "INT", "stat3Value": "8", "gamesPlayed": 12}]
}

Give exactly 10 teams and 10 players with real current data.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          sport: { type: "string" },
          season: { type: "string" },
          teams: {
            type: "array",
            items: {
              type: "object",
              properties: {
                rank: { type: "number" },
                name: { type: "string" },
                wins: { type: "number" },
                losses: { type: "number" },
                winPct: { type: "string" },
                pointsFor: { type: "string" },
                pointsAgainst: { type: "string" },
                streak: { type: "string" },
                division: { type: "string" }
              }
            }
          },
          players: {
            type: "array",
            items: {
              type: "object",
              properties: {
                rank: { type: "number" },
                name: { type: "string" },
                team: { type: "string" },
                position: { type: "string" },
                stat1Label: { type: "string" },
                stat1Value: { type: "string" },
                stat2Label: { type: "string" },
                stat2Value: { type: "string" },
                stat3Label: { type: "string" },
                stat3Value: { type: "string" },
                gamesPlayed: { type: "number" }
              }
            }
          }
        }
      }
    });

    console.log(`[getSportsStats] Got ${result?.teams?.length || 0} teams, ${result?.players?.length || 0} players`);

    return Response.json({
      data: result || { sport, season: "2024-2025", teams: [], players: [] },
      fetched_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[getSportsStats] Error:', error);
    return Response.json({
      error: 'Failed to load stats',
      message: error.message
    }, { status: 500 });
  }
});