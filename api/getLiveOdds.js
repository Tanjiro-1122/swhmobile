// api/getLiveOdds.js — returns live game odds for a given sport

const ODDS_KEY = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=300"); // cache 5 min
  if (req.method === "OPTIONS") return res.status(200).end();

  const sport = req.query.sport || "basketball_nba";

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings&dateFormat=iso`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) {
      return res.status(200).json({ games: [], error: `Odds API returned ${resp.status}` });
    }
    const data = await resp.json();
    return res.status(200).json({ games: data || [] });
  } catch (err) {
    return res.status(200).json({ games: [], error: err.message });
  }
}
