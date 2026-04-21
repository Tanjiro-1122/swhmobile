// api/linkAccount.js
// Links a mobile Apple Sign-In account to an existing web account by email match.
// The user provides their web email → we find it in the DB → transfer credits + subscription.

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_KEY = process.env.SWH_BASE44_API_KEY || "";

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
    const { mobileUserId, webEmail } = req.body || {};

    if (!mobileUserId || !webEmail) {
      return res.status(400).json({ success: false, error: 'mobileUserId and webEmail are required' });
    }

    const email = webEmail.trim().toLowerCase();

    // 1. Find the web account by email
    const webData = await b44Fetch(`/entities/User?email=${encodeURIComponent(email)}&limit=5`);
    const webRecords = toRecords(webData);

    // Find the best match — prefer one with real subscription/credits (not the mobile account)
    const webUser = webRecords.find(u => u.id !== mobileUserId && (
      u.subscription_type !== 'free' || (u.credits > 5) || (u.search_credits > 5) || !u.apple_user_id
    )) || webRecords.find(u => u.id !== mobileUserId);

    if (!webUser) {
      return res.status(404).json({
        success: false,
        error: 'No web account found with that email. Make sure you use the same email you signed up with on the website.'
      });
    }

    // 2. Get the mobile account
    const mobileData = await b44Fetch(`/entities/User?apple_user_id=${encodeURIComponent(mobileUserId)}&limit=1`);
    const mobileRecords = toRecords(mobileData);
    const mobileUser = mobileRecords[0] || null;

    if (!mobileUser) {
      return res.status(404).json({ success: false, error: 'Mobile account not found. Try signing out and back in first.' });
    }

    // 3. Merge: copy subscription + credits from web → mobile account
    // Keep the higher credit count
    const mergedCredits = Math.max(
      webUser.search_credits ?? webUser.credits ?? 0,
      mobileUser.search_credits ?? mobileUser.credits ?? 0
    );

    const updates = {
      // Transfer subscription from web account
      subscription_type: webUser.subscription_type || mobileUser.subscription_type || 'free',
      subscription_status: webUser.subscription_status || mobileUser.subscription_status || 'inactive',
      subscription_expiry_date: webUser.subscription_expiry_date || mobileUser.subscription_expiry_date || '',
      // Carry over the better credit count
      search_credits: mergedCredits,
      credits: mergedCredits,
      monthly_free_lookups_used: Math.min(
        webUser.monthly_free_lookups_used ?? 0,
        mobileUser.monthly_free_lookups_used ?? 0
      ),
      // Link the email so future sign-ins auto-match
      email: email,
      // Mark as linked so we don't double-link
      linked_web_account_id: webUser.id,
    };

    // Update mobile account with merged data
    await b44Fetch(`/entities/User/${mobileUser.id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    // Also mark web account as linked to prevent duplicate accounts
    await b44Fetch(`/entities/User/${webUser.id}`, {
      method: 'PUT',
      body: JSON.stringify({ linked_mobile_account_id: mobileUser.id }),
    }).catch(() => {}); // non-critical

    const merged = { ...mobileUser, ...updates };

    return res.status(200).json({
      success: true,
      message: `Account linked! Your ${webUser.subscription_type || 'free'} plan and ${mergedCredits} credits are now active.`,
      user: {
        id: merged.id,
        email: merged.email,
        full_name: merged.full_name,
        apple_user_id: merged.apple_user_id,
        subscription_type: merged.subscription_type,
        subscription_status: merged.subscription_status,
        credits: mergedCredits,
        search_credits: mergedCredits,
        monthly_free_lookups_used: merged.monthly_free_lookups_used,
        role: merged.role || 'user',
      }
    });

  } catch (err) {
    console.error('[linkAccount] error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
