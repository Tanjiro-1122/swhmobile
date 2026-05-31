// api/handleAppleSignIn.js — Supabase version
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.RUNE_SUPABASE_SERVICE_ROLE_KEY;

function decodeAppleJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Validate env vars first
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('[handleAppleSignIn] Missing env vars — SUPABASE_URL:', !!SUPABASE_URL, 'KEY:', !!SUPABASE_KEY);
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { action, identityToken, authorizationCode, user: appleUser, fullName, email: bodyEmail } = req.body || {};

    // Accept both explicit action:'nativeSignIn' and direct calls (no action field)
    if (action && action !== 'nativeSignIn') {
      return res.status(400).json({ success: false, error: 'Unknown action' });
    }

    if (!identityToken) {
      console.error('[handleAppleSignIn] No identityToken in request body');
      return res.status(400).json({ success: false, error: 'identityToken required' });
    }

    // Decode Apple JWT to get sub (apple_user_id) and email
    const claims = decodeAppleJwt(identityToken);
    const appleUserId = claims.sub;
    const email = claims.email || appleUser?.email || bodyEmail || null;
    const displayName = fullName
      ? (typeof fullName === 'string' ? fullName : [fullName.givenName, fullName.familyName].filter(Boolean).join(' '))
      : null;

    if (!appleUserId) {
      console.error('[handleAppleSignIn] Could not extract sub from Apple JWT. Claims:', JSON.stringify(claims).slice(0, 200));
      return res.status(400).json({ success: false, error: 'Invalid Apple identity token — could not extract user ID' });
    }

    // Upsert into swh_users
    const { data: existingUsers, error: lookupErr } = await supabase
      .from('swh_users')
      .select('*')
      .eq('apple_user_id', appleUserId)
      .limit(1);

    if (lookupErr) {
      console.error('[handleAppleSignIn] Supabase lookup error:', lookupErr.message);
      throw new Error(`DB lookup failed: ${lookupErr.message}`);
    }

    let swhUser = existingUsers?.[0];

    if (!swhUser) {
      // New user — create record
      const newUser = {
        apple_user_id: appleUserId,
        email: email || null,
        display_name: displayName || null,
        full_name: displayName || null,
        credits: 0,
        subscription_type: 'free',
        is_pro: false,
      };
      const { data: created, error: createErr } = await supabase
        .from('swh_users')
        .insert(newUser)
        .select()
        .single();

      if (createErr) {
        console.error('[handleAppleSignIn] Supabase insert error:', createErr.message);
        throw new Error(`Failed to create user: ${createErr.message}`);
      }
      swhUser = created;
      console.log('[handleAppleSignIn] New user created:', swhUser.id);
    } else {
      // Existing user — update display_name if we got one
      if (displayName && !swhUser.display_name) {
        await supabase
          .from('swh_users')
          .update({ display_name: displayName, full_name: displayName, updated_at: new Date().toISOString() })
          .eq('id', swhUser.id);
        swhUser.display_name = displayName;
        swhUser.full_name = displayName;
      }
      console.log('[handleAppleSignIn] Existing user signed in:', swhUser.id);
    }

    // Return user — include all field aliases Splash/Dashboard expect
    return res.status(200).json({
      success: true,
      user: {
        id: swhUser.id,
        apple_user_id: swhUser.apple_user_id,
        email: swhUser.email,
        display_name: swhUser.display_name,
        full_name: swhUser.full_name || swhUser.display_name,
        credits: swhUser.credits ?? 0,
        search_credits: swhUser.credits ?? 5,
        subscription_type: swhUser.subscription_type || 'free',
        subscription_status: swhUser.is_pro ? 'active' : 'free',
        is_pro: swhUser.is_pro ?? false,
      }
    });

  } catch (err) {
    console.error('[handleAppleSignIn] Unhandled error:', err.message, err.stack?.slice(0, 300));
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
