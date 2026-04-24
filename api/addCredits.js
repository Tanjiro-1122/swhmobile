// api/addCredits.js
// Called after a successful credit pack purchase to persist credits to the database.
// Works for both signed-in users (by appleUserId) and as a pending save.

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_KEY = process.env.SWH_BASE44_API_KEY || process.env.BASE44_API_KEY || process.env.BASE44_SERVICE_TOKEN || "";

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { appleUserId, creditsToAdd, productId } = req.body || {};

    if (!appleUserId || !creditsToAdd) {
      return res.status(400).json({ success: false, error: 'appleUserId and creditsToAdd are required' });
    }

    if (creditsToAdd <= 0 || creditsToAdd > 500) {
      return res.status(400).json({ success: false, error: 'Invalid credits amount' });
    }

    // Find user by apple ID
    const data = await b44Fetch(`/entities/User?limit=500`);
    const records = toRecords(data);
    const user = records.find(u => u.apple_user_id === appleUserId) || null;

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found. Sign in first.' });
    }

    // Add credits on top of existing
    const currentCredits = user.search_credits ?? user.credits ?? 0;
    const newCredits = currentCredits + Number(creditsToAdd);

    await b44Fetch(`/entities/User/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        search_credits: newCredits,
        credits: newCredits,
      }),
    });

    console.log(`[addCredits] User ${user.id}: ${currentCredits} + ${creditsToAdd} = ${newCredits} (product: ${productId})`);

    return res.status(200).json({
      success: true,
      creditsAdded: Number(creditsToAdd),
      totalCredits: newCredits,
      userId: user.id,
    });

  } catch (err) {
    console.error('[addCredits] error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
