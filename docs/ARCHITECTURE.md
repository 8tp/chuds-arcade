# Architecture

Chuds Arcade is a pnpm-workspace monorepo. The arcade shell, the worker API, and each game are separate packages that share a tiny set of contract packages.

## Layering

```
┌─────────────────────────────────────────────────────────┐
│  apps/web (Astro + Svelte islands)                      │
│   • Shell: routing, layout, profile, leaderboards       │
│   • GameHost mounts game modules via dynamic import     │
└─────────────────────────────────────────────────────────┘
            │ imports types, calls fetch(/api/...)
            ▼
┌─────────────────────────────────────────────────────────┐
│  packages/arcade-sdk (shared contracts)                 │
│   • GameModule / ArcadeRuntime / RunResult              │
│   • dailySeed() (UTC) / signNonce / verifyNonce          │
│   • zod schemas for every API request/response          │
└─────────────────────────────────────────────────────────┘
            ▲                                ▲
            │                                │
┌───────────┴──────────────┐    ┌────────────┴────────────┐
│  games/* (per-game pkg)   │    │  apps/api (CF Worker)   │
│   • Pure simulation       │    │   • /runs/start, /submit│
│   • Deterministic RNG     │    │   • /replays POST/GET   │
│   • DOM render            │    │   • /leaderboards       │
│   • Mounts via runtime    │    │   • D1 + R2 + cron       │
└───────────────────────────┘    └─────────────────────────┘
                                           │
                                           ▼
                                  ┌────────────────────┐
                                  │  D1 (SQLite)       │
                                  │  R2 (replay blobs) │
                                  └────────────────────┘
```

## Package boundaries

### `@chuds/arcade-sdk`

Single source of truth for cross-process types.

- `index.ts` — `GameManifest`, `GameModule`, `ArcadeRuntime`, `RunResult`, `ReplayPayload`, etc.
- `seed.ts` — `dailySeed(slug, mode, ruleset, date, salt)` and `todayUtc()`. UTC-anchored on purpose: every player worldwide gets the same daily run.
- `nonce.ts` — `signNonce` / `verifyNonce` using Web Crypto HMAC-SHA256.
- `schemas.ts` — zod schemas for every API endpoint. The `*Validated` suffix marks zod-inferred types so they don't collide with the canonical TS types in `index.ts`.

### `@chuds/replay`

Compact replay codec. `ReplayPayload` extends the SDK type via intersection — there is exactly one shape across the whole monorepo.

- Sparse streams (≤64 events) → JSON, prefix `J`.
- Dense streams → varint+delta with shared type table, prefix `V`.
- ~30%+ size reduction at 2.5k events.

### `@chuds/deterministic-rng`

Tiny seeded RNG. `mulberry32` + FNV-1a `hashStringToUint32`. Wrap with `createRng(seed: string)`.

### `@chuds/procedural-audio`

Web Audio helpers (Synth Runner). Currently types only — implementation lands in M5.

## Web app (`apps/web`)

Astro 5 + Svelte islands. Plain CSS (no Tailwind) so the bundle stays small and the design system is auditable in one file.

### Key modules

- `src/lib/games.ts` — explicit per-slug dynamic-import registry. Manifests load synchronously (no DOM), game modules load lazily on `/play/[slug]` via the `GameHost` Svelte client island.
- `src/lib/seed.ts` — re-exports `dailySeed` / `todayUtc` from the SDK.
- `src/lib/profile.ts` — localStorage guest profile (handle generator, reroll). Server-issued cookie supersedes it for run integrity, but the client identity is still convenient for offline/local boards.
- `src/lib/runtime.ts` — `buildRuntime(player, run)` returns the `ArcadeRuntime` a game module receives. Falls back to localStorage when the API is unreachable.

### Pages

```
/             home (daily hero + profile + recent runs + games grid)
/games        directory
/daily        daily hub with seeds for each eligible game
/leaderboards local boards (server boards land in M2 client wiring)
/settings     profile + a11y settings
/g/[slug]     per-game brief + mode chooser
/play/[slug]  GameHost client island mounts the game module
/404          404
```

### Routing detail

`/play/[slug]` and `/g/[slug]` use Astro's `getStaticPaths` against the same `gameManifests` registry, so adding a game to the registry creates both the brief page and the play page automatically.

### Design tokens

`src/styles/global.css` mirrors `chuds.dev`'s manga-ink tokens. Same `--color-bg / --color-panel / --color-fg`, same `.win` panel anatomy with the 3px ink stripe and 4px hard shadow, same `.pill` / `.screentone` / `.speed-lines` / `.grain` affordances.

## Worker (`apps/api`)

Cloudflare Worker, single entry. Handles state-changing POSTs and read-only GETs.

### Endpoints

```
GET  /api/health                     — liveness
POST /api/runs/start                 — issue HMAC nonce + insert pending row
POST /api/runs/submit                — verify nonce, sanity check, write run+leaderboard
POST /api/replays                    — bind replay to a pending run, store in R2
GET  /api/replays/:id                — gated by player unless visibility=public
GET  /api/players/me                 — guest profile from cookie
GET  /api/leaderboards/:slug/:mode   — daily | all-time
```

### Data flow — daily run lifecycle

```
client                                        worker
  │  POST /runs/start { gameSlug, mode, dailyDate }
  ├────────────────────────────────────────────────►
  │                          1. derive seed (UTC, server-side)
  │                          2. insert pending_runs row
  │                          3. sign nonce { runId, playerId, slug, ... }
  │  { runId, seed, serverNonce, ... }
  ◄────────────────────────────────────────────────┤
  │  game plays...
  │  POST /replays  { runId, events, ... }   (resim modes only)
  ├────────────────────────────────────────────────►
  │                          4. verify pending_runs match
  │                          5. store blob in R2
  │                          6. row in replays(player_id, run_id, ...)
  │  { replayId }
  ◄────────────────────────────────────────────────┤
  │  POST /runs/submit { runId, score, metrics, replayId, serverNonce }
  ├────────────────────────────────────────────────►
  │                          7. verifyNonce
  │                          8. fields match nonce + pending_runs
  │                          9. resim modes: replayId bound to this run
  │                         10. sanity caps (score, duration, metrics size)
  │                         11. mark pending submitted (one-shot)
  │                         12. insert runs + leaderboard_entries (daily only if pending.daily_date)
  │  { accepted, rank, personalBest, unlockedAchievements }
  ◄────────────────────────────────────────────────┤
```

### Hourly cron

Purges expired `pending_runs` rows that were never submitted. See `apps/api/src/index.ts`'s `scheduled()` handler.

## Data model

D1 (SQLite). See `db/migrations/0001_init.sql` and `0002_replay_binding.sql`.

```
players
runs
leaderboard_entries
achievements
player_achievements
replays                  ← run_id, visibility added in 0002
daily_challenges
pending_runs             ← M2 addition: nonce-tied row for one-shot submit
```

## Why these decisions

- **UTC daily boundary.** Anything else gives different timezones different "todays". Boring is correct.
- **Server-derived seeds.** Client never sets the seed it plays — it asks for one and gets a signed cookie's worth of identity bound to it.
- **HMAC nonce + pending_runs.** Stateless signature alone can't prevent replay attacks; the pending row gives one-shot submit and lets us audit start↔submit pairs.
- **Daily board write keyed off `pending.daily_date`.** Closed the freeplay-poison-daily bypass that QA caught.
- **Plain CSS, no Tailwind.** chuds.dev uses Tailwind 4. Arcade is a smaller surface; CSS vars + ~280 lines of stylesheet read better and keep the bundle small.
- **Each game is its own workspace package.** Testable in isolation, lazy-loaded by the host, separate version + ruleset versioning.
- **`replayPayload.runId` is required.** Closes the "reuse one valid replay across runs" attack the audit found.
