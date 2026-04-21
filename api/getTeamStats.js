// api/getTeamStats.js
// Vercel serverless function — AI-powered team stats lookup using OpenAI
// Replaces the broken base44.functions.invoke('getTeamStats') call

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body || {};
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const systemPrompt = `You are a world-class sports analyst AI. Today is ${today}.

When given a team name (with optional sport/league), return a comprehensive JSON analysis. Be precise and accurate.

Return ONLY valid JSON with this exact structure:
{
  "team_name": "Full Team Name",
  "sport": "NBA/NFL/MLB/NHL/Soccer/etc",
  "league": "NBA/AFC/NL/etc",
  "city": "City Name",
  "record": {
    "wins": 42,
    "losses": 28,
    "display": "42-28"
  },
  "standing": "3rd in Eastern Conference / 2nd in NFC West",
  "stats": {
    "season": "2024-25",
    "key_stats": [
      {"label": "Points Per Game", "value": "118.3"},
      {"label": "Points Allowed", "value": "112.1"},
      {"label": "Home Record", "value": "24-12"}
    ]
  },
  "recent_form": "Brief 2-3 sentence summary of last 5-10 games",
  "key_players": ["Player 1 (POS)", "Player 2 (POS)", "Player 3 (POS)"],
  "next_game": {
    "opponent": "Opponent Name",
    "date": "Day, Month DD",
    "time": "7:30 PM ET",
    "location": "Home/Away"
  },
  "ai_insight": "2-3 sentence AI analysis of team's current trajectory, strengths/weaknesses",
  "wager_rating": {
    "score": 7,
    "label": "Strong Value",
    "note": "Brief rationale for the rating"
  }
}

Wager rating score: 1-3 = Avoid, 4-6 = Neutral, 7-8 = Strong, 9-10 = Elite.
Use your training data for accurate stats. If uncertain, note it in ai_insight.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this team: ${query.trim()}` },
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('[getTeamStats] OpenAI error:', response.status, err.slice(0, 200));
      return res.status(500).json({ error: 'AI service error. Please try again.' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      return res.status(500).json({ error: 'Invalid AI response format' });
    }

    if (!result.team_name) {
      return res.status(404).json({ error: `Team "${query}" not found. Try using the full team name.` });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[getTeamStats] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to fetch team stats' });
  }
}
