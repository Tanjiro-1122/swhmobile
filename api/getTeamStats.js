// api/getTeamStats.js
// Cache-first: Check Base44 TeamStats → serve instantly if cached today
// Otherwise: BallDontLie + TheSportsDB + Odds API → OpenAI → save cache

const BALLDONTLIE_KEY = process.env.BALLDONTLIE_API_KEY || "";
const SPORTSDB_KEY    = process.env.THESPORTSDB_API_KEY || "123";
const ODDS_KEY        = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || "";
const OPENAI_KEY      = process.env.OPENAI_API_KEY || "";
const BASE44_KEY      = process.env.SWH_BASE44_API_KEY || process.env.BASE44_SERVICE_TOKEN || "";
const BASE44_APP_ID   = "68f93544702b554e3e1f7297";
const BASE44_URL      = `https://api.base44.com/api/apps/${BASE44_APP_ID}/entities/TeamStats`;

function todayKey() { return new Date().toISOString().slice(0, 10); }
function normalize(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]/g,"").trim(); }

async function getCached(query) {
  if (!BASE44_KEY) return null;
  try {
    const res = await fetch(`${BASE44_URL}?team_name__icontains=${encodeURIComponent(query)}`, {
      headers: { "api-key": BASE44_KEY },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    const today = todayKey();
    const normQ = normalize(query);
    return rows.find(r =>
      normalize(r.team_name || "").includes(normQ) && r.cached_date === today
    ) || null;
  } catch { return null; }
}

async function saveCache(query, data) {
  if (!BASE44_KEY) return;
  try {
    const res = await fetch(`${BASE44_URL}?team_name__icontains=${encodeURIComponent(data.team_name || query)}`, {
      headers: { "api-key": BASE44_KEY },
      signal: AbortSignal.timeout(4000),
    });
    const rows = res.ok ? await res.json() : [];
    const existing = Array.isArray(rows) && rows.find(r =>
      normalize(r.team_name || "") === normalize(data.team_name || query)
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
        headers: { "api-key": BASE44_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
    } else {
      await fetch(BASE44_URL, {
        method: "POST",
        headers: { "api-key": BASE44_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
    }
  } catch (e) { console.warn("Cache save failed:", e.message); }
}

async function safeFetch(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

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
  let wins = 0, losses = 0;
  games.forEach(g => {
    const isHome = g.home_team?.id === teamId;
    const ts = isHome ? g.home_team_score : g.visitor_team_score;
    const os = isHome ? g.visitor_team_score : g.home_team_score;
    if (ts > os) wins++; else losses++;
  });
  const totalPts = games.reduce((s,g) => s + (g.home_team?.id === teamId ? g.home_team_score : g.visitor_team_score), 0);
  const totalAllowed = games.reduce((s,g) => s + (g.home_team?.id === teamId ? g.visitor_team_score : g.home_team_score), 0);
  const recent5 = games.slice(-5).reverse().map(g => {
    const isHome = g.home_team?.id === teamId;
    const ts = isHome ? g.home_team_score : g.visitor_team_score;
    const os = isHome ? g.visitor_team_score : g.home_team_score;
    return `${ts > os ? "W" : "L"} ${ts}-${os} vs ${isHome ? g.visitor_team?.full_name : g.home_team?.full_name}`;
  });
  return { wins, losses, ppg: games.length ? (totalPts/games.length).toFixed(1) : "N/A", papg: games.length ? (totalAllowed/games.length).toFixed(1) : "N/A", gamesPlayed: games.length, recent5 };
}

async function getSportsDBTeam(name) {
  const d = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/searchteams.php?t=${encodeURIComponent(name)}`
  );
  return d?.teams?.[0] || null;
}

async function getSportsDBNextEvents(teamId) {
  const d = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventsnext.php?id=${teamId}`
  );
  return d?.events?.slice(0,2) || [];
}

async function getOdds(teamName) {
  if (!ODDS_KEY) return null;
  try {
    const sports = ["basketball_nba","americanfootball_nfl","baseball_mlb","icehockey_nhl"];
    const normTeam = normalize(teamName);
    for (const sport of sports) {
      const d = await safeFetch(
        `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_KEY}&regions=us&markets=h2h,spreads&oddsFormat=american&bookmakers=draftkings&dateFormat=iso`
      );
      if (!Array.isArray(d)) continue;
      const game = d.find(g =>
        normalize(g.home_team).includes(normTeam) || normalize(g.away_team).includes(normTeam)
      );
      if (game) {
        const dk = game.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
        const spread = game.bookmakers?.[0]?.markets?.find(m=>m.key==="spreads")?.outcomes || [];
        return { sport, home: game.home_team, away: game.away_team, date: game.commence_time?.slice(0,10), moneyline: dk.map(o=>`${o.name} ${o.price>0?"+":""}${o.price}`).join(" / "), spread: spread.map(o=>`${o.name} ${o.point>0?"+":""}${o.point}`).join(" / ") };
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
  const today = new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  const [bdlTeam, sportsDBTeam] = await Promise.all([getBDLTeam(query), getSportsDBTeam(query)]);
  let record = null, nextEvents = [], odds = null;

  if (bdlTeam?.id) record = await getBDLTeamRecord(bdlTeam.id, 2024);
  if (sportsDBTeam?.idTeam) nextEvents = await getSportsDBNextEvents(sportsDBTeam.idTeam);
  odds = await getOdds(query);

  // ── 3. BUILD CONTEXT ────────────────────────────────────────────────────────
  let ctx = "";
  if (bdlTeam) {
    ctx += `BDL: ${bdlTeam.full_name} | ${bdlTeam.conference} | ${bdlTeam.division}\n`;
    if (record) {
      ctx += `Record: ${record.wins}-${record.losses} (${record.gamesPlayed} games) | PPG: ${record.ppg} | OPP PPG: ${record.papg}\n`;
      if (record.recent5?.length) ctx += `Recent 5: ${record.recent5.join(" | ")}\n`;
    }
  }
  if (sportsDBTeam) {
    ctx += `\nSPORTSDB: ${sportsDBTeam.strTeam} | ${sportsDBTeam.strSport} | ${sportsDBTeam.strLeague}\n`;
    if (sportsDBTeam.strDescriptionEN) ctx += `Info: ${sportsDBTeam.strDescriptionEN.slice(0,200)}\n`;
    if (nextEvents.length) ctx += `Next games: ${nextEvents.map(e=>`${e.strHomeTeam} vs ${e.strAwayTeam} on ${e.dateEvent}`).join(" | ")}\n`;
  }
  if (odds) ctx += `\nLIVE ODDS (DraftKings): ${odds.away} @ ${odds.home} on ${odds.date}\nMoneyline: ${odds.moneyline}\nSpread: ${odds.spread}\n`;
  if (!ctx) ctx = `No live data for "${query}". Use training knowledge.`;

  // ── 4. OPENAI ──────────────────────────────────────────────────────────────
  const systemPrompt = `You are a world-class sports analyst. Today is ${today}.
Use REAL DATA as your primary source:
${ctx}

Return ONLY valid JSON:
{
  "team_name": "Full Name",
  "sport": "NBA/NFL/MLB/NHL/Soccer",
  "league": "League Name",
  "record": {"wins": 0, "losses": 0, "display": "40-18"},
  "standing": "4th in Conference",
  "stats": {
    "season": "2024-25",
    "key_stats": [{"label": "PPG", "value": "115.2"}, ...]
  },
  "recent_form": "2-3 sentence summary based on real data",
  "key_players": ["Player A", "Player B"],
  "next_game": {"opponent": "Name", "date": "Day, Month DD", "time": "7:30 PM ET", "location": "Home/Away", "odds": "+120"},
  "ai_insight": "2-3 sentence analysis",
  "wager_rating": {"score": 7, "label": "Solid Pick", "note": "rationale"},
  "data_source": "BallDontLie + TheSportsDB + DraftKings"
}`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze team: ${query}` },
      ],
      temperature: 0.3,
      max_tokens: 900,
    }),
  });

  const openaiData = await openaiRes.json();
  const raw = openaiData.choices?.[0]?.message?.content || "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: "Failed to parse AI response" });

  let result;
  try { result = JSON.parse(jsonMatch[0]); }
  catch { return res.status(500).json({ error: "Invalid JSON from AI" }); }

  // ── 5. SAVE CACHE (fire and forget) ───────────────────────────────────────
  saveCache(query, result).catch(() => {});

  result._cache_hit = false;
  return res.status(200).json(result);
}
