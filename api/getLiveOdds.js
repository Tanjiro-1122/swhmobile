// api/getLiveOdds.js
// Vercel serverless function — fetches live odds for a given sport key
// Called by AskSAL.jsx to inject real odds into S.A.L.'s context

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache 5 min

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { sportKey } = req.query;
  if (!sportKey) return res.status(400).json({ error: 'sportKey is required' });

  const apiKey = process.env.SWH_ODDS_API_KEY || process.env.ODDS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Odds API key not configured' });

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`Odds API error for ${sportKey}:`, response.status, text);
      return res.status(response.status).json({ error: 'Failed to fetch odds', details: text.slice(0, 200) });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('getLiveOdds error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
