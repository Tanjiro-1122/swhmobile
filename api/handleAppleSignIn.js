// api/handleAppleSignIn.js
// Vercel serverless function — handles Apple Sign In for SWH
// Decodes the Apple identity token, finds or creates the user in Base44,
// and returns a session token the app can use.

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_KEY = process.env.SWH_BASE44_API_KEY || process.env.BASE44_SERVICE_TOKEN || "";

function decodeAppleJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded);
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
    throw new Error(`Base44 ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function findUserByAppleId(appleUserId) {
  try {
    const data = await b44Fetch(`/entities/User?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`);
    const records = Array.isArray(data) ? data : (data?.records ?? data?.items ?? []);
    return records.length > 0 ? records[0] : null;
  } catch { return null; }
}

async function findUserByEmail(email) {
  if (!email) return null;
  try {
    const data = await b44Fetch(`/entities/User?email=${encodeURIComponent(email)}&limit=1`);
    const records = Array.isArray(data) ? data : (data?.records ?? data?.items ?? []);
    return records.length > 0 ? records[0] : null;
  } catch { return null; }
}

async function createUser(payload) {
  return b44Fetch(`/entities/User`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function updateUser(id, payload) {
  return b44Fetch(`/entities/User/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function createSession(userId) {
  // Create a session token via Base44 auth
  const res = await b44Fetch(`/auth/sessions`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
  return res?.token || res?.session_token || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, identityToken, authorizationCode, user, email: emailArg, fullName } = req.body || {};

    if (!identityToken) {
      return res.status(400).json({ success: false, error: "identityToken is required" });
    }

    // Decode the Apple JWT (not verified cryptographically — used only for lookup)
    const payload = decodeAppleJwt(identityToken);
    const appleUserId = payload.sub;
    const email = emailArg || payload.email || null;

    if (!appleUserId) {
      return res.status(400).json({ success: false, error: "Could not extract user ID from token" });
    }

    // 1. Try to find existing user by apple_user_id
    let dbUser = await findUserByAppleId(appleUserId);

    // 2. Fall back to email lookup
    if (!dbUser && email) {
      dbUser = await findUserByEmail(email);
    }

    // 3. Create new user if not found
    if (!dbUser) {
      const name = fullName
        ? `${fullName.givenName || ""} ${fullName.familyName || ""}`.trim()
        : (email ? email.split("@")[0] : "User");

      dbUser = await createUser({
        apple_user_id: appleUserId,
        email: email || null,
        full_name: name || null,
        subscription_status: "free",
        search_credits: 5,
        role: "user",
      });
    } else {
      // Update apple_user_id if missing
      const updates = {};
      if (!dbUser.apple_user_id) updates.apple_user_id = appleUserId;
      if (!dbUser.email && email) updates.email = email;
      if (Object.keys(updates).length > 0) {
        await updateUser(dbUser.id, updates);
        dbUser = { ...dbUser, ...updates };
      }
    }

    // 4. Create a session token
    let sessionToken = null;
    try {
      sessionToken = await createSession(dbUser.id);
    } catch (e) {
      console.warn("createSession failed:", e.message);
    }

    // Even if session creation fails, return the user so the app can store locally
    return res.status(200).json({
      success: true,
      sessionToken,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name,
        apple_user_id: dbUser.apple_user_id,
        subscription_status: dbUser.subscription_status || "free",
        search_credits: dbUser.search_credits ?? 5,
      },
    });
  } catch (err) {
    console.error("[handleAppleSignIn] error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
