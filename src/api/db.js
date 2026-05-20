// Supabase entity layer
// Drop-in replacement: same .list(), .filter(), .create(), .update(), .delete() API shape
import { supabase } from './supabaseClient';

function makeTable(tableName) {
  return {
    list: async (order = '-created_at', limit = 200) => {
      const col = order.startsWith('-') ? order.slice(1) : order;
      const asc = !order.startsWith('-');
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(col, { ascending: asc })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data;
    },
    filter: async (query = {}, order = '-created_at', limit = 200) => {
      const col = order.startsWith('-') ? order.slice(1) : order;
      const asc = !order.startsWith('-');
      let req = supabase.from(tableName).select('*');
      for (const [k, v] of Object.entries(query)) {
        req = req.eq(k, v);
      }
      const { data, error } = await req.order(col, { ascending: asc }).limit(limit);
      if (error) throw new Error(error.message);
      return data;
    },
    get: async (id) => {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data;
    },
    create: async (record) => {
      const { data, error } = await supabase.from(tableName).insert(record).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    update: async (id, record) => {
      const { data, error } = await supabase.from(tableName).update(record).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    },
  };
}

// Supabase entity layer
export const TrackedBet        = makeTable('swh_tracked_bets');
export const PredictionOutcome = makeTable('swh_prediction_outcomes');
export const SavedOdds         = makeTable('swh_saved_odds');
export const Alert             = makeTable('swh_alerts');
export const BankrollEntry     = makeTable('swh_bankroll_entries');
export const BettingBrief      = makeTable('swh_betting_briefs');
export const CommunityPost     = makeTable('swh_community_posts');
export const Match             = makeTable('swh_matches');
export const Parlay            = makeTable('swh_parlays');
export const PlayerStats       = makeTable('swh_player_stats');
export const TeamStats         = makeTable('swh_team_stats');
export const PurchaseAudit     = makeTable('swh_purchase_audit');
export const UserBet           = makeTable('swh_user_bets');
export const ErrorLog          = makeTable('swh_error_log');
export const User              = makeTable('swh_users');
