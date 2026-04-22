// api/getPlayerStats.js
// Real data pipeline: BallDontLie → TheSportsDB → OpenAI analysis

const BALLDONTLIE_KEY = process.env.BALLDONTLIE_API_KEY || "";
const SPORTSDB_KEY = process.env.THESPORTSDB_API_KEY || "123";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

async function safeFetch(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// BallDontLie — NBA player search
async function getBDLPlayer(name) {
  const data = await safeFetch(
    `https://api.balldontlie.io/v1/players?search=${encodeURIComponent(name)}&per_page=5`,
    { Authorization: BALLDONTLIE_KEY }
  );
  return data?.data?.[0] || null;
}

// BallDontLie — season averages for a player
async function getBDLAverages(playerId, season = 2024) {
  const data = await safeFetch(
    `https://api.balldontlie.io/v1/season_averages?season=${season}&player_ids[]=${playerId}`,
    { Authorization: BALLDONTLIE_KEY }
  );
  return data?.data?.[0] || null;
}

// BallDontLie — recent games for a player
async function getBDLRecentGames(playerId) {
  const data = await safeFetch(
    `https://api.balldontlie.io/v1/stats?player_ids[]=${playerId}&per_page=5&sort=game.date&order=desc`,
    { Authorization: BALLDONTLIE_KEY }
  );
  return data?.data || [];
}

// TheSportsDB — player search (works for all sports)
async function getSportsDBPlayer(name) {
  const data = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/searchplayers.php?p=${encodeURIComponent(name)}`
  );
  return data?.player?.[0] || null;
}

// TheSportsDB — next game for a team
async function getSportsDBNextGame(teamId) {
  const data = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventsnext.php?id=${teamId}`
  );
  return data?.events?.[0] || null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { query } = req.body || {};
  if (!query?.trim()) return res.status(400).json({ error: "Query is required" });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // === PARALLEL DATA FETCH ===
  const [bdlPlayer, sportsDBPlayer] = await Promise.all([
    getBDLPlayer(query),
    getSportsDBPlayer(query),
  ]);

  let bdlAverages = null;
  let bdlRecentGames = [];
  let nextGame = null;

  if (bdlPlayer?.id) {
    [bdlAverages, bdlRecentGames] = await Promise.all([
      getBDLAverages(bdlPlayer.id, 2024),
      getBDLRecentGames(bdlPlayer.id),
    ]);
  }

  if (sportsDBPlayer?.idTeam) {
    nextGame = await getSportsDBNextGame(sportsDBPlayer.idTeam);
  }

  // === BUILD REAL DATA CONTEXT ===
  let realDataContext = "";

  if (bdlPlayer) {
    realDataContext += `\nBALL DON'T LIE DATA:\n`;
    realDataContext += `Player: ${bdlPlayer.first_name} ${bdlPlayer.last_name}\n`;
    realDataContext += `Team: ${bdlPlayer.team?.full_name || "N/A"} | Position: ${bdlPlayer.position || "N/A"}\n`;
    if (bdlAverages) {
      realDataContext += `2024-25 Season Averages:\n`;
      realDataContext += `  PTS: ${bdlAverages.pts} | REB: ${bdlAverages.reb} | AST: ${bdlAverages.ast}\n`;
      realDataContext += `  STL: ${bdlAverages.stl} | BLK: ${bdlAverages.blk} | FG%: ${bdlAverages.fg_pct}\n`;
      realDataContext += `  3P%: ${bdlAverages.fg3_pct} | FT%: ${bdlAverages.ft_pct} | MIN: ${bdlAverages.min}\n`;
      realDataContext += `  Games: ${bdlAverages.games_played}\n`;
    }
    if (bdlRecentGames.length > 0) {
      realDataContext += `Recent Games (last ${bdlRecentGames.length}):\n`;
      bdlRecentGames.slice(0, 5).forEach(g => {
        realDataContext += `  ${g.game?.date?.slice(0,10)}: ${g.pts}pts ${g.reb}reb ${g.ast}ast vs ${g.game?.home_team_id === bdlPlayer.team?.id ? g.game?.visitor_team?.full_name : g.game?.home_team?.full_name || "opponent"}\n`;
      });
    }
  }

  if (sportsDBPlayer) {
    realDataContext += `\nTHESPORTSDB DATA:\n`;
    realDataContext += `Player: ${sportsDBPlayer.strPlayer} | Sport: ${sportsDBPlayer.strSport}\n`;
    realDataContext += `Team: ${sportsDBPlayer.strTeam} | Nationality: ${sportsDBPlayer.strNationality}\n`;
    realDataContext += `Position: ${sportsDBPlayer.strPosition} | Jersey: ${sportsDBPlayer.strNumber || "N/A"}\n`;
    if (sportsDBPlayer.strDescriptionEN) {
      realDataContext += `Bio: ${sportsDBPlayer.strDescriptionEN.slice(0, 300)}...\n`;
    }
    if (nextGame) {
      realDataContext += `\nNEXT GAME:\n`;
      realDataContext += `  ${nextGame.strHomeTeam} vs ${nextGame.strAwayTeam}\n`;
      realDataContext += `  Date: ${nextGame.dateEvent} at ${nextGame.strTime || "TBD"}\n`;
      realDataContext += `  Venue: ${nextGame.strVenue || "TBD"}\n`;
    }
  }

  if (!realDataContext) {
    realDataContext = `No live database data found for "${query}". Use your training knowledge for this player.`;
  }

  // === OPENAI ANALYSIS ===
  const systemPrompt = `You are a world-class sports analyst AI. Today is ${today}.

You have been given REAL live data from sports databases. Use it as your primary source — do NOT contradict it.

REAL DATA:\n${realDataContext}

Return ONLY valid JSON with this exact structure:
{
  "player_name": "Full Name",
  "sport": "NBA/NFL/MLB/NHL/Soccer/etc",
  "team": "Team Name",
  "position": "Position",
  "jersey_number": "##",
  "stats": {
    "season": "2024-25",
    "key_stats": [
      {"label": "Points Per Game", "value": "28.4"},
      {"label": "Rebounds", "value": "7.1"},
      {"label": "Assists", "value": "6.8"}
    ]
  },
  "recent_form": "2-3 sentence summary based on the real recent games data",
  "next_game": {
    "opponent": "Team Name",
    "date": "Day, Month DD",
    "time": "7:30 PM ET",
    "location": "Home/Away"
  },
  "ai_insight": "2-3 sentence analysis of current form, strengths, and what to watch — based on REAL stats",
  "wager_rating": {
    "score": 7,
    "label": "Strong Performer",
    "note": "Brief rationale based on actual stats"
  },
  "data_source": "BallDontLie + TheSportsDB"
}`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this player: ${query}` },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  const openaiData = await openaiRes.json();
  const raw = openaiData.choices?.[0]?.message?.content || "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: "Failed to parse AI response" });

  try {
    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch {
    return res.status(500).json({ error: "Invalid JSON from AI" });
  }
}
