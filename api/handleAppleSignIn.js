// api/handleAppleSignIn.js
// Vercel serverless function — handles Apple Sign In for SWH

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_KEY = process.env.SWH_BASE44_API_KEY || "";

function decodeAppleJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch { return {}; }
}

function b44Headers() {
  return { "Content-Type": "application/json", "api_key": B44_KEY };
}

async function b44Fetch(path, opts = {}) {
  const res = await fetch(`${B44_BASE}${path}`, {
    ...opts,
    headers: { ...b44Headers(), ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Base44 ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

function toRecords(data) {
  return Array.isArray(data) ? data : (data?.records ?? data?.items ?? []);
}

async function findUserByAppleId(appleUserId) {
  try {
    const data = await b44Fetch(`/entities/User?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`);
    const records = toRecords(data);
    return records.length > 0 ? records[0] : null;
  } catch { return null; }
}

async function findUserByEmail(email) {
  if (!email) return null;
  try {
    const data = await b44Fetch(`/entities/User?email=${encodeURIComponent(email)}&limit=1`);
    const records = toRecords(data);
    return records.length > 0 ? records[0] : null;
  } catch { return null; }
}

function firstOfNextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

// Build the best display name from available sources
function buildDisplayName(fullName, email, appleJwt) {
  // 1. Try fullName object sent from native (Apple only sends this on FIRST sign-in)
  if (fullName?.givenName || fullName?.familyName) {
    const name = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ').trim();
    if (name) return name;
  }
  // 2. Try name from JWT (rare but possible)
  if (appleJwt?.name) return appleJwt.name;
  // 3. Use email prefix as fallback display name
  if (email) {
    const prefix = email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return 'SWH User';
}

async function createUser(payload) {
  const defaults = {
    subscription_type: "free",
    subscription_status: "inactive",
    subscription_expiry_date: "",
    free_lookups_reset_date: firstOfNextMonth(),
    credits: 5,
    search_credits: 5,
    monthly_free_lookups_used: 0,
    role: "user",
    stripe_customer_id: "",
  };
  return b44Fetch(`/entities/User`, {
    method: "POST",
    body: JSON.stringify({ ...defaults, ...payload }),
  });
}

async function updateUser(id, payload) {
  return b44Fetch(`/entities/User/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function createSessionToken(userId) {
  try {
    const data = await b44Fetch(`/auth/service/session`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
    return data?.session_token || data?.token || null;
  } catch (e) {
    console.warn('[createSessionToken] failed:', e.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { identityToken, email: emailArg, fullName } = req.body || {};

    if (!identityToken) {
      return res.status(400).json({ success: false, error: 'identityToken is required' });
    }

    const jwtPayload = decodeAppleJwt(identityToken);
    const appleUserId = jwtPayload.sub;
    const email = emailArg || jwtPayload.email || null;

    if (!appleUserId) {
      return res.status(400).json({ success: false, error: 'Could not extract user ID from token' });
    }

    // Build the best name we can
    const displayName = buildDisplayName(fullName, email, jwtPayload);

    // 1. Find existing user
    let dbUser = await findUserByAppleId(appleUserId);
    if (!dbUser && email) dbUser = await findUserByEmail(email);

    // 2. Create or update
    if (!dbUser) {
      dbUser = await createUser({
        apple_user_id: appleUserId,
        email: email || `apple_${appleUserId}@privaterelay.appleid.com`,
        full_name: displayName,
      });
    } else {
      const updates = {};
      if (!dbUser.apple_user_id) updates.apple_user_id = appleUserId;
      if (!dbUser.email && email) updates.email = email;
      // Update name if it's still the default placeholder
      if (dbUser.full_name === 'SWH User' || dbUser.full_name === 'User' || !dbUser.full_name) {
        updates.full_name = displayName;
      }
      if (dbUser.search_credits == null && dbUser.credits == null) updates.search_credits = 5;
      if (Object.keys(updates).length > 0) {
        await updateUser(dbUser.id, updates);
        dbUser = { ...dbUser, ...updates };
      }
    }

    const sessionToken = await createSessionToken(dbUser.id);

    // Return full user object so frontend can store everything
    return res.status(200).json({
      success: true,
      sessionToken,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name,
        apple_user_id: dbUser.apple_user_id,
        subscription_type: dbUser.subscription_type || 'free',
        subscription_status: dbUser.subscription_status || 'inactive',
        credits: dbUser.credits ?? 5,
        search_credits: dbUser.search_credits ?? dbUser.credits ?? 5,
        monthly_free_lookups_used: dbUser.monthly_free_lookups_used ?? 0,
        role: dbUser.role || 'user',
      },
    });

  } catch (err) {
    console.error('[handleAppleSignIn] error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
