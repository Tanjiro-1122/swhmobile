// api/sal.js — S.A.L. with smart odds fetching (only when relevant)
const ODDS_KEY   = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

// Keywords that signal the user wants odds/game info
const ODDS_TRIGGER_WORDS = [
  "bet","wager","odds","spread","moneyline","parlay","pick","tonight","today","game",
  "match","play","nba","nfl","mlb","nhl","soccer","mma","boxing","tennis","golf",
  "line","cover","over","under","prop","value","favorite","underdog","win","lose",
  "score","vs","versus","against","prediction","predict","analysis","analyze",
  "should i","worth","money","draft","kings","fanduel","barstool"
];

function needsOdds(message) {
  const lower = (message || "").toLowerCase();
  return ODDS_TRIGGER_WORDS.some(w => lower.includes(w));
}

// Cached odds — reused within the same Vercel function instance (up to 5 min)
let _oddsCache = { data: null, ts: 0 };
const ODDS_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getLiveOdds() {
  const now = Date.now();
  if (_oddsCache.data && (now - _oddsCache.ts) < ODDS_TTL_MS) {
    return _oddsCache.data; // serve from memory cache
  }
  try {
    const sports = ["basketball_nba", "americanfootball_nfl", "baseball_mlb", "icehockey_nhl"];
    const results = [];
    for (const sport of sports.slice(0, 2)) {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings&dateFormat=iso`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) continue;
      const data = await res.json();
      (Array.isArray(data) ? data : []).slice(0, 5).forEach(g => {
        const dk = g.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
        results.push(
          `${sport.split("_")[1].toUpperCase()}: ${g.home_team} vs ${g.away_team} (${g.commence_time?.slice(0,10)}) — ${dk.map(o => `${o.name} ${o.price > 0 ? "+" : ""}${o.price}`).join(" | ")}`
        );
      });
    }
    const text = results.join("\n") || "No games found.";
    _oddsCache = { data: text, ts: now };
    return text;
  } catch {
    return "Odds unavailable.";
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, history = [] } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: "Message is required" });
  if (!OPENAI_KEY)       return res.status(500).json({ error: "OpenAI API key not configured" });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Only hit Odds API if the message is actually about sports/betting
  const wantsOdds = needsOdds(message);
  const liveOdds  = wantsOdds ? await getLiveOdds() : null;

  const oddsBlock = liveOdds
    ? `\n\nLIVE ODDS (today, use when relevant):\n${liveOdds}`
    : "";

  const systemPrompt = `You are S.A.L. (Sports Analysis & Logic), an eccentric but brilliant AI sports detective styled like Sherlock Holmes crossed with a sports-obsessed owl. Today is ${today}.

Your personality:
- Speak with wit, intelligence, and theatrical flair — "Elementary, my sporting friend!", "The evidence is clear...", "My calculations indicate..."
- Deep expertise in all major sports: NFL, NBA, MLB, NHL, Soccer, Tennis, Golf, MMA, Boxing
- Provide real analysis: stats, trends, matchup breakdowns, historical context, betting angles
- Keep responses concise — 2-4 paragraphs max unless a full breakdown is requested
- Use markdown: **bold** for key stats/names, bullet points for lists
- Always encourage responsible gambling when betting topics arise${oddsBlock}`;

  // Trim history: 6 messages for free context (saves ~400 tokens vs 10)
  const recentHistory = (history || []).slice(-6).map(m => ({
    role: m.role === "user" ? "user" : "assistant",
    content: String(m.content || "").slice(0, 800), // cap each message at 800 chars
  }));

  const messages = [
    { role: "system", content: systemPrompt },
    ...recentHistory,
    { role: "user", content: message.trim().slice(0, 1000) },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 600, // was 1000 — SAL answers don't need to be essays
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      console.error("[SAL] OpenAI error:", response.status, err.slice(0, 200));
      return res.status(500).json({ error: "AI service error. Please try again." });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(500).json({ error: "No response from AI" });

    return res.status(200).json({ reply: content, role: "assistant", _odds_fetched: wantsOdds });
  } catch (err) {
    console.error("[SAL] Error:", err.message);
    return res.status(500).json({ error: err.message || "Failed to get AI response" });
  }
}
