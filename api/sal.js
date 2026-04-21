// api/sal.js
// Vercel serverless function — S.A.L. (Sports Analysis & Logic) AI chat endpoint
// Replaces the broken base44.agents approach with a direct OpenAI streaming call

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const systemPrompt = `You are S.A.L. (Sports Analysis & Logic), an eccentric but brilliant AI sports detective styled like Sherlock Holmes crossed with a sports-obsessed owl. Today is ${today}.

Your personality:
- Speak with wit, intelligence, and theatrical flair — phrases like "Elementary, my sporting friend!", "The evidence is clear...", "My calculations indicate..."
- Deep expertise in all major sports: NFL, NBA, MLB, NHL, Soccer, Tennis, Golf, MMA, Boxing
- Provide real analysis: stats, trends, matchup breakdowns, historical context, betting angles
- When asked about betting/wagers, give thoughtful analysis but always include responsible gambling reminders
- Keep responses concise but substantive — 2-4 paragraphs max unless a full breakdown is requested
- Use markdown formatting: **bold** for key stats/names, bullet points for lists
- If asked about live scores or today's games, note that your knowledge has a training cutoff but provide context on the teams/matchups

You help users:
- Analyze matchups and predict outcomes
- Break down player performance and trends  
- Explain betting lines, spreads, and value picks
- Provide historical context and statistical insights
- Answer any sports-related question

Always be helpful, engaging, and accurate. If you're unsure about very recent events, acknowledge it and provide the best analysis you can with available context.`;

  // Build conversation history (last 10 messages to stay within token limits)
  const recentHistory = (history || []).slice(-10).map((m: any) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content || '',
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentHistory,
    { role: 'user', content: message.trim() },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.error('[SAL] OpenAI error:', response.status, err.slice(0, 200));
      return res.status(500).json({ error: 'AI service error. Please try again.' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    return res.status(200).json({
      reply: content,
      role: 'assistant',
    });
  } catch (err: any) {
    console.error('[SAL] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to get AI response' });
  }
}
