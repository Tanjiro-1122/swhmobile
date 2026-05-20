// api/adminUsers.js — Supabase version (Base44 removed)
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = ["huertasfam@gmail.com", "huertasfam1@icloud.com"];

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.RUNE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify caller is an admin
  const callerEmail = req.headers['x-user-email'] || req.body?.callerEmail || '';
  if (!ADMIN_EMAILS.includes(callerEmail)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data: users, error } = await supabase
      .from('swh_users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw new Error(error.message);

    // Tag users by source for admin display
    const tagged = (users || []).map(u => ({
      ...u,
      _source: u.apple_user_id ? 'mobile' : 'web',
    }));

    return res.status(200).json({
      success: true,
      users: tagged,
      total: tagged.length,
    });
  } catch (err) {
    console.error('adminUsers error:', err);
    return res.status(500).json({ error: err.message });
  }
}
