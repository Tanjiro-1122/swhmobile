// api/handleAppleSignIn.js — Supabase version
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('[handleAppleSignIn] Missing env vars');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { action, identityToken, authorizationCode, user: appleUser, fullName, email: bodyEmail } = req.body || {};

    // Accept both action:'nativeSignIn' and no action field
    if (action && action !== 'nativeSignIn') {
      return res.status(400).json({ success: false, error: 'Unknown action' });
    }

    if (!identityToken) {
      return res.status(400).json({ success: false, error: 'identityToken required' });
    }

    // Decode Apple JWT
    const claims = decodeAppleJwt(identityToken);
    const appleUserId = claims.sub;
    const email = claims.email || appleUser?.email || bodyEmail || null;

    // Build display name from fullName (can be string or {givenName, familyName} object)
    let displayName = null;
    if (fullName) {
      if (typeof fullName === 'string') {
        displayName = fullName.trim() || null;
      } else if (fullName.givenName || fullName.familyName) {
        displayName = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ') || null;
      }
    }

    if (!appleUserId) {
      console.error('[handleAppleSignIn] No sub in Apple JWT. Claims:', JSON.stringify(claims).slice(0, 200));
      return res.status(400).json({ success: false, error: 'Invalid Apple identity token' });
    }

    // Look up existing user — try apple_user_id first, then fall back to email
    const { data: existingUsers, error: lookupErr } = await supabase
      .from('swh_users')
      .select('*')
      .eq('apple_user_id', appleUserId)
      .limit(1);

    if (lookupErr) {
      console.error('[handleAppleSignIn] Lookup error:', lookupErr.message);
      throw new Error('DB lookup failed: ' + lookupErr.message);
    }

    let swhUser = existingUsers?.[0];

    // Fallback: if no row by apple_user_id, match by email
    // Handles web-registered users signing in with Apple for the first time
    if (!swhUser && email) {
      const { data: emailUsers } = await supabase
        .from('swh_users')
        .select('*')
        .eq('email', email)
        .limit(1);
      if (emailUsers?.[0]) {
        swhUser = emailUsers[0];
        await supabase
          .from('swh_users')
          .update({ apple_user_id: appleUserId, updated_at: new Date().toISOString() })
          .eq('id', swhUser.id);
        swhUser.apple_user_id = appleUserId;
        console.log('[handleAppleSignIn] Linked Apple ID to existing email account:', swhUser.email);
      }
    }

    if (!swhUser) {
      // New user — only insert columns that exist in swh_users schema
      const newUser = {
        apple_user_id: appleUserId,
        email: email || null,
        display_name: displayName || null,
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
        console.error('[handleAppleSignIn] Insert error:', createErr.message, '| Data:', JSON.stringify(newUser));
        throw new Error('Failed to create user: ' + createErr.message);
      }
      swhUser = created;
      console.log('[handleAppleSignIn] New user created:', swhUser.id);
    } else {
      // Update display_name if we have one and it's not set
      if (displayName && !swhUser.display_name) {
        await supabase
          .from('swh_users')
          .update({ display_name: displayName, updated_at: new Date().toISOString() })
          .eq('id', swhUser.id);
        swhUser.display_name = displayName;
      }
      console.log('[handleAppleSignIn] Existing user signed in:', swhUser.id);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: swhUser.id,
        apple_user_id: swhUser.apple_user_id,
        email: swhUser.email,
        display_name: swhUser.display_name,
        full_name: swhUser.display_name,          // alias Splash expects
        credits: swhUser.credits ?? 0,
        search_credits: swhUser.credits ?? 5,     // alias Splash expects
        subscription_type: swhUser.subscription_type || 'free',
        subscription_status: swhUser.is_pro ? 'active' : 'free', // alias Splash expects
        is_pro: swhUser.is_pro ?? false,
      }
    });

  } catch (err) {
    console.error('[handleAppleSignIn] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
