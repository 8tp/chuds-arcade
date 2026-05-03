-- Chuds Arcade — initial D1 migration.
-- D1 uses SQLite. Booleans are integers; timestamps are ISO-8601 strings.

create table if not exists players (
  id text primary key,
  handle text not null unique,
  avatar_seed text not null,
  account_type text not null default 'guest',
  created_at text not null,
  last_seen_at text not null,
  banned integer not null default 0
);

create table if not exists games (
  slug text primary key,
  title text not null,
  current_version text not null,
  current_ruleset_version text not null,
  status text not null default 'active'
);

create table if not exists runs (
  id text primary key,
  player_id text not null references players(id),
  game_slug text not null references games(slug),
  mode text not null,
  ruleset_version text not null,
  seed text not null,
  score integer not null,
  duration_ms integer not null,
  outcome text not null,
  metrics_json text not null,
  replay_id text,
  verified_level text not null default 'client',
  client_build_id text not null,
  created_at text not null
);
create index if not exists idx_runs_game_mode_score on runs(game_slug, mode, score desc);
create index if not exists idx_runs_player_created on runs(player_id, created_at desc);

create table if not exists leaderboard_entries (
  id text primary key,
  run_id text not null references runs(id),
  player_id text not null references players(id),
  game_slug text not null,
  mode text not null,
  board_key text not null,
  rank_score integer not null,
  tie_breaker integer not null,
  created_at text not null
);
create index if not exists idx_leaderboard_board_score
  on leaderboard_entries(board_key, rank_score desc, tie_breaker asc);

create table if not exists achievements (
  id text primary key,
  game_slug text,
  title text not null,
  description text not null,
  points integer not null default 0,
  hidden integer not null default 0
);

create table if not exists player_achievements (
  player_id text not null references players(id),
  achievement_id text not null references achievements(id),
  unlocked_at text not null,
  primary key (player_id, achievement_id)
);

create table if not exists replays (
  id text primary key,
  player_id text not null references players(id),
  game_slug text not null,
  mode text not null,
  seed text not null,
  ruleset_version text not null,
  storage_key text not null,
  duration_ms integer not null,
  size_bytes integer not null default 0,
  created_at text not null
);

create table if not exists daily_challenges (
  id text primary key,
  game_slug text not null,
  mode text not null,
  date text not null,
  seed text not null,
  ruleset_version text not null,
  title text not null,
  description text not null,
  expires_at text not null,
  unique(game_slug, mode, date, ruleset_version)
);

-- M2 addition: in-flight start nonces are HMAC-signed and stateless,
-- but we cache started runs so /runs/submit can detect duplicate
-- submissions and load the original seed without trusting the client.
create table if not exists pending_runs (
  run_id text primary key,
  player_id text not null,
  game_slug text not null,
  mode text not null,
  ruleset_version text not null,
  seed text not null,
  daily_date text,
  started_at text not null,
  expires_at text not null,
  submitted integer not null default 0
);
create index if not exists idx_pending_runs_player on pending_runs(player_id, started_at desc);
