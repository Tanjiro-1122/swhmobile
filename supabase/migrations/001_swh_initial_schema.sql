-- ============================================================
-- SWH → Supabase Migration: PR 1 — Full Schema
-- Run this in Supabase SQL Editor for project: hvvrbpvsgjxiicigkwhu
-- ============================================================

-- ── swh_users ────────────────────────────────────────────────
create table if not exists swh_users (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique,
  apple_user_id       text unique,
  display_name        text,
  credits             integer default 0,
  subscription_type   text default 'free',
  is_pro              boolean default false,
  stripe_customer_id  text,
  revenuecat_user_id  text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index if not exists swh_users_email_idx        on swh_users(email);
create index if not exists swh_users_apple_idx        on swh_users(apple_user_id);
alter table swh_users enable row level security;
create policy "service_role_all" on swh_users for all using (true) with check (true);

-- ── swh_tracked_bets ─────────────────────────────────────────
create table if not exists swh_tracked_bets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete cascade,
  apple_user_id       text,
  sport               text,
  league              text,
  bet_type            text,
  selection           text,
  match_description   text,
  odds                numeric,
  decimal_odds        numeric,
  stake               numeric,
  actual_profit       numeric,
  payout              numeric,
  result              text default 'pending',  -- pending | won | lost | push | void
  bet_date            timestamptz default now(),
  settled_date        timestamptz,
  sportsbook          text,
  notes               text,
  confidence          text,
  is_live_bet         boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index if not exists swh_tracked_bets_user_idx  on swh_tracked_bets(user_id);
create index if not exists swh_tracked_bets_apple_idx on swh_tracked_bets(apple_user_id);
create index if not exists swh_tracked_bets_date_idx  on swh_tracked_bets(bet_date desc);
alter table swh_tracked_bets enable row level security;
create policy "service_role_all" on swh_tracked_bets for all using (true) with check (true);

-- ── swh_prediction_outcomes ──────────────────────────────────
create table if not exists swh_prediction_outcomes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete cascade,
  apple_user_id       text,
  prediction_id       text,
  prediction_type     text,
  sport               text,
  match_description   text,
  predicted_winner    text,
  actual_winner       text,
  predicted_score     text,
  prediction          jsonb,
  was_correct         boolean,
  confidence          text,
  predicted_confidence text,
  match_date          timestamptz,
  created_at          timestamptz default now()
);
create index if not exists swh_pred_outcomes_user_idx on swh_prediction_outcomes(user_id);
create index if not exists swh_pred_outcomes_date_idx on swh_prediction_outcomes(match_date desc);
alter table swh_prediction_outcomes enable row level security;
create policy "service_role_all" on swh_prediction_outcomes for all using (true) with check (true);

-- ── swh_saved_odds ───────────────────────────────────────────
create table if not exists swh_saved_odds (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete cascade,
  apple_user_id       text,
  sport               text,
  league              text,
  home_team           text,
  away_team           text,
  home_odds           numeric,
  away_odds           numeric,
  draw_odds           numeric,
  opening_home_odds   numeric,
  opening_away_odds   numeric,
  sportsbook          text,
  event_date          timestamptz,
  is_active           boolean default true,
  notes               text,
  created_at          timestamptz default now()
);
alter table swh_saved_odds enable row level security;
create policy "service_role_all" on swh_saved_odds for all using (true) with check (true);

-- ── swh_alerts ───────────────────────────────────────────────
create table if not exists swh_alerts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete cascade,
  apple_user_id       text,
  alert_type          text default 'odds_change',
  match_description   text,
  trigger_condition   text,
  is_active           boolean default true,
  created_at          timestamptz default now()
);
alter table swh_alerts enable row level security;
create policy "service_role_all" on swh_alerts for all using (true) with check (true);

-- ── swh_bankroll_entries ─────────────────────────────────────
create table if not exists swh_bankroll_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete cascade,
  apple_user_id       text,
  amount              numeric,
  entry_type          text,  -- deposit | withdrawal | win | loss
  description         text,
  entry_date          timestamptz default now(),
  created_at          timestamptz default now()
);
alter table swh_bankroll_entries enable row level security;
create policy "service_role_all" on swh_bankroll_entries for all using (true) with check (true);

-- ── swh_betting_briefs ───────────────────────────────────────
create table if not exists swh_betting_briefs (
  id                  uuid primary key default gen_random_uuid(),
  title               text,
  sport               text,
  content             text,
  picks               jsonb,
  published_at        timestamptz default now(),
  created_at          timestamptz default now()
);
alter table swh_betting_briefs enable row level security;
create policy "service_role_all" on swh_betting_briefs for all using (true) with check (true);

-- ── swh_community_posts ──────────────────────────────────────
create table if not exists swh_community_posts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete cascade,
  apple_user_id       text,
  post_type           text default 'pick',
  title               text,
  content             text,
  sport               text,
  pick                text,
  odds                text,
  confidence          text default 'medium',
  upvotes             integer default 0,
  created_at          timestamptz default now()
);
alter table swh_community_posts enable row level security;
create policy "service_role_all" on swh_community_posts for all using (true) with check (true);

-- ── swh_matches ──────────────────────────────────────────────
create table if not exists swh_matches (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete cascade,
  apple_user_id       text,
  sport               text,
  league              text,
  home_team           text,
  away_team           text,
  match_date          timestamptz,
  prediction          jsonb,
  result              jsonb,
  status              text default 'upcoming',
  created_at          timestamptz default now()
);
create index if not exists swh_matches_date_idx on swh_matches(match_date desc);
alter table swh_matches enable row level security;
create policy "service_role_all" on swh_matches for all using (true) with check (true);

-- ── swh_parlays ──────────────────────────────────────────────
create table if not exists swh_parlays (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete cascade,
  apple_user_id       text,
  legs                jsonb,
  total_odds          numeric,
  stake               numeric,
  potential_payout    numeric,
  result              text default 'pending',
  created_at          timestamptz default now()
);
alter table swh_parlays enable row level security;
create policy "service_role_all" on swh_parlays for all using (true) with check (true);

-- ── swh_player_stats ─────────────────────────────────────────
create table if not exists swh_player_stats (
  id                  uuid primary key default gen_random_uuid(),
  player_name         text,
  team                text,
  sport               text,
  season              text,
  stats               jsonb,
  fetched_at          timestamptz default now(),
  created_at          timestamptz default now()
);
create index if not exists swh_player_stats_name_idx on swh_player_stats(player_name);
alter table swh_player_stats enable row level security;
create policy "service_role_all" on swh_player_stats for all using (true) with check (true);

-- ── swh_team_stats ───────────────────────────────────────────
create table if not exists swh_team_stats (
  id                  uuid primary key default gen_random_uuid(),
  team_name           text,
  sport               text,
  season              text,
  stats               jsonb,
  fetched_at          timestamptz default now(),
  created_at          timestamptz default now()
);
create index if not exists swh_team_stats_name_idx on swh_team_stats(team_name);
alter table swh_team_stats enable row level security;
create policy "service_role_all" on swh_team_stats for all using (true) with check (true);

-- ── swh_purchase_audit ───────────────────────────────────────
create table if not exists swh_purchase_audit (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete set null,
  apple_user_id       text,
  user_email          text,
  product_id          text,
  transaction_id      text unique,
  amount              numeric,
  currency            text default 'USD',
  platform            text,
  status              text,
  credits_granted     integer default 0,
  subscription_type   text,
  raw_receipt         text,
  created_at          timestamptz default now()
);
alter table swh_purchase_audit enable row level security;
create policy "service_role_all" on swh_purchase_audit for all using (true) with check (true);

-- ── swh_user_bets ────────────────────────────────────────────
create table if not exists swh_user_bets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete cascade,
  apple_user_id       text,
  bet_data            jsonb,
  status              text default 'active',
  created_at          timestamptz default now()
);
alter table swh_user_bets enable row level security;
create policy "service_role_all" on swh_user_bets for all using (true) with check (true);

-- ── swh_error_log ────────────────────────────────────────────
create table if not exists swh_error_log (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references swh_users(id) on delete set null,
  apple_user_id       text,
  user_email          text,
  page                text,
  error_message       text,
  error_stack         text,
  context             jsonb,
  severity            text default 'error',
  resolved            boolean default false,
  created_at          timestamptz default now()
);
alter table swh_error_log enable row level security;
create policy "service_role_all" on swh_error_log for all using (true) with check (true);

-- ── updated_at auto-trigger ──────────────────────────────────
create or replace function swh_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger swh_users_updated_at
  before update on swh_users
  for each row execute function swh_set_updated_at();

create or replace trigger swh_tracked_bets_updated_at
  before update on swh_tracked_bets
  for each row execute function swh_set_updated_at();
