// api/deleteAccount.js — Supabase version (Base44 removed)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.RUNE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_TABLES = [
  'swh_tracked_bets',
  'swh_prediction_outcomes',
  'swh_saved_odds',
  'swh_alerts',
  'swh_bankroll_entries',
  'swh_community_posts',
  'swh_matches',
  'swh_parlays',
  'swh_user_bets',
  'swh_error_log',
  'swh_purchase_audit',
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { appleUserId } = req.body || {};
  if (!appleUserId) {
    return res.status(400).json({ success: false, error: "appleUserId required" });
  }

  try {
    // Find user
    const { data: user, error: findErr } = await supabase
      .from('swh_users')
      .select('id, email')
      .eq('apple_user_id', appleUserId)
      .single();

    if (findErr || !user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const deletedCounts = {};

    // Delete all user data from related tables
    for (const table of USER_TABLES) {
      const { count, error } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .eq('apple_user_id', appleUserId);
      deletedCounts[table] = error ? 0 : (count || 0);
    }

    // Delete from swh_users (cascades via FK where set)
    const { error: delUserErr } = await supabase
      .from('swh_users')
      .delete()
      .eq('apple_user_id', appleUserId);

    if (delUserErr) throw new Error(delUserErr.message);

    // Also delete from Supabase Auth if email exists
    if (user.email) {
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(u => u.email === user.email);
        if (authUser) {
          await supabase.auth.admin.deleteUser(authUser.id);
        }
      } catch (authErr) {
        console.warn('Auth delete warning:', authErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Account and all data deleted",
      deleted: deletedCounts,
    });
  } catch (err) {
    console.error('deleteAccount error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
