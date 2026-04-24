// api/getPlayerStats.js
// Cache-first: Check Base44 PlayerStats → instant if cached today
// Otherwise: BallDontLie (NBA) + TheSportsDB (all sports) + OpenAI → save to cache

const BALLDONTLIE_KEY = process.env.BALLDONTLIE_API_KEY || "";
const SPORTSDB_KEY    = process.env.THESPORTSDB_API_KEY || "123";
const OPENAI_KEY      = process.env.OPENAI_API_KEY || "";
const BASE44_KEY      = process.env.SWH_BASE44_API_KEY || process.env.BASE44_API_KEY || process.env.BASE44_SERVICE_TOKEN || "";
const BASE44_APP_ID   = "68f93544702b554e3e1f7297";
const BASE44_URL      = `https://app.base44.com/api/apps/${BASE44_APP_ID}/entities/PlayerStats`;

function todayKey() { return new Date().toISOString().slice(0, 10); }
function normalize(s) { return (s||"").toLowerCase().replace(/[^a-z0-9]/g,"").trim(); }

function b44Headers(extra = {}) {
  return { "api_key": BASE44_KEY, "Content-Type": "application/json", ...extra };
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
    if (!rows.length) return null;
    const today = todayKey();
    const normQ = normalize(query);
    return rows.find(r =>
      normalize(r.player_name || "").includes(normQ) && r.cached_date === today
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
      normalize(r.player_name||"") === normalize(data.player_name||query)
    );
    const payload = {
      player_name: data.player_name || query,
      sport: data.sport || "Unknown",
      team: data.team || "",
      position: data.position || "",
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
  } catch (e) { console.warn("Cache save failed (non-fatal):", e.message); }
}

async function safeFetch(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// NBA via BallDontLie
async function getBDLPlayer(name) {
  const d = await safeFetch(
    `https://api.balldontlie.io/v1/players?search=${encodeURIComponent(name)}&per_page=5`,
    { Authorization: BALLDONTLIE_KEY }
  );
  return d?.data?.[0] || null;
}
async function getBDLAverages(playerId, season = 2024) {
  const d = await safeFetch(
    `https://api.balldontlie.io/v1/season_averages?season=${season}&player_ids[]=${playerId}`,
    { Authorization: BALLDONTLIE_KEY }
  );
  return d?.data?.[0] || null;
}
async function getBDLRecentGames(playerId) {
  const d = await safeFetch(
    `https://api.balldontlie.io/v1/stats?player_ids[]=${playerId}&per_page=10&sort=game.date&order=desc`,
    { Authorization: BALLDONTLIE_KEY }
  );
  return d?.data || [];
}

// All sports via TheSportsDB
async function getSportsDBPlayer(name) {
  const d = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/searchplayers.php?p=${encodeURIComponent(name)}`
  );
  return d?.player?.[0] || null;
}
async function getSportsDBNextGame(teamId) {
  const d = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventsnext.php?id=${teamId}`
  );
  return d?.events?.[0] || null;
}
async function getSportsDBLastEvents(teamId) {
  const d = await safeFetch(
    `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventslast.php?id=${teamId}`
  );
  return d?.results?.slice(0,5) || [];
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

  // ── 2. LIVE DATA ───────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const [bdlPlayer, sdbPlayer] = await Promise.all([
    getBDLPlayer(query),
    getSportsDBPlayer(query),
  ]);

  let bdlAvg = null, bdlRecent = [], nextGame = null, lastEvents = [];
  if (bdlPlayer?.id) {
    [bdlAvg, bdlRecent] = await Promise.all([
      getBDLAverages(bdlPlayer.id, 2024),
      getBDLRecentGames(bdlPlayer.id),
    ]);
  }
  if (sdbPlayer?.idTeam) {
    [nextGame, lastEvents] = await Promise.all([
      getSportsDBNextGame(sdbPlayer.idTeam),
      getSportsDBLastEvents(sdbPlayer.idTeam),
    ]);
  }

  // ── 3. BUILD CONTEXT ────────────────────────────────────────────────────────
  let ctx = "";
  if (bdlPlayer) {
    ctx += `NBA (BallDontLie):\nName: ${bdlPlayer.first_name} ${bdlPlayer.last_name} | Team: ${bdlPlayer.team?.full_name} | Pos: ${bdlPlayer.position}\n`;
    if (bdlAvg) {
      ctx += `2024-25 Season: PTS ${bdlAvg.pts} | REB ${bdlAvg.reb} | AST ${bdlAvg.ast} | STL ${bdlAvg.stl} | BLK ${bdlAvg.blk} | TO ${bdlAvg.turnover} | FG% ${bdlAvg.fg_pct} | 3P% ${bdlAvg.fg3_pct} | FT% ${bdlAvg.ft_pct} | MIN ${bdlAvg.min} | GP ${bdlAvg.games_played}\n`;
    }
    if (bdlRecent.length) {
      ctx += `Recent games: ` + bdlRecent.slice(0,5).map(g =>
        `${g.game?.date?.slice(0,10)}: ${g.pts}pts/${g.reb}reb/${g.ast}ast/${g.stl}stl/${g.blk}blk (${g.min}min)`
      ).join(" | ") + "\n";
    }
  }
  if (sdbPlayer) {
    ctx += `\nTheSportsDB:\nName: ${sdbPlayer.strPlayer} | Sport: ${sdbPlayer.strSport} | Team: ${sdbPlayer.strTeam} | Pos: ${sdbPlayer.strPosition} | Nationality: ${sdbPlayer.strNationality||"N/A"}\n`;
    if (sdbPlayer.dateBorn) ctx += `DOB: ${sdbPlayer.dateBorn} | Height: ${sdbPlayer.strHeight||"?"} | Weight: ${sdbPlayer.strWeight||"?"}\n`;
    if (sdbPlayer.strDescriptionEN) ctx += `Bio: ${sdbPlayer.strDescriptionEN.slice(0,300)}\n`;
    if (nextGame) ctx += `Next: ${nextGame.strHomeTeam} vs ${nextGame.strAwayTeam} — ${nextGame.dateEvent} ${nextGame.strTime||""} at ${nextGame.strVenue||"TBD"}\n`;
    if (lastEvents.length) ctx += `Last results: ${lastEvents.map(e=>`${e.strHomeTeam} ${e.intHomeScore}-${e.intAwayScore} ${e.strAwayTeam} (${e.dateEvent})`).join(" | ")}\n`;
  }
  if (!ctx) ctx = `No live API data for "${query}". Use your training knowledge — be accurate and thorough.`;

  // ── 4. AI ANALYSIS — sport-aware, full gambling coverage ──────────────────
  const systemPrompt = `You are a world-class sports gambling analyst. Today is ${today}.

Use REAL DATA below as your primary source. When data is missing, use your training knowledge.

REAL DATA:
${ctx}

Analyze this player for ALL relevant gambling markets for their sport.

Return ONLY valid JSON (no markdown, no \`\`\`, no extra text):
{
  "player_name": "Full Name",
  "sport": "NBA/NFL/MLB/NHL/MLS/PL/UFC/Tennis/Golf/Boxing",
  "league": "League or organization name",
  "team": "Current Team",
  "position": "Position/Role",
  "jersey_number": "##",
  "age": "##",
  "stats": {
    "season": "2024-25",
    "key_stats": [
      {"label": "Sport-appropriate stat", "value": "value"},
      {"label": "...", "value": "..."}
    ]
  },
  "prop_bets": [
    {"market": "Points Over/Under", "line": "24.5", "recommendation": "OVER", "confidence": "High", "reasoning": "averaging 28.4 last 7 games"},
    {"market": "Rebounds Over/Under", "line": "8.5", "recommendation": "UNDER", "confidence": "Medium", "reasoning": "..."},
    {"market": "Assists Over/Under", "line": "6.5", "recommendation": "OVER", "confidence": "High", "reasoning": "..."},
    {"market": "Sport-specific prop (TDs/HRs/Saves/etc)", "line": "0.5", "recommendation": "OVER/UNDER", "confidence": "High/Medium/Low", "reasoning": "..."}
  ],
  "recent_form": "3-4 sentence summary of recent performance and trends",
  "injury_status": "Healthy / Day-to-Day / Questionable / Out — any relevant notes",
  "next_game": {
    "opponent": "Team Name",
    "date": "Day, Month DD",
    "time": "7:30 PM ET",
    "location": "Home / Away",
    "matchup_edge": "Brief analysis of this specific matchup"
  },
  "ai_insight": "3-4 sentence deep analysis covering form, matchup, and gambling angle",
  "best_bet": {
    "market": "The single best bet for this player right now",
    "pick": "OVER 24.5 Points",
    "confidence": "High",
    "reasoning": "Why this is the best play"
  },
  "wager_rating": {
    "score": 7,
    "label": "Strong Performer",
    "note": "One sentence rationale for score"
  },
  "data_source": "BallDontLie + TheSportsDB"
}

Sport-specific prop_bets guidance:
- NBA: Points, Rebounds, Assists, Steals, Blocks, 3-Pointers Made, Double-Double, Triple-Double, FT Made
- NFL: Passing Yards/TDs/INTs, Rushing Yards/TDs, Receiving Yards/Receptions/TDs, Longest Reception, Sacks, Tackles
- MLB: Hits, Home Runs, RBIs, Strikeouts (pitcher), Innings Pitched, Stolen Bases, Total Bases, Walks
- NHL: Goals, Assists, Points, Shots on Goal, Power Play Points, Goalie Saves, Save %
- Soccer/MLS/PL: Goals, Assists, Shots on Target, Passes, Key Passes, Tackles, Clean Sheet
- UFC/Boxing: Method of Victory, Round Betting, Total Rounds Over/Under, KO/TKO/Decision
- Tennis: Match Winner, Set Betting, Total Games, Aces Over/Under
- Golf: Top 5/10/20 Finish, Make/Miss Cut, Round Leader`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze player for gambling: ${query}` },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!openaiRes.ok) {
    const errTxt = await openaiRes.text().catch(() => "");
    console.error("[getPlayerStats] OpenAI error:", openaiRes.status, errTxt.slice(0,200));
    return res.status(500).json({ error: "AI service error. Please try again." });
  }

  const openaiData = await openaiRes.json();
  const raw = openaiData.choices?.[0]?.message?.content || "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: "Failed to parse AI response" });

  let result;
  try { result = JSON.parse(jsonMatch[0]); }
  catch { return res.status(500).json({ error: "Invalid JSON from AI" }); }

  // ── 5. SAVE TO CACHE (non-blocking) ───────────────────────────────────────
  saveCache(query, result).catch(() => {});

  result._cache_hit = false;
  return res.status(200).json(result);
}
