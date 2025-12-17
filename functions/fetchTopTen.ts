import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { LRUCache } from 'npm:lru-cache';

const cache = new LRUCache({
  max: 100, // cache up to 100 items
  ttl: 1000 * 60 * 60, // 1 hour
});

const sportPrompts = {
  NFL: {
    players: "Search NFL.com for the top 10 players for the 2024-2025 season. Return name, team, position, games played, and key stats like PassYds, RushYds, RecYds, TDs, Sacks, Tackles. Use the exact schema provided.",
    teams: "Search TeamRankings.com and NFL.com for top 10 NFL teams. Include name, wins, losses, win%, PF, PA, Diff, ATS, O/U, and last 5 games. Order by best record.",
    playerSchema: { type: "object", properties: { players: { type: "array", items: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, gamesPlayed: { type: "string" }, stat1: { type: "string", description: "Passing Yards for QBs, Rushing Yards for RBs, or Receiving Yards for WRs/TEs" }, stat2: { type: "string", description: "Total Touchdowns" }, stat3: { type: "string", description: "Sacks for defensive players, Receptions for offensive" }, stat4: { type: "string", description: "Tackles for defensive players, Passing TDs for QBs" } } } } } }
  },
  MLB: {
    players: "Search MLB.com for the top 10 players. Return name, team, position, games played, and key stats like AVG, HR, RBI, ERA, SO, Wins. Use the exact schema provided.",
    teams: "Search MLB.com for top 10 MLB teams. Include name, wins, losses, win%, runs per game, runs allowed, run differential, home/away record, and last 10 games. Order by best record.",
    playerSchema: { type: "object", properties: { players: { type: "array", items: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, gamesPlayed: { type: "string" }, stat1: { type: "string", description: "Batting Average for hitters, ERA for pitchers" }, stat2: { type: "string", description: "Home Runs for hitters, Strikeouts for pitchers" }, stat3: { type: "string", description: "RBIs for hitters, Wins for pitchers" }, stat4: { type: "string", description: "Hits for hitters, WHIP for pitchers" } } } } } }
  },
  NBA: {
    players: "Search NBA.com for the top 10 players for the 2024-2025 season. Return name, team, position, games played, and key stats like PPG, RPG, APG, SPG, BPG, FG%. Use the exact schema provided.",
    teams: "Search NBA.com for top 10 NBA teams. Include name, wins, losses, win%, PPG, points allowed, point differential, ATS, O/U, and last 10 games. Order by best record.",
    playerSchema: { type: "object", properties: { players: { type: "array", items: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, gamesPlayed: { type: "string" }, stat1: { type: "string", description: "Points Per Game" }, stat2: { type: "string", description: "Rebounds Per Game" }, stat3: { type: "string", description: "Assists Per Game" }, stat4: { type: "string", description: "Field Goal %" } } } } } }
  },
  NHL: {
    players: "Search NHL.com for the top 10 players for the 2024-2025 season. Return name, team, position, games played, and key stats like Goals, Assists, Points, +/-, Shots. Use the exact schema provided.",
    teams: "Search NHL.com for top 10 NHL teams. Include name, wins, losses, win%, GPG, GAG, goal differential, home/away record, and last 10 games. Order by best record.",
    playerSchema: { type: "object", properties: { players: { type: "array", items: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, gamesPlayed: { type: "string" }, stat1: { type: "string", description: "Goals" }, stat2: { type: "string", description: "Assists" }, stat3: { type: "string", description: "Total Points" }, stat4: { type: "string", description: "+/- Rating" } } } } } }
  },
 Soccer: {
    players: "Search Premier League site for top 10 players. Return name, team, position, games played, and key stats like Goals, Assists, Shots, Tackles, Key Passes. Use the exact schema provided.",
    teams: "Search Premier League site for top 10 teams. Include name, wins, losses, win%, GPG, GAG, goal differential, clean sheets, and last 6 games. Order by best record.",
    playerSchema: { type: "object", properties: { players: { type: "array", items: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, gamesPlayed: { type: "string" }, stat1: { type: "string", description: "Goals" }, stat2: { type: "string", description: "Assists" }, stat3: { type: "string", description: "Shots" }, stat4: { type: "string", description: "Tackles" } } } } } }
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

    const cacheKey = `top-ten-${sport}`;
    if (cache.has(cacheKey)) {
      return Response.json(cache.get(cacheKey));
    }

    // Fetch players
    const playersResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompts.players,
      add_context_from_internet: true,
      response_json_schema: prompts.playerSchema
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

    const result = {
      players: (playersResponse.players || []).slice(0, 10),
      teams: (teamsResponse.teams || []).slice(0, 10)
    };

    cache.set(cacheKey, result);

    return Response.json(result);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});