// api/linkAccount.js
// Step 2 of account linking: verify the code and merge accounts.

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
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Base44 ${res.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return {}; }
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
    const { mobileUserId, webUserId, code } = req.body || {};

    if (!mobileUserId || !webUserId || !code) {
      return res.status(400).json({ success: false, error: 'mobileUserId, webUserId, and code are required' });
    }

    // 1. Fetch the web user to check the code
    const webData = await b44Fetch(`/entities/User/${webUserId}`);
    const webUser = webData?.record ?? webData;

    if (!webUser?.id) {
      return res.status(404).json({ success: false, error: 'Web account not found.' });
    }

    // 2. Validate the code
    const storedCode = webUser.link_verification_code;
    const expiresAt = webUser.link_verification_expires;
    const linkedMobileId = webUser.link_verification_mobile_id;

    if (!storedCode) {
      return res.status(400).json({ success: false, error: 'No verification code found. Please request a new one.' });
    }
    if (storedCode !== String(code).trim()) {
      return res.status(400).json({ success: false, error: 'Incorrect code. Please try again.' });
    }
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: 'This code has expired. Please request a new one.' });
    }
    if (linkedMobileId && linkedMobileId !== mobileUserId) {
      return res.status(400).json({ success: false, error: 'This code was issued for a different device. Please request a new one.' });
    }

    // 3. Fetch mobile account
    const mobileData = await b44Fetch(`/entities/User?apple_user_id=${encodeURIComponent(mobileUserId)}&limit=1`);
    const mobileRecords = toRecords(mobileData);
    const mobileUser = mobileRecords[0] || null;

    if (!mobileUser) {
      return res.status(404).json({ success: false, error: 'Mobile account not found. Try signing out and back in first.' });
    }

    // 4. Merge: take best of both
    const mergedCredits = Math.max(
      webUser.search_credits ?? webUser.credits ?? 0,
      mobileUser.search_credits ?? mobileUser.credits ?? 0
    );
    const mergedPlan = (webUser.subscription_type && webUser.subscription_type !== 'free')
      ? webUser.subscription_type
      : mobileUser.subscription_type || 'free';
    const mergedStatus = (webUser.subscription_status === 'active')
      ? 'active'
      : mobileUser.subscription_status || 'inactive';

    const updates = {
      subscription_type: mergedPlan,
      subscription_status: mergedStatus,
      subscription_expiry_date: webUser.subscription_expiry_date || mobileUser.subscription_expiry_date || '',
      search_credits: mergedCredits,
      credits: mergedCredits,
      monthly_free_lookups_used: Math.min(
        webUser.monthly_free_lookups_used ?? 0,
        mobileUser.monthly_free_lookups_used ?? 0
      ),
      email: webUser.email,
      linked_web_account_id: webUser.id,
      // Clear verification fields
      link_verification_code: null,
      link_verification_expires: null,
      link_verification_mobile_id: null,
    };

    // Update mobile account
    await b44Fetch(`/entities/User/${mobileUser.id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    // Mark web account as linked
    await b44Fetch(`/entities/User/${webUser.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        linked_mobile_account_id: mobileUser.id,
        link_verification_code: null,
        link_verification_expires: null,
        link_verification_mobile_id: null,
      }),
    }).catch(() => {});

    const merged = { ...mobileUser, ...updates };

    return res.status(200).json({
      success: true,
      message: `Account linked! Your ${mergedPlan} plan and ${mergedCredits} credits are now active on this device.`,
      user: {
        id: merged.id,
        email: merged.email,
        full_name: merged.full_name || webUser.full_name || '',
        apple_user_id: merged.apple_user_id,
        subscription_type: mergedPlan,
        subscription_status: mergedStatus,
        credits: mergedCredits,
        search_credits: mergedCredits,
        monthly_free_lookups_used: merged.monthly_free_lookups_used,
        role: merged.role || webUser.role || 'user',
      }
    });

  } catch (err) {
    console.error('[linkAccount] error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
