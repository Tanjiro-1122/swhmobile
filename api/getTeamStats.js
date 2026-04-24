// api/getTeamStats.js
// Cache-first: Check Base44 TeamStats → instant if cached today
// Otherwise: BallDontLie (NBA) + TheSportsDB (all sports) + Odds API → OpenAI → cache

const BALLDONTLIE_KEY = process.env.BALLDONTLIE_API_KEY || "";
const SPORTSDB_KEY    = process.env.THESPORTSDB_API_KEY || "123";
const ODDS_KEY        = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || "";
const OPENAI_KEY      = process.env.OPENAI_API_KEY || "";
const BASE44_KEY      = process.env.SWH_BASE44_API_KEY || process.env.BASE44_API_KEY || process.env.BASE44_SERVICE_TOKEN || "";
const BASE44_APP_ID   = "68f93544702b554e3e1f7297";
const BASE44_URL      = `https://app.base44.com/api/apps/${BASE44_APP_ID}/entities/TeamStats`;

function todayKey() { return new Date().toISOString().slice(0, 10); }
function normalize(s) { return (s||"").toLowerCase().replace(/[^a-z0-9]/g,"").trim(); }

function b44Headers() {
  return { "api_key": BASE44_KEY, "Content-Type": "application/json" };
}

async function getCached(query) {
  if (!BASE44_KEY) return null;
  try {
    const res = await fetch(`${BASE44_URL}?limit=200`, {
      headers: b44Headers(),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const rows = Array.isArray(body) ? body : (body?.records ?? body?.items ?? []);
    const today = todayKey();
    const normQ = normalize(query);
    return rows.find(r =>
      normalize(r.team_name||"").includes(normQ) && r.cached_date === today
    ) || null;
  } catch { return null; }
}

async function saveCache(query, data) {
  if (!BASE44_KEY) return;
  try {
    const res = await fetch(`${BASE44_URL}?limit=200`, {
      headers: b44Headers(),
      signal: AbortSignal.timeout(5000),
    });
    const body = res.ok ? await res.json() : [];
    const rows = Array.isArray(body) ? body : (body?.records ?? body?.items ?? []);
    const existing = rows.find(r =>
      normalize(r.team_name||"") === normalize(data.team_name||query)
    );
    const payload = {
      team_name: data.team_name || query,
      sport: data.sport || "Unknown",
      cached_date: todayKey(),
      cached_data: JSON.stringify(data),
    };
    if (existing?.id) {
      await fetch(`${BASE44_URL}/${existing.id}`, {
        method: "PUT",
        headers: b44Headers(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
    } else {
      await fetch(BASE44_URL, {
        method: "POST",
        headers: b44Headers(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
    }
  } catch (e) { console.warn("Cache save failed:", e.message); }
}

async function safeFetch(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// NBA record via BallDontLie
async function getBDLTeam(name) {
  const d = await safeFetch(
    `https://api.balldontlie.io/v1/teams?search=${encodeURIComponent(name)}`,
    { Authorization: BALLDONTLIE_KEY }
  );
  return d?.data?.[0] || null;
}
async function getBDLTeamRecord(teamId, season = 2024) {
  const d = await safeFetch(
    `https://api.balldontlie.io/v1/games?seasons[]=${season}&team_ids[]=${teamId}&per_page=100`,
    { Authorization: BALLDONTLIE_KEY }
  );
  if (!d?.data) return null;
  const games = d.data.filter(g => g.status === "Final");
  let wins = 0, losses = 0, homeW = 0, homeL = 0, awayW = 0, awayL = 0;
  games.forEach(g => {
    const isHome = g.home_team?.id === teamId;
    const ts = isHome ? g.home_team_score : g.visitor_team_score;
    const os = isHome ? g.visitor_team_score : g.home_team_score;
    const won = ts > os;
    if (won) wins++; else losses++;
    if (isHome) { if (won) homeW++; else homeL++; }
    else { if (won) awayW++; else awayL++; }
  });
  const totalPts = games.reduce((s,g) => s + (g.home_team?.id === teamId ? g.home_team_score : g.visitor_team_score), 0);
  const totalAlw = games.reduce((s,g) => s + (g.home_team?.id === teamId ? g.visitor_team_score : g.home_team_score), 0);
  const diff = (totalPts - totalAlw) / (games.length || 1);
  const recent5 = games.slice(-5).reverse().map(g => {
    const isHome = g.home_team?.id === teamId;
    const ts = isHome ? g.home_team_score : g.visitor_team_score;
    const os = isHome ? g.visitor_team_score : g.home_team_score;
    return `${ts > os ? "W":"L"} ${ts}-${os} vs ${isHome ? g.visitor_team?.full_name : g.home_team?.full_name}`;
  });
  return {
    wins, losses, gamesPlayed: games.length,
    homeRecord: `${homeW}-${homeL}`, awayRecord: `${awayW}-${awayL}`,
    ppg: games.length ? (totalPts/games.length).toFixed(1) : "N/A",
    papg: games.length ? (totalAlw/games.length).toFixed(1) : "N/A",
    pointDiff: diff.toFixed(1),
    recent5,
  };
}

// All sports via TheSportsDB
async function getSportsDBTeam(name) {
  const d = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/searchteams.php?t=${encodeURIComponent(name)}`
  );
  return d?.teams?.[0] || null;
}
async function getSportsDBNext(teamId) {
  const d = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventsnext.php?id=${teamId}`
  );
  return d?.events?.slice(0,3) || [];
}
async function getSportsDBLast(teamId) {
  const d = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventslast.php?id=${teamId}`
  );
  return d?.results?.slice(0,5) || [];
}

// Live odds from The Odds API
async function getOdds(teamName) {
  if (!ODDS_KEY) return null;
  try {
    const sports = [
      "basketball_nba","americanfootball_nfl","baseball_mlb",
      "icehockey_nhl","soccer_usa_mls","basketball_ncaab",
      "americanfootball_ncaaf","soccer_epl","soccer_spain_la_liga"
    ];
    const normTeam = normalize(teamName);
    for (const sport of sports) {
      const d = await safeFetch(
        `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=draftkings&dateFormat=iso`
      );
      if (!Array.isArray(d)) continue;
      const game = d.find(g =>
        normalize(g.home_team).includes(normTeam) ||
        normalize(g.away_team).includes(normTeam) ||
        normTeam.includes(normalize(g.home_team).slice(0,6)) ||
        normTeam.includes(normalize(g.away_team).slice(0,6))
      );
      if (game) {
        const bk = game.bookmakers?.[0];
        const h2h = bk?.markets?.find(m=>m.key==="h2h")?.outcomes||[];
        const spread = bk?.markets?.find(m=>m.key==="spreads")?.outcomes||[];
        const totals = bk?.markets?.find(m=>m.key==="totals")?.outcomes||[];
        return {
          sport,
          home: game.home_team, away: game.away_team,
          date: game.commence_time?.slice(0,10),
          moneyline: h2h.map(o=>`${o.name} ${o.price>0?"+":""}${o.price}`).join(" / "),
          spread: spread.map(o=>`${o.name} ${o.point>0?"+":""}${o.point} (${o.price>0?"+":""}${o.price})`).join(" / "),
          total: totals.map(o=>`${o.name} ${o.point} (${o.price>0?"+":""}${o.price})`).join(" / "),
        };
      }
    }
    return null;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { query } = req.body || {};
  if (!query?.trim()) return res.status(400).json({ error: "Query is required" });

  // ── 1. CACHE CHECK ─────────────────────────────────────────────────────────
  const cached = await getCached(query);
  if (cached?.cached_data) {
    try {
      const data = JSON.parse(cached.cached_data);
      data._cache_hit = true;
      data._cached_at = cached.cached_date;
      return res.status(200).json(data);
    } catch {}
  }

  // ── 2. LIVE FETCH ──────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-US", {
    weekday:"long", year:"numeric", month:"long", day:"numeric",
  });

  const [bdlTeam, sdbTeam] = await Promise.all([getBDLTeam(query), getSportsDBTeam(query)]);
  let record = null, nextEvents = [], lastEvents = [], odds = null;

  if (bdlTeam?.id) record = await getBDLTeamRecord(bdlTeam.id, 2024);
  if (sdbTeam?.idTeam) {
    [nextEvents, lastEvents] = await Promise.all([
      getSportsDBNext(sdbTeam.idTeam),
      getSportsDBLast(sdbTeam.idTeam),
    ]);
  }
  odds = await getOdds(query);

  // ── 3. BUILD CONTEXT ────────────────────────────────────────────────────────
  let ctx = "";
  if (bdlTeam) {
    ctx += `NBA (BallDontLie): ${bdlTeam.full_name} | ${bdlTeam.conference} Conference | ${bdlTeam.division} Division\n`;
    if (record) {
      ctx += `Record: ${record.wins}-${record.losses} (${record.gamesPlayed} games) | Home: ${record.homeRecord} | Away: ${record.awayRecord}\n`;
      ctx += `PPG: ${record.ppg} | OPP PPG: ${record.papg} | Point Diff: ${record.pointDiff}\n`;
      if (record.recent5?.length) ctx += `Last 5: ${record.recent5.join(" | ")}\n`;
    }
  }
  if (sdbTeam) {
    ctx += `\nTheSportsDB: ${sdbTeam.strTeam} | ${sdbTeam.strSport} | ${sdbTeam.strLeague} | Stadium: ${sdbTeam.strStadium||"N/A"} (${sdbTeam.intStadiumCapacity||"?"} cap)\n`;
    if (sdbTeam.strDescriptionEN) ctx += `About: ${sdbTeam.strDescriptionEN.slice(0,300)}\n`;
    if (lastEvents.length) ctx += `Last results: ${lastEvents.map(e=>`${e.strHomeTeam} ${e.intHomeScore}-${e.intAwayScore} ${e.strAwayTeam} (${e.dateEvent})`).join(" | ")}\n`;
    if (nextEvents.length) ctx += `Upcoming: ${nextEvents.map(e=>`${e.strHomeTeam} vs ${e.strAwayTeam} — ${e.dateEvent} ${e.strTime||""}`).join(" | ")}\n`;
  }
  if (odds) {
    ctx += `\nLIVE ODDS (DraftKings): ${odds.away} @ ${odds.home} — ${odds.date}\nMoneyline: ${odds.moneyline}\nSpread: ${odds.spread}\nTotal: ${odds.total}\n`;
  }
  if (!ctx) ctx = `No live API data for "${query}". Use your training knowledge — be accurate and thorough.`;

  // ── 4. AI ANALYSIS — full gambling coverage ─────────────────────────────────
  const systemPrompt = `You are a world-class sports gambling analyst. Today is ${today}.

Use REAL DATA below as your primary source. When data is missing, use training knowledge.

REAL DATA:
${ctx}

Analyze this team for ALL relevant gambling markets.

Return ONLY valid JSON (no markdown, no \`\`\`, no extra text):
{
  "team_name": "Full Team Name",
  "sport": "NBA/NFL/MLB/NHL/MLS/Soccer/NCAAB/NCAAF",
  "league": "League Name",
  "conference": "Conference/Division",
  "record": {"wins": 0, "losses": 0, "ties": 0, "display": "40-18"},
  "home_record": "25-10",
  "away_record": "15-8",
  "standing": "2nd in Eastern Conference",
  "stats": {
    "season": "2024-25",
    "key_stats": [
      {"label": "PPG", "value": "115.2"},
      {"label": "OPP PPG", "value": "109.8"},
      {"label": "Point Diff", "value": "+5.4"},
      {"label": "Sport-appropriate stat", "value": "value"}
    ]
  },
  "betting_lines": {
    "moneyline": "line or N/A",
    "spread": "line or N/A",
    "total": "line or N/A",
    "next_opponent": "opponent name"
  },
  "team_bets": [
    {"market": "Moneyline", "pick": "Team Name ML", "odds": "+120", "confidence": "High", "reasoning": "why"},
    {"market": "Against the Spread", "pick": "Team Name -3.5", "confidence": "Medium", "reasoning": "why"},
    {"market": "Game Total", "pick": "Over 224.5", "confidence": "High", "reasoning": "why"},
    {"market": "First Half Line", "pick": "Team Name -1.5 1H", "confidence": "Medium", "reasoning": "why"},
    {"market": "Team Total Points", "pick": "Over 112.5 Team Points", "confidence": "High", "reasoning": "why"}
  ],
  "recent_form": "3-4 sentence summary with win/loss streak, trends, and key context",
  "key_players": ["Player A — role/impact", "Player B — role/impact"],
  "injuries": "Key injury notes or 'No significant injuries reported'",
  "next_game": {
    "opponent": "Team Name",
    "date": "Day, Month DD",
    "time": "7:30 PM ET",
    "location": "Home / Away",
    "venue": "Arena/Stadium Name",
    "matchup_edge": "2 sentences on why this team has an edge (or doesn't)"
  },
  "ai_insight": "3-4 sentence deep analysis: form, trends, matchup, and best gambling angle",
  "best_bet": {
    "market": "Best market for this team right now",
    "pick": "Specific bet",
    "confidence": "High/Medium/Low",
    "reasoning": "2 sentences on why"
  },
  "wager_rating": {
    "score": 7,
    "label": "Strong Pick",
    "note": "One sentence rationale"
  },
  "data_source": "BallDontLie + TheSportsDB + DraftKings"
}

Sport-specific stats guidance:
- NBA: PPG, OPP PPG, Point Diff, Pace, eFG%, Turnovers, Rebounds, 3P%
- NFL: PPG, OPP PPG, Pass Yds/G, Rush Yds/G, Sacks, Turnovers, 3rd Down %
- MLB: Runs/G, OPP Runs/G, Team ERA, Batting Avg, OBP, SLG, HR/G, Errors
- NHL: Goals/G, OPP Goals/G, PP%, PK%, Save %, Shots/G, Face-off Win%
- Soccer: Goals/G, OPP Goals/G, Possession %, Shots on Target, Clean Sheets`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze team for gambling: ${query}` },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!openaiRes.ok) {
    const errTxt = await openaiRes.text().catch(() => "");
    console.error("[getTeamStats] OpenAI error:", openaiRes.status, errTxt.slice(0,200));
    return res.status(500).json({ error: "AI service error. Please try again." });
  }

  const openaiData = await openaiRes.json();
  const raw = openaiData.choices?.[0]?.message?.content || "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: "Failed to parse AI response" });

  let result;
  try { result = JSON.parse(jsonMatch[0]); }
  catch { return res.status(500).json({ error: "Invalid JSON from AI" }); }

  saveCache(query, result).catch(() => {});
  result._cache_hit = false;
  return res.status(200).json(result);
}
