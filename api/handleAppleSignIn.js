// api/handleAppleSignIn.js
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

// Fetch all users and find client-side (Base44 filter params are unreliable)
async function getAllUsers() {
  try {
    const data = await b44Fetch(`/entities/User?limit=500`);
    return toRecords(data);
  } catch { return []; }
}

async function findUserByAppleId(appleUserId) {
  try {
    const all = await getAllUsers();
    return all.find(u => u.apple_user_id === appleUserId) || null;
  } catch { return null; }
}

async function findUserByEmail(email) {
  if (!email) return null;
  try {
    const all = await getAllUsers();
    return all.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
  } catch { return null; }
}

// Build best display name from all available sources
// fullName can be a string ("Javier Huertas") or an object ({givenName, familyName})
function buildDisplayName(fullName, email, jwtPayload) {
  // 1. fullName as string (how wrapper sends it)
  if (typeof fullName === 'string' && fullName.trim().length > 0) {
    return fullName.trim();
  }
  // 2. fullName as object {givenName, familyName}
  if (fullName && typeof fullName === 'object') {
    const name = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ').trim();
    if (name) return name;
  }
  // 3. JWT name claim
  if (jwtPayload?.name) return jwtPayload.name;
  // 4. Email prefix (huertasfam1@icloud.com → Huertasfam1)
  if (email) {
    const prefix = email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return 'SWH User';
}

async function createUser(payload) {
  const today = new Date();
  const firstNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split("T")[0];
  return b44Fetch(`/entities/User`, {
    method: "POST",
    body: JSON.stringify({
      subscription_type: "free",
      subscription_status: "inactive",
      subscription_expiry_date: "",
      free_lookups_reset_date: firstNextMonth,
      stripe_customer_id: "",
      credits: 5,
      search_credits: 5,
      monthly_free_lookups_used: 0,
      role: "user",
      ...payload,
    }),
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
    const { identityToken, email: emailArg, fullName, action, appleUserId: directAppleUserId, subscriptionType, subscriptionStatus } = req.body || {};

    // ── Restore sync: called after RevenueCat restore finds active subscription
    if (action === 'restoreSync' && directAppleUserId) {
      try {
        const allUsers = await getAllUsers();
        const user = allUsers.find(u => u.apple_user_id === directAppleUserId) || null;
        const records = user ? [user] : [];
        if (user) {
          await b44Fetch(`/entities/User/${user.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              subscription_type: subscriptionType || 'premium_monthly',
              subscription_status: subscriptionStatus || 'active',
            }),
          });
        }
        return res.status(200).json({ success: true, action: 'restoreSync' });
      } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
      }
    }

    if (!identityToken) {
      return res.status(400).json({ success: false, error: 'identityToken is required' });
    }

    const jwtPayload = decodeAppleJwt(identityToken);
    const appleUserId = jwtPayload.sub;
    const email = emailArg || jwtPayload.email || null;

    if (!appleUserId) {
      return res.status(400).json({ success: false, error: 'Could not extract user ID from token' });
    }

    const displayName = buildDisplayName(fullName, email, jwtPayload);

    // Find existing user by apple ID first, then email
    let dbUser = await findUserByAppleId(appleUserId);
    if (!dbUser && email) dbUser = await findUserByEmail(email);

    if (!dbUser) {
      // New user
      dbUser = await createUser({
        apple_user_id: appleUserId,
        email: email || `apple_${appleUserId}@privaterelay.appleid.com`,
        full_name: displayName,
      });
    } else {
      // Update any missing/stale fields
      const updates = {};
      if (!dbUser.apple_user_id) updates.apple_user_id = appleUserId;
      if (!dbUser.email && email) updates.email = email;
      // Fix bad placeholder names
      const badNames = ['SWH User', 'User', '', null, undefined];
      const currentName = dbUser.full_name || '';
      const isRawAppleId = currentName.startsWith('Apple_') || currentName.includes('@privaterelay') || currentName.length > 50;
      if (badNames.includes(dbUser.full_name) || isRawAppleId) updates.full_name = displayName;
      if (dbUser.search_credits == null && dbUser.credits == null) updates.search_credits = 5;
      if (Object.keys(updates).length > 0) {
        await updateUser(dbUser.id, updates);
        dbUser = { ...dbUser, ...updates };
      }
    }

    const sessionToken = await createSessionToken(dbUser.id);

    return res.status(200).json({
      success: true,
      sessionToken,
      user: {
        id: dbUser.id,
        email: dbUser.email || email,
        full_name: dbUser.full_name,
        apple_user_id: dbUser.apple_user_id || appleUserId,
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
