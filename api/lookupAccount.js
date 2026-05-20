// api/lookupAccount.js — Supabase version (Base44 removed)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.RUNE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, apple_user_id } = req.body || {};

  if (!email && !apple_user_id) {
    return res.status(400).json({ success: false, error: 'email or apple_user_id required' });
  }

  try {
    let query = supabase.from('swh_users').select('*');
    if (apple_user_id) {
      query = query.eq('apple_user_id', apple_user_id);
    } else {
      query = query.eq('email', email.trim().toLowerCase());
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) {
      return res.status(200).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({ success: true, user: data });
  } catch (err) {
    console.error('lookupAccount error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
