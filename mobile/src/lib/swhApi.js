import { SWH_API_BASE } from './supabase';

async function parseJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { error: text };
  }
}

function logApiFailure(path, response, data) {
  console.warn('[SWH API] Request failed', {
    path,
    status: response.status,
    code: data?.code || null,
    error: data?.error || data?.message || 'Request failed',
  });
}

export async function callSwhApi(path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${SWH_API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || {}),
  });

  const data = await parseJson(response);
  if (!response.ok) {
    logApiFailure(path, response, data);
    const error = new Error(data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = data?.code;
    error.data = data;
    throw error;
  }
  return data;
}

async function fetchSwhJson(path, { token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${SWH_API_BASE}${path}`, { headers });
  const data = await parseJson(response);
  if (!response.ok) {
    logApiFailure(path, response, data);
    const error = new Error(data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = data?.code;
    error.data = data;
    throw error;
  }
  return data;
}

const ODDS_SPORTS = [
  'basketball_nba',
  'americanfootball_nfl',
  'baseball_mlb',
  'icehockey_nhl',
];

function needsLiveOddsContext(message) {
  const lower = String(message || '').toLowerCase();
  return [
    'today',
    'tonight',
    'game',
    'games',
    'odds',
    'line',
    'moneyline',
    'spread',
    'best odds',
  ].some((word) => lower.includes(word));
}

function formatOutcome(outcome) {
  if (!outcome?.name || outcome.price === undefined || outcome.price === null) return null;
  const price = Number(outcome.price);
  const label = Number.isFinite(price) && price > 0 ? `+${price}` : String(outcome.price);
  return `${outcome.name} ${label}`;
}

function summarizeGame(sport, game) {
  const market = game?.bookmakers?.[0]?.markets?.find((item) => item.key === 'h2h') ||
    game?.bookmakers?.[0]?.markets?.[0];
  const outcomes = (market?.outcomes || []).map(formatOutcome).filter(Boolean).join(' | ');
  const teams = [game?.away_team, game?.home_team].filter(Boolean).join(' at ');
  if (!teams) return null;
  return `${sport}: ${teams}${game?.commence_time ? ` (${game.commence_time})` : ''}${outcomes ? ` - ${outcomes}` : ''}`;
}

async function getLiveOddsContext(token) {
  const summaries = [];

  for (const sport of ODDS_SPORTS) {
    try {
      const data = await fetchSwhJson(`/api/getLiveOdds?sport=${encodeURIComponent(sport)}`, { token });
      const games = Array.isArray(data?.games) ? data.games : [];
      games.slice(0, 3).forEach((game) => {
        const summary = summarizeGame(sport, game);
        if (summary) summaries.push(summary);
      });
    } catch (_error) {
      // Keep S.A.L. available even if one sport feed is temporarily unavailable.
    }
  }

  if (!summaries.length) {
    return 'SWH live odds feed returned no current games for NBA, NFL, MLB, or NHL.';
  }

  return summaries.slice(0, 10).join('\n');
}

export async function getCurrentGames(token) {
  const data = await fetchSwhJson('/api/getLiveScores', { token });
  const scores = Array.isArray(data?.scores) ? data.scores : [];
  return scores.flatMap((group) => {
    const sport = String(group?.sport || '').toUpperCase();
    const games = Array.isArray(group?.games) ? group.games : [];
    return games.map((game) => ({
      id: `${group?.sport || 'sport'}_${game?.id || game?.uid || `${game?.name}_${game?.date}`}`,
      sport,
      name: game?.name || game?.shortName || 'Scheduled game',
      shortName: game?.shortName || game?.name || 'Game',
      status: game?.status?.type?.shortDetail || game?.status?.type?.description || '',
      date: game?.date || '',
      venue: game?.competitions?.[0]?.venue?.fullName || '',
      competitors: (game?.competitions?.[0]?.competitors || []).map((competitor) => ({
        name: competitor?.team?.displayName || competitor?.team?.name || '',
        abbreviation: competitor?.team?.abbreviation || '',
        score: competitor?.score || '',
      })).filter((team) => team.name),
    }));
  });
}

export async function getOddsBoard(token) {
  const rows = [];

  for (const sport of ODDS_SPORTS) {
    try {
      const data = await fetchSwhJson(`/api/getLiveOdds?sport=${encodeURIComponent(sport)}`, { token });
      const games = Array.isArray(data?.games) ? data.games : [];
      games.forEach((game) => {
        const markets = game?.bookmakers?.[0]?.markets || [];
        const moneyline = markets.find((item) => item.key === 'h2h');
        const spread = markets.find((item) => item.key === 'spreads');
        const outcomes = [
          ...(moneyline?.outcomes || []).map((outcome) => ({ market: 'Moneyline', ...outcome })),
          ...(spread?.outcomes || []).map((outcome) => ({ market: 'Spread', ...outcome })),
        ];

        rows.push({
          id: `${sport}_${game?.id || `${game?.away_team}_${game?.home_team}_${game?.commence_time}`}`,
          sport: sport.replace(/_/g, ' ').toUpperCase(),
          matchup: [game?.away_team, game?.home_team].filter(Boolean).join(' at '),
          commenceTime: game?.commence_time || '',
          bookmaker: game?.bookmakers?.[0]?.title || 'DraftKings',
          outcomes: outcomes.filter((outcome) => outcome?.name),
        });
      });
    } catch (_error) {
      // One sport feed should not prevent other current odds from rendering.
    }
  }

  return rows;
}

export async function getPlayerStats({ token, playerName }) {
  return callSwhApi('/api/getPlayerStats', {
    token,
    body: { playerName },
  });
}

export async function getTeamStats({ token, teamName }) {
  return callSwhApi('/api/getTeamStats', {
    token,
    body: { teamName },
  });
}

export async function spendSearchCredit(token) {
  return callSwhApi('/api/spendSearchCredit', { token });
}

export async function askSal({ token, message, history }) {
  const liveContext = needsLiveOddsContext(message)
    ? await getLiveOddsContext(token)
    : '';
  const groundedMessage = liveContext
    ? `${message}\n\nSWH LIVE ODDS CONTEXT:\n${liveContext}\n\nUse only this live odds context for current games/odds. If it is empty or insufficient, say that clearly.`
    : message;

  return callSwhApi('/api/sal', {
    token,
    body: {
      message: groundedMessage,
      history,
    },
  });
}
