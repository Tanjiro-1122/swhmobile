import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const sportPrompts = {
  NFL: {
    players: "Search NFL.com and get the top 10 NFL players for the current 2024-2025 season. Include detailed stats: name, team, position, games played, passing yards, passing TDs, interceptions (for QBs), rushing yards, rushing TDs (for RBs), receptions, receiving yards, receiving TDs (for WRs/TEs), tackles, sacks (for defense). Also include yards per game average.",
    teams: "Search TeamRankings.com and NFL.com to get the top 10 NFL teams with betting-relevant stats. Include: team name, wins, losses, win percentage, points per game, points allowed per game, point differential, ATS record (against the spread), over/under record, and last 5 games form (e.g., 'W-L-W-W-L'). Return exactly 10 teams ordered by best record."
  },
  MLB: {
    players: "Search MLB.com and get the top 10 MLB players for the current season. Include detailed stats: name, team, position, games played, batting average, home runs, RBIs, hits, stolen bases, OBP (for hitters), ERA, wins, strikeouts, WHIP, innings pitched (for pitchers).",
    teams: "Search MLB.com to get the top 10 MLB teams with betting-relevant stats. Include: team name, wins, losses, win percentage, runs per game, runs allowed per game, run differential, home record, away record, and last 10 games form. Return exactly 10 teams ordered by best record."
  },
  NBA: {
    players: "Search NBA.com and get the top 10 NBA players for the current 2024-2025 season. Include detailed stats: name, team, position, games played, points per game, rebounds per game, assists per game, steals, blocks, field goal percentage, three-point percentage, minutes per game.",
    teams: "Search NBA.com to get the top 10 NBA teams with betting-relevant stats. Include: team name, wins, losses, win percentage, points per game, points allowed per game, point differential, ATS record, over/under record, and last 10 games form. Return exactly 10 teams ordered by best record."
  },
  NHL: {
    players: "Search NHL.com and get the top 10 NHL players for the current 2024-2025 season. Include detailed stats: name, team, position, games played, goals, assists, total points, plus/minus, penalty minutes, power play goals, shots on goal, shooting percentage.",
    teams: "Search NHL.com to get the top 10 NHL teams with betting-relevant stats. Include: team name, wins, losses, win percentage, goals per game, goals allowed per game, goal differential, home record, away record, and last 10 games form. Return exactly 10 teams ordered by best record."
  },
  Soccer: {
    players: "Search Premier League official site and get the top 10 soccer players in the Premier League for the current season. Include detailed stats: name, team, position, games played, goals, assists, shots per game, shot accuracy, passes per game, pass accuracy, tackles, key passes.",
    teams: "Search Premier League official site to get the top 10 Premier League teams with betting-relevant stats. Include: team name, wins, losses, win percentage, goals per game, goals allowed per game, goal differential, clean sheets, and last 6 games form. Return exactly 10 teams ordered by best record."
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sport } = await req.json();
    const prompts = sportPrompts[sport] || sportPrompts.NFL;

    // Fetch players
    const playersResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompts.players,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          players: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                team: { type: "string" },
                position: { type: "string" },
                gamesPlayed: { type: "string" },
                stat1: { type: "string" },
                stat2: { type: "string" },
                stat3: { type: "string" },
                stat4: { type: "string" },
                stat5: { type: "string" },
                stat6: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Fetch teams
    const teamsResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompts.teams,
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
                wins: { type: "number" },
                losses: { type: "number" },
                winPct: { type: "string" },
                pointsFor: { type: "string" },
                pointsAgainst: { type: "string" },
                differential: { type: "string" },
                ats: { type: "string" },
                ou: { type: "string" },
                lastGames: { type: "string" },
                homeRecord: { type: "string" },
                awayRecord: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({
      players: (playersResponse.players || []).slice(0, 10),
      teams: (teamsResponse.teams || []).slice(0, 10)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});