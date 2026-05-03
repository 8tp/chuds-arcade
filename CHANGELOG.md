# Changelog

## Unreleased

### Added
- Astro 5 + Svelte arcade shell matching `chuds.dev`'s manga-ink design tokens (warm cream paper, Space Grotesk display, screentone, speed-lines, grain).
- Pages: `/`, `/games`, `/daily`, `/leaderboards`, `/settings`, `/g/[slug]`, `/play/[slug]`, `/404`.
- `@chuds/arcade-sdk` — shared types, UTC daily seed helper, HMAC-SHA256 nonce, zod request/response schemas.
- `@chuds/replay` — varint+delta replay codec with JSON fallback for sparse streams.
- `@chuds/deterministic-rng`, `@chuds/procedural-audio` (types only for now).
- Cloudflare Worker (`apps/api`) with HMAC-signed run lifecycle: `/runs/start`, `/runs/submit`, `/replays`, `/leaderboards`, `/players/me`.
- Signed `chuds_guest` HttpOnly cookie minted on first request.
- D1 migrations (`0001_init`, `0002_replay_binding`) with `pending_runs` table for one-shot submit.
- Hourly cron purging expired pending runs.
- Origin-header CSRF check on every state-changing POST.
- Sanity caps on score, duration, and metrics size; replay rate-limited at 30/hour/player.
- **Captcha Dungeon MVP** — 10 select-tile templates, deterministic 10-room dungeon generator, mini-boss + final boss, scoring per spec, DOM render, keyboard navigation, 22 tests including playtest suite.
- **One Button Samurai MVP** — 4-action timing truth table, 5 bot archetypes (Bamboo Rookie, Iron Monk, Red Crane, Drunk Ronin, Mirror Ghost), Daily Dojo state machine, replay event stream, 24 tests including playtest suite.
- GitHub Actions: CI (typecheck/test/lint) + deploy-api (Wrangler).
- Documentation: README, ARCHITECTURE, SECURITY, DEPLOYMENT, CONTRIBUTING, PLAYTEST_NOTES.

### Security hardening (audit response)
- Replay endpoint now binds every upload to a `pending_runs` row by player + slug + mode + ruleset + seed.
- `/runs/submit` for resim-eligible modes verifies the `replayId` belongs to the same run.
- Daily leaderboard write gated on server-trusted `pending_runs.daily_date` (closes freeplay-board-poison bypass).
- Wildcard CORS (`ALLOWED_ORIGIN=*`) automatically drops `Allow-Credentials`.
- `metrics` capped at 32 keys / 64-char keys / 256-char strings / 4 KB JSON.
- `replayPayload.runId` is now required end-to-end.

### Balance fixes (playtest response)
- Captcha Dungeon: `STARTING_HEALTH` 3 → 5 (Average archetype was unwinnable).
- Captcha Dungeon: `timeoutRoom()` on final boss now correctly defeats instead of granting victory.
- One Button Samurai: Iron Monk and Mirror Ghost now feint 15% to give Strike-at-peak real opponents.
- One Button Samurai: Red Crane mixes 12% counter-guard to stop guarders farming a 100% win rate.
- One Button Samurai: Drunk Ronin's danger frequency reduced from 22% to 10%.
