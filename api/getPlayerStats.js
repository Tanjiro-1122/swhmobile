// api/getPlayerStats.js
// Vercel serverless function — AI-powered player stats lookup using OpenAI
// Replaces the broken base44.functions.invoke('getPlayerStats') call

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

When given a player name (with optional sport/team), return a comprehensive JSON analysis. Be precise and accurate.

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
  "recent_form": "Brief 2-3 sentence summary of recent performance",
  "next_game": {
    "opponent": "Team Name",
    "date": "Day, Month DD",
    "time": "7:30 PM ET",
    "location": "Home/Away"
  },
  "ai_insight": "2-3 sentence AI analysis of this player's current form, strengths, and what to watch",
  "wager_rating": {
    "score": 7,
    "label": "Strong Performer",
    "note": "Brief rationale for the rating"
  }
}

Wager rating score: 1-3 = Avoid, 4-6 = Neutral, 7-8 = Strong, 9-10 = Elite.
Use your training data for accurate stats. If you're uncertain about exact current stats, provide your best estimate with a note in ai_insight.`;

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
          { role: 'user', content: `Analyze this player: ${query.trim()}` },
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('[getPlayerStats] OpenAI error:', response.status, err.slice(0, 200));
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

    if (!result.player_name) {
      return res.status(404).json({ error: `Player "${query}" not found. Try using the full name.` });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[getPlayerStats] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to fetch player stats' });
  }
}
