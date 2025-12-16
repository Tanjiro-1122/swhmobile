import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { sport } = body;

    console.log('[getSportsStats] Fetching stats for:', sport);

    if (!sport) {
      return Response.json({ error: 'Sport is required' }, { status: 400 });
    }

    // Simple, direct prompt for each sport
    const sportPrompts = {
      nfl: 'Search ESPN.com/nfl/standings and NFL.com for the current 2024-2025 NFL season. Return the top 10 teams by win percentage with their wins, losses, win%, points for, points against, current streak, and division. Also return the top 10 players by total stats (passing yards for QBs, rushing yards for RBs, receiving yards for WRs) with their team, position, and key stats.',
      nba: 'Search ESPN.com/nba/standings and NBA.com for the current 2024-2025 NBA season. Return the top 10 teams by win percentage with their wins, losses, win%, points for, points against, current streak, and conference. Also return the top 10 players by points per game with their team, position, PPG, APG, RPG, and games played.',
      mlb: 'Search ESPN.com/mlb and MLB.com for the 2024 MLB season final standings. Return the top 10 teams by win percentage with their wins, losses, win%, runs per game, runs allowed, final playoff result, and division. Also return the top 10 players by batting average or ERA with their team, position, and key stats.',
      nhl: 'Search ESPN.com/nhl/standings and NHL.com for the current 2024-2025 NHL season. Return the top 10 teams by points with their wins, losses, points percentage, goals for, goals against, current streak, and division. Also return the top 10 players by points with their team, position, goals, assists, plus/minus, and games played.',
      soccer: 'Search FIFA.com for current FIFA World Rankings. Return the top 10 national teams with their ranking, wins, losses, win percentage, goals for, goals against, recent form, and confederation. Also search top European leagues for the top 10 players by goals scored with their club, position, goals, assists, appearances, and games played.'
    };

    const prompt = sportPrompts[sport] || sportPrompts.nfl;

    // Use LLM with web search to get current data
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${prompt}

Return the data in this exact JSON format:
{
  "sport": "${sport}",
  "season": "2024-2025",
  "teams": [
    {"rank": 1, "name": "Team Name", "wins": 10, "losses": 2, "winPct": "0.833", "pointsFor": "28.5", "pointsAgainst": "18.2", "streak": "W3", "division": "Division Name"}
  ],
  "players": [
    {"rank": 1, "name": "Player Name", "team": "Team Name", "position": "POS", "stat1Label": "Stat Name", "stat1Value": "Value", "stat2Label": "Stat Name", "stat2Value": "Value", "stat3Label": "Stat Name", "stat3Value": "Value", "gamesPlayed": 15}
  ]
}

IMPORTANT: Return EXACTLY 10 teams and EXACTLY 10 players with ALL fields filled in. Use current real data from the websites.`,
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

    const data = result || {};
    
    console.log(`[getSportsStats] Success: ${sport} - teams=${data.teams?.length || 0}, players=${data.players?.length || 0}`);

    return Response.json({
      data: data,
      fetched_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[getSportsStats] Error:', error);
    return Response.json({
      error: 'Failed to fetch sports stats',
      details: error.message
    }, { status: 500 });
  }
});