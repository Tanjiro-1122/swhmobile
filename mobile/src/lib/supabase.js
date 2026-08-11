import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hvvrbpvsgjxiicigkwhu.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dnJicHZzZ2p4aWljaWdrd2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDY1MzQsImV4cCI6MjA5NDIyMjUzNH0.EDSaUR-1QZjJYaGkuVC0orzxvGSO5Tj7DGVszGmXCck';

const SESSION_STORAGE_KEY = 'swh_mobile_supabase_session';

export const SWH_API_BASE = 'https://sportswagerhelper.com';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function authHeaders(accessToken) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { message: text };
  }
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(options.accessToken),
      ...(options.headers || {}),
    },
  });
  const data = await readJson(response);
  if (!response.ok) {
    const error = new Error(
      data?.msg || data?.message || data?.error_description || data?.error || 'Supabase request failed.',
    );
    error.status = response.status;
    error.code = data?.code || data?.error || data?.error_code;
    error.data = data;
    throw error;
  }
  return data;
}

export async function getStoredSession() {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export async function storeSession(session) {
  if (!session?.access_token) return null;
  const expiresAt = session.expires_at ||
    (session.expires_in ? Math.floor(Date.now() / 1000) + Number(session.expires_in) : null);
  const normalized = {
    ...session,
    expires_at: expiresAt,
  };
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function clearStoredSession() {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function refreshStoredSession(refreshToken) {
  const data = await supabaseRequest('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return storeSession(data);
}

export async function getAuthUser(accessToken) {
  return supabaseRequest('/auth/v1/user', {
    method: 'GET',
    accessToken,
  });
}

export async function signOutAuth(accessToken) {
  if (!accessToken) return;
  await supabaseRequest('/auth/v1/logout', {
    method: 'POST',
    accessToken,
  }).catch(() => {});
  await clearStoredSession();
}

export async function signInWithAppleIdToken({ identityToken, nonce }) {
  return supabaseRequest('/auth/v1/token?grant_type=id_token', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'apple',
      id_token: identityToken,
      nonce,
    }),
  });
}

export async function updateAuthUser(accessToken, metadata) {
  return supabaseRequest('/auth/v1/user', {
    method: 'PUT',
    accessToken,
    body: JSON.stringify({ data: metadata }),
  });
}

export async function selectSwhProfileByEmail(email, accessToken) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  const query = `select=*&email=ilike.${encodeURIComponent(normalizedEmail)}&limit=1`;
  const rows = await supabaseRequest(`/rest/v1/swh_users?${query}`, {
    method: 'GET',
    accessToken,
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function selectSwhProfileByAppleUserId(appleUserId, accessToken) {
  const normalizedAppleUserId = String(appleUserId || '').trim();
  if (!normalizedAppleUserId) return null;
  const query = `select=*&apple_user_id=eq.${encodeURIComponent(normalizedAppleUserId)}&limit=1`;
  const rows = await supabaseRequest(`/rest/v1/swh_users?${query}`, {
    method: 'GET',
    accessToken,
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function resolveMobileProfile(accessToken) {
  if (!accessToken) return null;
  const response = await fetch(`${SWH_API_BASE}/api/resolveMobileProfile`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const data = await readJson(response);
  if (!response.ok || data?.success === false) {
    const error = new Error(data?.error || 'Profile lookup failed.');
    error.status = response.status;
    error.code = data?.code;
    error.data = data;
    throw error;
  }
  return data?.profile || null;
}

function addBriefCompatibilityFields(brief) {
  if (!brief || typeof brief !== 'object') return brief;
  return {
    ...brief,
    brief_date: brief.brief_date || brief.published_at,
    summary: brief.summary || brief.content,
    top_picks: brief.top_picks || brief.picks || [],
  };
}

export async function selectLatestBettingBrief(accessToken) {
  const query = 'select=*&order=published_at.desc&limit=1';
  const rows = await supabaseRequest(`/rest/v1/swh_betting_briefs?${query}`, {
    method: 'GET',
    accessToken,
  });
  const brief = Array.isArray(rows) ? rows[0] || null : null;
  return addBriefCompatibilityFields(brief);
}
