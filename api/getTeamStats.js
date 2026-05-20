// api/getTeamStats.js — Supabase cache version (Base44 removed)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.RUNE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

function todayKey() { return new Date().toISOString().slice(0, 10); }
function normalize(s) { return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim(); }

async function getCached(teamName) {
  try {
    const { data } = await supabase.from('swh_team_stats').select('*').limit(200);
    if (!data?.length) return null;
    const today = todayKey();
    const normQ = normalize(teamName);
    return data.find(r =>
      normalize(r.team_name || "").includes(normQ) && r.fetched_at?.startsWith(today)
    ) || null;
  } catch { return null; }
}

async function saveCache(teamName, sport, statsData) {
  try {
    await supabase.from('swh_team_stats').insert({
      team_name: teamName,
      sport: sport || 'unknown',
      stats: statsData,
      fetched_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('saveCache error:', e.message);
  }
}

async function fetchFromOpenAI(teamName, sport) {
  if (!OPENAI_KEY) return null;
  try {
    const prompt = `Provide current 2024-25 season stats for the ${teamName} (${sport || 'any sport'}). Return JSON with fields: team_name, sport, league, record, recent_form (last 5 games), key_players, strengths, weaknesses, analysis. Be concise and factual.`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return JSON.parse(data.choices?.[0]?.message?.content || 'null');
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { teamName, sport } = req.method === 'POST' ? (req.body || {}) : req.query;
  if (!teamName) return res.status(400).json({ error: 'teamName required' });

  const cached = await getCached(teamName);
  if (cached) {
    return res.status(200).json({ success: true, data: cached.stats, source: 'cache' });
  }

  const statsData = await fetchFromOpenAI(teamName, sport);
  if (!statsData) {
    return res.status(502).json({ success: false, error: 'Could not fetch team stats' });
  }

  await saveCache(teamName, sport, statsData);
  return res.status(200).json({ success: true, data: statsData, source: 'live' });
}
