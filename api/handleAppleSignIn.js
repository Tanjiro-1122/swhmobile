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

async function createUser(payload) {
  const defaults = {
    stripe_customer_id: "",            // required string — empty until Stripe assigns one
    subscription_type: "free",
    subscription_status: "inactive",
    subscription_expiry_date: "",      // required string — empty for free users
    free_lookups_reset_date: firstOfNextMonth(),
    credits: 5,
    monthly_free_lookups_used: 0,
    completed_lessons: [],
    data_storage_consent: false,
    role: "user",
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

    const payload = decodeAppleJwt(identityToken);
    const appleUserId = payload.sub;
    const email = emailArg || payload.email || null;

    if (!appleUserId) {
      return res.status(400).json({ success: false, error: 'Could not extract user ID from token' });
    }

    // 1. Find existing user
    let dbUser = await findUserByAppleId(appleUserId);
    if (!dbUser && email) dbUser = await findUserByEmail(email);

    // 2. Create new user
    if (!dbUser) {
      const givenName = fullName?.givenName || '';
      const familyName = fullName?.familyName || '';
      const name = `${givenName} ${familyName}`.trim() || (email ? email.split('@')[0] : 'User');

      dbUser = await createUser({
        apple_user_id: appleUserId,
        email: email || "",
        full_name: name,
      });
    } else {
      // Patch missing apple_user_id or email
      const updates = {};
      if (!dbUser.apple_user_id) updates.apple_user_id = appleUserId;
      if (!dbUser.email && email) updates.email = email;
      if (Object.keys(updates).length > 0) {
        await updateUser(dbUser.id, updates);
        dbUser = { ...dbUser, ...updates };
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name,
        apple_user_id: dbUser.apple_user_id,
        subscription_type: dbUser.subscription_type || 'free',
        subscription_status: dbUser.subscription_status || 'inactive',
        credits: dbUser.credits ?? 5,
        monthly_free_lookups_used: dbUser.monthly_free_lookups_used ?? 0,
      },
    });

  } catch (err) {
    console.error('[handleAppleSignIn] error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
