import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const sportPrompts = {
  NFL: {
    players: "Search NFL.com and get the top 10 NFL players for the current 2024-2025 season. Include their name, team, and key stats (passing yards/touchdowns for QBs, rushing yards for RBs, receiving yards for WRs, etc).",
    teams: "Search TeamRankings.com and NFL.com to get the top 10 NFL teams by current standings. Include team name, wins, losses, and win percentage. Return exactly 10 teams ordered by best record."
  },
  MLB: {
    players: "Search MLB.com and get the top 10 MLB players for the current season. Include their name, team, and key stats (batting average, home runs, RBIs for hitters; ERA, strikeouts for pitchers).",
    teams: "Search MLB.com to get the top 10 MLB teams by current standings. Include team name, wins, losses, and win percentage. Return exactly 10 teams ordered by best record."
  },
  NBA: {
    players: "Search NBA.com and get the top 10 NBA players for the current 2024-2025 season. Include their name, team, and key stats (points per game, rebounds, assists).",
    teams: "Search NBA.com to get the top 10 NBA teams by current standings. Include team name, wins, losses, and win percentage. Return exactly 10 teams ordered by best record."
  },
  NHL: {
    players: "Search NHL.com and get the top 10 NHL players for the current 2024-2025 season. Include their name, team, and key stats (goals, assists, points).",
    teams: "Search NHL.com to get the top 10 NHL teams by current standings. Include team name, wins, losses, and win percentage. Return exactly 10 teams ordered by best record."
  },
  Soccer: {
    players: "Search Premier League official site and get the top 10 soccer players in the Premier League for the current season. Include their name, team, and key stats (goals, assists).",
    teams: "Search Premier League official site to get the top 10 Premier League teams by current standings. Include team name, wins, losses, and win percentage. Return exactly 10 teams ordered by best record."
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
                stats: { type: "string" }
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
                winPct: { type: "string" }
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