// api/getTeamStats.js
// Real data pipeline: BallDontLie → TheSportsDB → The Odds API → OpenAI analysis

const BALLDONTLIE_KEY = process.env.BALLDONTLIE_API_KEY || "";
const SPORTSDB_KEY = process.env.THESPORTSDB_API_KEY || "123";
const ODDS_KEY = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

async function safeFetch(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// BallDontLie — team search
async function getBDLTeam(name) {
  const data = await safeFetch(
    `https://api.balldontlie.io/v1/teams?search=${encodeURIComponent(name)}`,
    { Authorization: BALLDONTLIE_KEY }
  );
  return data?.data?.[0] || null;
}

// BallDontLie — team season standings/stats (via games)
async function getBDLTeamRecord(teamId, season = 2024) {
  const data = await safeFetch(
    `https://api.balldontlie.io/v1/games?seasons[]=${season}&team_ids[]=${teamId}&per_page=100`,
    { Authorization: BALLDONTLIE_KEY }
  );
  if (!data?.data) return null;
  const games = data.data.filter(g => g.status === "Final");
  let wins = 0, losses = 0;
  games.forEach(g => {
    const isHome = g.home_team?.id === teamId;
    const teamScore = isHome ? g.home_team_score : g.visitor_team_score;
    const oppScore = isHome ? g.visitor_team_score : g.home_team_score;
    if (teamScore > oppScore) wins++; else losses++;
  });
  const totalPts = games.reduce((sum, g) => {
    return sum + (g.home_team?.id === teamId ? g.home_team_score : g.visitor_team_score);
  }, 0);
  const totalAllowed = games.reduce((sum, g) => {
    return sum + (g.home_team?.id === teamId ? g.visitor_team_score : g.home_team_score);
  }, 0);
  return {
    wins, losses,
    ppg: games.length ? (totalPts / games.length).toFixed(1) : "N/A",
    papg: games.length ? (totalAllowed / games.length).toFixed(1) : "N/A",
    gamesPlayed: games.length,
    recentGames: games.slice(-5).reverse(),
    teamId,
  };
}

// TheSportsDB — team search
async function getSportsDBTeam(name) {
  const data = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/searchteams.php?t=${encodeURIComponent(name)}`
  );
  return data?.teams?.[0] || null;
}

// TheSportsDB — next events for team
async function getSportsDBNextEvents(teamId) {
  const data = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventsnext.php?id=${teamId}`
  );
  return data?.events?.slice(0, 3) || [];
}

// TheSportsDB — last 5 events
async function getSportsDBLastEvents(teamId) {
  const data = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventslast.php?id=${teamId}`
  );
  return data?.results?.slice(0, 5) || [];
}

// The Odds API — upcoming odds for this team
async function getTeamOdds(teamName) {
  // Try NBA first, then NFL, then MLB
  const sports = ["basketball_nba", "americanfootball_nfl", "baseball_mlb", "icehockey_nhl"];
  for (const sport of sports) {
    const data = await safeFetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings`
    );
    if (!data) continue;
    const match = data.find(game =>
      game.home_team?.toLowerCase().includes(teamName.toLowerCase()) ||
      game.away_team?.toLowerCase().includes(teamName.toLowerCase())
    );
    if (match) return { sport, game: match };
  }
  return null;
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

  // === PARALLEL FETCH ===
  const [bdlTeam, sportsDBTeam] = await Promise.all([
    getBDLTeam(query),
    getSportsDBTeam(query),
  ]);

  let bdlRecord = null;
  let nextEvents = [];
  let lastEvents = [];
  let oddsData = null;

  const parallelTasks = [];
  if (bdlTeam?.id) parallelTasks.push(getBDLTeamRecord(bdlTeam.id, 2024).then(d => { bdlRecord = d; }));
  if (sportsDBTeam?.idTeam) {
    parallelTasks.push(getSportsDBNextEvents(sportsDBTeam.idTeam).then(d => { nextEvents = d; }));
    parallelTasks.push(getSportsDBLastEvents(sportsDBTeam.idTeam).then(d => { lastEvents = d; }));
  }
  parallelTasks.push(getTeamOdds(query).then(d => { oddsData = d; }));
  await Promise.all(parallelTasks);

  // === BUILD REAL DATA CONTEXT ===
  let realDataContext = "";

  if (bdlTeam) {
    realDataContext += `\nBALL DON'T LIE DATA:\n`;
    realDataContext += `Team: ${bdlTeam.full_name} | City: ${bdlTeam.city}\n`;
    realDataContext += `Conference: ${bdlTeam.conference} | Division: ${bdlTeam.division}\n`;
    if (bdlRecord) {
      realDataContext += `2024-25 Record: ${bdlRecord.wins}-${bdlRecord.losses} (${bdlRecord.gamesPlayed} games)\n`;
      realDataContext += `PPG: ${bdlRecord.ppg} | Points Allowed Per Game: ${bdlRecord.papg}\n`;
      if (bdlRecord.recentGames?.length > 0) {
        realDataContext += `Last 5 Results:\n`;
        bdlRecord.recentGames.forEach(g => {
          const isHome = g.home_team?.id === bdlTeam.id;
          const teamScore = isHome ? g.home_team_score : g.visitor_team_score;
          const oppScore = isHome ? g.visitor_team_score : g.home_team_score;
          const opp = isHome ? g.visitor_team?.full_name : g.home_team?.full_name;
          const result = teamScore > oppScore ? "W" : "L";
          realDataContext += `  ${result} ${teamScore}-${oppScore} vs ${opp} (${g.date?.slice(0,10)})\n`;
        });
      }
    }
  }

  if (sportsDBTeam) {
    realDataContext += `\nTHESPORTSDB DATA:\n`;
    realDataContext += `Team: ${sportsDBTeam.strTeam} | League: ${sportsDBTeam.strLeague}\n`;
    realDataContext += `Stadium: ${sportsDBTeam.strStadium || "N/A"} | Capacity: ${sportsDBTeam.intStadiumCapacity || "N/A"}\n`;
    if (sportsDBTeam.strDescriptionEN) {
      realDataContext += `About: ${sportsDBTeam.strDescriptionEN.slice(0, 200)}...\n`;
    }
    if (lastEvents.length > 0) {
      realDataContext += `Recent Results (TheSportsDB):\n`;
      lastEvents.forEach(e => {
        realDataContext += `  ${e.dateEvent}: ${e.strHomeTeam} ${e.intHomeScore}-${e.intAwayScore} ${e.strAwayTeam}\n`;
      });
    }
    if (nextEvents.length > 0) {
      realDataContext += `Upcoming Games:\n`;
      nextEvents.slice(0, 2).forEach(e => {
        realDataContext += `  ${e.dateEvent} ${e.strTime || ""}: ${e.strHomeTeam} vs ${e.strAwayTeam} @ ${e.strVenue || "TBD"}\n`;
      });
    }
  }

  if (oddsData?.game) {
    const g = oddsData.game;
    realDataContext += `\nLIVE ODDS (DraftKings):\n`;
    realDataContext += `${g.home_team} vs ${g.away_team}\n`;
    const dk = g.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
    dk.forEach(o => { realDataContext += `  ${o.name}: ${o.price > 0 ? "+" : ""}${o.price}\n`; });
    realDataContext += `Game Time: ${g.commence_time}\n`;
  }

  if (!realDataContext) {
    realDataContext = `No live database data found for "${query}". Use your training knowledge.`;
  }

  // === OPENAI ANALYSIS ===
  const systemPrompt = `You are a world-class sports analyst AI. Today is ${today}.

You have been given REAL live data from multiple sports databases. Use it as your primary source.

REAL DATA:\n${realDataContext}

Return ONLY valid JSON:
{
  "team_name": "Full Team Name",
  "sport": "NBA/NFL/MLB/NHL/etc",
  "league": "Conference/League",
  "city": "City",
  "record": { "wins": 42, "losses": 28, "display": "42-28" },
  "standing": "3rd in Eastern Conference",
  "stats": {
    "season": "2024-25",
    "key_stats": [
      {"label": "Points Per Game", "value": "118.3"},
      {"label": "Points Allowed", "value": "112.1"},
      {"label": "Home Record", "value": "24-12"}
    ]
  },
  "recent_form": "2-3 sentences based on REAL last 5 games data",
  "key_players": ["Player 1 (POS)", "Player 2 (POS)", "Player 3 (POS)"],
  "next_game": {
    "opponent": "Team Name",
    "date": "Day, Month DD",
    "time": "7:30 PM ET",
    "location": "Home/Away",
    "odds": "+150 / -180"
  },
  "ai_insight": "2-3 sentence analysis based on REAL stats and trends",
  "wager_rating": {
    "score": 7,
    "label": "Strong Pick",
    "note": "Rationale based on actual record and form"
  },
  "data_source": "BallDontLie + TheSportsDB + The Odds API"
}`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this team: ${query}` },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  const openaiData = await openaiRes.json();
  const raw = openaiData.choices?.[0]?.message?.content || "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: "Failed to parse AI response" });

  try {
    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch {
    return res.status(500).json({ error: "Invalid JSON from AI" });
  }
}
