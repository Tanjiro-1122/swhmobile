// api/getPlayerStats.js
// Cache-first pipeline:
//   1. Check Base44 PlayerStats entity — if cached today, return instantly (0 tokens)
//   2. If stale/missing → fetch BallDontLie + TheSportsDB → OpenAI → save to cache
//   3. Next person asking same day gets instant response, free

const BALLDONTLIE_KEY = process.env.BALLDONTLIE_API_KEY || "";
const SPORTSDB_KEY    = process.env.THESPORTSDB_API_KEY || "123";
const OPENAI_KEY      = process.env.OPENAI_API_KEY || "";
const BASE44_KEY      = process.env.SWH_BASE44_API_KEY || process.env.BASE44_SERVICE_TOKEN || "";
const BASE44_APP_ID   = "68f93544702b554e3e1f7297";
const BASE44_URL      = `https://api.base44.com/api/apps/${BASE44_APP_ID}/entities/PlayerStats`;

// ── Cache helpers ─────────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10); // "2026-04-22"
}

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

async function getCached(query) {
  if (!BASE44_KEY) return null;
  try {
    const params = new URLSearchParams({ player_name__icontains: query });
    const res = await fetch(`${BASE44_URL}?${params}`, {
      headers: { "api-key": BASE44_KEY },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    // Find closest name match cached today
    const today = todayKey();
    const normQ = normalize(query);
    const match = rows.find(r =>
      normalize(r.player_name || "").includes(normQ) &&
      (r.cached_date === today)
    );
    return match || null;
  } catch { return null; }
}

async function saveCache(query, data) {
  if (!BASE44_KEY) return;
  try {
    // Find existing record for this player (any date)
    const params = new URLSearchParams({ player_name__icontains: data.player_name || query });
    const res = await fetch(`${BASE44_URL}?${params}`, {
      headers: { "api-key": BASE44_KEY },
      signal: AbortSignal.timeout(4000),
    });
    const rows = res.ok ? await res.json() : [];
    const existing = Array.isArray(rows) && rows.find(r =>
      normalize(r.player_name || "") === normalize(data.player_name || query)
    );

    const payload = {
      player_name: data.player_name || query,
      sport: data.sport || "Unknown",
      team: data.team || "",
      position: data.position || "",
      cached_date: todayKey(),
      cached_data: JSON.stringify(data), // full result blob
    };

    if (existing?.id) {
      // Update existing
      await fetch(`${BASE44_URL}/${existing.id}`, {
        method: "PUT",
        headers: { "api-key": BASE44_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
    } else {
      // Create new
      await fetch(BASE44_URL, {
        method: "POST",
        headers: { "api-key": BASE44_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
    }
  } catch (e) {
    console.warn("Cache save failed (non-fatal):", e.message);
  }
}

// ── Data fetchers ─────────────────────────────────────────────────────────────
async function safeFetch(url, headers = {}) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

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
    `https://api.balldontlie.io/v1/stats?player_ids[]=${playerId}&per_page=5&sort=game.date&order=desc`,
    { Authorization: BALLDONTLIE_KEY }
  );
  return d?.data || [];
}

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

// ── Main handler ───────────────────────────────────────────────────────────────
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

  // ── 2. LIVE DATA FETCH ─────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const [bdlPlayer, sportsDBPlayer] = await Promise.all([
    getBDLPlayer(query),
    getSportsDBPlayer(query),
  ]);

  let bdlAverages = null, bdlRecentGames = [], nextGame = null;
  if (bdlPlayer?.id) {
    [bdlAverages, bdlRecentGames] = await Promise.all([
      getBDLAverages(bdlPlayer.id, 2024),
      getBDLRecentGames(bdlPlayer.id),
    ]);
  }
  if (sportsDBPlayer?.idTeam) {
    nextGame = await getSportsDBNextGame(sportsDBPlayer.idTeam);
  }

  // ── 3. BUILD CONTEXT ────────────────────────────────────────────────────────
  let ctx = "";
  if (bdlPlayer) {
    ctx += `BALL DON'T LIE:\nPlayer: ${bdlPlayer.first_name} ${bdlPlayer.last_name}\nTeam: ${bdlPlayer.team?.full_name || "N/A"} | Position: ${bdlPlayer.position || "N/A"}\n`;
    if (bdlAverages) {
      ctx += `2024-25 Averages: PTS ${bdlAverages.pts} | REB ${bdlAverages.reb} | AST ${bdlAverages.ast} | STL ${bdlAverages.stl} | BLK ${bdlAverages.blk} | FG% ${bdlAverages.fg_pct} | 3P% ${bdlAverages.fg3_pct} | FT% ${bdlAverages.ft_pct} | MIN ${bdlAverages.min} | GP ${bdlAverages.games_played}\n`;
    }
    if (bdlRecentGames.length) {
      ctx += `Recent: ` + bdlRecentGames.slice(0,5).map(g => `${g.game?.date?.slice(0,10)}: ${g.pts}pts ${g.reb}reb ${g.ast}ast`).join(" | ") + "\n";
    }
  }
  if (sportsDBPlayer) {
    ctx += `\nSPORTSDB:\nPlayer: ${sportsDBPlayer.strPlayer} | Sport: ${sportsDBPlayer.strSport} | Team: ${sportsDBPlayer.strTeam} | Position: ${sportsDBPlayer.strPosition}\n`;
    if (sportsDBPlayer.strDescriptionEN) ctx += `Bio: ${sportsDBPlayer.strDescriptionEN.slice(0,200)}\n`;
    if (nextGame) ctx += `Next: ${nextGame.strHomeTeam} vs ${nextGame.strAwayTeam} on ${nextGame.dateEvent} at ${nextGame.strTime || "TBD"} — ${nextGame.strVenue || ""}\n`;
  }
  if (!ctx) ctx = `No live data found for "${query}". Use training knowledge.`;

  // ── 4. OPENAI (only if cache miss) ─────────────────────────────────────────
  const systemPrompt = `You are a world-class sports analyst. Today is ${today}.
Use the REAL DATA below as your primary source.
REAL DATA:\n${ctx}

Return ONLY valid JSON:
{
  "player_name": "Full Name",
  "sport": "NBA/NFL/MLB/NHL/Soccer",
  "team": "Team Name",
  "position": "Position",
  "jersey_number": "##",
  "stats": {
    "season": "2024-25",
    "key_stats": [{"label": "Points Per Game", "value": "28.4"}, ...]
  },
  "recent_form": "2-3 sentence summary",
  "next_game": {"opponent": "Name", "date": "Day, Month DD", "time": "7:30 PM ET", "location": "Home/Away"},
  "ai_insight": "2-3 sentence analysis based on real stats",
  "wager_rating": {"score": 7, "label": "Strong Performer", "note": "rationale"},
  "data_source": "BallDontLie + TheSportsDB"
}`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze: ${query}` },
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

  // ── 5. SAVE TO CACHE (fire and forget) ────────────────────────────────────
  saveCache(query, result).catch(() => {});

  result._cache_hit = false;
  return res.status(200).json(result);
}
