// api/getLiveOdds.js — Live DraftKings odds for given sport
const ODDS_KEY = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Accept ?sport= OR ?sportKey= for backwards compatibility
  const sport = req.query.sport || req.query.sportKey || "basketball_nba";

  try {
    if (!ODDS_KEY) {
      return res.status(200).json({ games: [], error: "No odds API key configured" });
    }
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_KEY}&regions=us&markets=h2h,spreads&oddsFormat=american&bookmakers=draftkings&dateFormat=iso`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return res.status(200).json({ games: [], error: `Odds API ${resp.status}: ${errText.slice(0,100)}` });
    }
    const data = await resp.json();
    // Return as array (some callers expect array directly, others expect {games:[]})
    // Support both: return {games: data} so new code works, old code using array also handled
    if (req.query.legacy === "1") {
      return res.status(200).json(Array.isArray(data) ? data : []);
    }
    return res.status(200).json({ games: Array.isArray(data) ? data : [] });
  } catch (err) {
    return res.status(200).json({ games: [], error: err.message });
  }
}
