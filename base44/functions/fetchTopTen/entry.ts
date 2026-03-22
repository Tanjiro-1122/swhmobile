import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { LRUCache } from 'npm:lru-cache';

const cache = new LRUCache({
  max: 100, // cache up to 100 items
  ttl: 1000 * 60 * 60, // 1 hour
});

const sportPrompts = {
  NFL: {
    players: "Search espn.com/nfl/stats for the top 10 players. Return name, team, position, gamesPlayed, passingYards, totalTds, sacksOrReceptions, and tacklesOrPassingTds. Use the exact schema provided.",
    teams: "Search espn.com/nfl/standings for top 10 NFL teams. Include name, wins, losses, win%, PF, PA, Diff, ATS, O/U, and last 5 games. Order by best record.",
    playerSchema: { type: "object", properties: { players: { type: "array", items: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, gamesPlayed: { type: "string" }, passingYards: { type: "string" }, totalTds: { type: "string" }, sacksOrReceptions: { type: "string" }, tacklesOrPassingTds: { type: "string" } } } } } }
  },
  MLB: {
    players: "Search espn.com/mlb/stats for the top 10 players. Return name, team, position, gamesPlayed, and key stats: avgOrEra, hrOrSo, rbiOrWins, hitsOrWhip. Use the exact schema provided.",
    teams: "Search espn.com/mlb/standings for top 10 MLB teams. Include name, wins, losses, winPct, pointsFor (as PF or Runs For), pointsAgainst (as PA or Runs Against), differential, ats (against the spread record), ou (over/under record), lastGames (last 10 games record as W-L string), homeRecord, and awayRecord. Order by best record.",
    playerSchema: { type: "object", properties: { players: { type: "array", items: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, gamesPlayed: { type: "string" }, avgOrEra: { type: "string" }, hrOrSo: { type: "string" }, rbiOrWins: { type: "string" }, hitsOrWhip: { type: "string" } } } } } }
  },
  NBA: {
    players: "Search espn.com/nba/stats for the top 10 players. Return name, team, position, gamesPlayed, and key stats: ppg, rpg, apg, fgPercentage. Use the exact schema provided.",
    teams: "Search espn.com/nba/standings for top 10 NBA teams. Include name, wins, losses, win%, PPG, points allowed, point differential, ATS, O/U, and last 10 games. Order by best record.",
    playerSchema: { type: "object", properties: { players: { type: "array", items: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, gamesPlayed: { type: "string" }, ppg: { type: "string" }, rpg: { type: "string" }, apg: { type: "string" }, fgPercentage: { type: "string" } } } } } }
  },
  NHL: {
    players: "Search espn.com/nhl/stats for the top 10 players. Return name, team, position, gamesPlayed, and key stats: goals, assists, points, plusMinus. Use the exact schema provided.",
    teams: "Search espn.com/nhl/standings for top 10 NHL teams. Include name, wins, losses, win%, GPG, GAG, goal differential, home/away record, and last 10 games. Order by best record.",
    playerSchema: { type: "object", properties: { players: { type: "array", items: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, gamesPlayed: { type: "string" }, goals: { type: "string" }, assists: { type: "string" }, points: { type: "string" }, plusMinus: { type: "string" } } } } } }
  },
 Soccer: {
    players: "Search espn.com/soccer/stats for top 10 players in a major league like Premier League. Return name, team, position, gamesPlayed, and key stats: goals, assists, shots, tackles. Use the exact schema provided.",
    teams: "Search espn.com/soccer/standings for top 10 teams. Include name, wins, losses, win%, GPG, GAG, goal differential, clean sheets, and last 6 games. Order by best record.",
    playerSchema: { type: "object", properties: { players: { type: "array", items: { type: "object", properties: { name: { type: "string" }, team: { type: "string" }, position: { type: "string" }, gamesPlayed: { type: "string" }, goals: { type: "string" }, assists: { type: "string" }, shots: { type: "string" }, tackles: { type: "string" } } } } } }
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