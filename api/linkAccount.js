// api/linkAccount.js — Supabase version (Base44 removed)
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

  const { apple_user_id, email } = req.body || {};

  if (!apple_user_id || !email) {
    return res.status(400).json({ success: false, error: 'apple_user_id and email required' });
  }

  try {
    // Find user by apple_user_id and link their email
    const { data: existing } = await supabase
      .from('swh_users')
      .select('*')
      .eq('apple_user_id', apple_user_id)
      .limit(1)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { data: updated, error } = await supabase
      .from('swh_users')
      .update({ email: email.trim().toLowerCase(), updated_at: new Date().toISOString() })
      .eq('apple_user_id', apple_user_id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(200).json({ success: true, user: updated });
  } catch (err) {
    console.error('linkAccount error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
