import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // AUTH CHECK - THIS WAS MISSING!
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sport } = body;

    console.log('[getSportsStats] Fetching top 10 for:', sport);

    if (!sport) {
      return Response.json({ error: 'Sport is required' }, { status: 400 });
    }

    // Sport-specific prompts targeting specific websites
    const prompts = {
      nfl: 'Search NFL.com/standings and teamrankings.com/nfl for current 2024-2025 NFL season. Get the top 10 teams by record with: team name, wins, losses, win percentage, points for (ppg), points against (ppg), current streak, division. Also search NFL.com/stats for top 10 players (mix of QBs, RBs, WRs) with: name, team, position, primary stat label, primary stat value, secondary stat label, secondary stat value, tertiary stat label, tertiary stat value, games played.',
      nba: 'Search ESPN.com/nba/standings for current 2024-2025 NBA season. Get the top 10 teams by record with: team name, wins, losses, win percentage, points for (ppg), points against (ppg), current streak, conference/division. Also search ESPN.com/nba/stats for top 10 players by PPG with: name, team, position, PPG, APG, RPG, FG%, games played.',
      mlb: 'Search ESPN.com/mlb/standings for 2024 MLB final season standings. Get the top 10 teams with: team name, wins, losses, win percentage, runs per game, runs allowed per game, final result/streak, division. Also search ESPN.com/mlb/stats for top 10 players (mix of batters and pitchers) with: name, team, position, primary stat, value, secondary stat, value, tertiary stat, value, games played.',
      nhl: 'Search ESPN.com/nhl/standings for current 2024-2025 NHL season. Get the top 10 teams by points with: team name, wins, losses, win percentage, goals for (ppg), goals against (ppg), current streak, division. Also search ESPN.com/nhl/stats for top 10 players by points with: name, team, position, goals, assists, points, +/-, games played.',
      soccer: 'Search FIFA.com/rankings for current FIFA national team rankings. Get the top 10 national teams with: team name, wins (recent 10), losses (recent 10), win percentage, goals for (avg), goals against (avg), current streak, confederation. Also search transfermarkt.com for top 10 players from European leagues with: name, club team, position, goals, assists, apps, market value, games played.'
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

    // Validate and clean response
    const data = result || {};
    const teams = Array.isArray(data.teams) ? data.teams.slice(0, 10) : [];
    const players = Array.isArray(data.players) ? data.players.slice(0, 10) : [];

    // Log if we got incomplete data
    if (teams.length < 10 || players.length < 10) {
      console.warn(`[getSportsStats] Incomplete data: ${teams.length} teams, ${players.length} players`);
    }

    return Response.json({
      data: {
        sport: data.sport || sport,
        season: data.season || "2024-2025",
        teams,
        players
      },
      validation: {
        teamsCount: teams.length,
        playersCount: players.length,
        complete: teams.length === 10 && players.length === 10
      },
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