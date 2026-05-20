// api/addCredits.js — Supabase version (Base44 removed)
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

  try {
    const { appleUserId, creditsToAdd, productId } = req.body || {};

    if (!appleUserId || !creditsToAdd) {
      return res.status(400).json({ success: false, error: 'appleUserId and creditsToAdd are required' });
    }
    if (creditsToAdd <= 0 || creditsToAdd > 500) {
      return res.status(400).json({ success: false, error: 'Invalid credits amount' });
    }

    // Find user by apple_user_id
    const { data: user, error: findErr } = await supabase
      .from('swh_users')
      .select('*')
      .eq('apple_user_id', appleUserId)
      .single();

    if (findErr || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const newCredits = (user.credits || 0) + creditsToAdd;

    const { data: updated, error: updateErr } = await supabase
      .from('swh_users')
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq('apple_user_id', appleUserId)
      .select()
      .single();

    if (updateErr) throw new Error(updateErr.message);

    // Log to purchase audit
    await supabase.from('swh_purchase_audit').insert({
      apple_user_id: appleUserId,
      product_id: productId || 'unknown',
      credits_granted: creditsToAdd,
      status: 'completed',
      platform: 'ios',
      currency: 'USD',
    });

    return res.status(200).json({
      success: true,
      user: { id: updated.id, credits: updated.credits, apple_user_id: updated.apple_user_id }
    });
  } catch (err) {
    console.error('addCredits error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
