-- M2 hardening: bind replays to the run that produced them so submit can
-- verify ownership and the daily board can't be poisoned by reused replays.

alter table replays add column run_id text;
alter table replays add column visibility text not null default 'public';

create index if not exists idx_replays_player_recent on replays(player_id, created_at desc);
