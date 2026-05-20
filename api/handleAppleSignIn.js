// api/handleAppleSignIn.js — Supabase version (Base44 removed)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.RUNE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { action, identityToken, user: appleUser, fullName } = req.body || {};

    if (action !== 'nativeSignIn') {
      return res.status(400).json({ success: false, error: 'Unknown action' });
    }

    if (!identityToken) {
      return res.status(400).json({ success: false, error: 'identityToken required' });
    }

    // Decode Apple JWT to get sub (apple_user_id) and email
    const claims = decodeAppleJwt(identityToken);
    const appleUserId = claims.sub;
    const email = claims.email || appleUser?.email || null;
    const displayName = fullName
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
      : null;

    if (!appleUserId) {
      return res.status(400).json({ success: false, error: 'Invalid Apple identity token' });
    }

    // Upsert into swh_users
    const { data: existingUsers } = await supabase
      .from('swh_users')
      .select('*')
      .eq('apple_user_id', appleUserId)
      .limit(1);

    let swhUser = existingUsers?.[0];

    if (!swhUser) {
      // New user — create record
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

      if (createErr) throw new Error(`Failed to create user: ${createErr.message}`);
      swhUser = created;
    } else if (displayName && !swhUser.display_name) {
      // Update display name if not set
      await supabase
        .from('swh_users')
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq('id', swhUser.id);
      swhUser.display_name = displayName;
    }

    // Also upsert into Supabase Auth if email is available
    if (email) {
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = authUsers?.users?.find(u => u.email === email);
        if (!existingAuthUser) {
          await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { apple_user_id: appleUserId, display_name: displayName }
          });
        }
      } catch (authErr) {
        // Non-fatal — swh_users is the source of truth for native auth
        console.warn('Supabase Auth upsert warning:', authErr.message);
      }
    }

    // Return user (keep same shape as before for frontend compatibility)
    return res.status(200).json({
      success: true,
      user: {
        id: swhUser.id,
        apple_user_id: swhUser.apple_user_id,
        email: swhUser.email,
        display_name: swhUser.display_name,
        credits: swhUser.credits,
        subscription_type: swhUser.subscription_type,
        is_pro: swhUser.is_pro,
      }
    });

  } catch (err) {
    console.error('handleAppleSignIn error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
