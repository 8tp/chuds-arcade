# Chuds Arcade

> A monochrome manga-zine browser arcade. Daily seeded runs, lightweight replays, and a guest-first arcade you can finish on a coffee break.

[![ci](https://github.com/8tp/chuds-arcade/actions/workflows/ci.yml/badge.svg)](https://github.com/8tp/chuds-arcade/actions/workflows/ci.yml)

```
// chuds_arcade mag · vol. 2026 · issue 01 · p. 001
チャッズ・アーケード — playable basement annex
```

Sister project to [chuds.dev](https://chuds.dev). Same paper, same ink, smaller arcades.

---

## What ships in v0

- **Captcha Dungeon** — fake-CAPTCHA select-tile roguelite. 10 rooms, 2 bosses, deterministic daily.
- **One Button Samurai** — press/hold/release timing duel. 5 bot archetypes, daily ladder.
- **Synth Runner** — three-lane rhythm runner _(scaffold; spec only — implementation in M5)_.
- **Cursor Wars** — top-down cursor arena _(scaffold; spec only — bot arena in M6, multiplayer in M7)_.

Plus an arcade shell (homepage, daily hub, leaderboards, profile/settings, per-game brief), a Cloudflare Worker API with HMAC-signed run lifecycle, signed guest cookies, D1 persistence, R2 replay storage, and a varint+delta replay codec.

## Quick start

```bash
pnpm install
pnpm --filter @chuds/web dev   # arcade shell on http://localhost:4321
```

That gets you the static shell with two playable games. The API is optional in dev — the runtime falls back to a localStorage leaderboard if the worker isn't running.

To run the full stack:

```bash
# Terminal 1 — web
pnpm --filter @chuds/web dev

# Terminal 2 — worker (after one-time D1 setup, see DEPLOYMENT.md)
pnpm --filter @chuds/api dev
```

## Repo layout

```
apps/
  web/                 Astro frontend shell (the arcade)
  api/                 Cloudflare Worker API (D1 + R2 + cron)
packages/
  arcade-sdk/          Shared types, seed format, HMAC nonce, zod schemas
  replay/              Varint+delta replay codec, extends arcade-sdk types
  deterministic-rng/   Mulberry32 + FNV string→u32 hash
  procedural-audio/    Web Audio helpers (synth-runner)
games/
  captcha-dungeon/     Implemented MVP
  one-button-samurai/  Implemented MVP
  synth-runner/        Stub + manifest + spec
  cursor-wars/         Stub + manifest + spec
db/migrations/         D1 SQL migrations (0001 init, 0002 replay binding)
docs/                  Architecture, security, deployment, contributing
specs/platform/        Platform-wide product/architecture/design specs
specs/games/           Per-game design specs
prompts/               Ready-to-paste prompts for Claude Code / Codex
```

## Workflows

Common tasks:

```bash
pnpm -r typecheck            # tsc --noEmit across every package
pnpm -r test                 # vitest run, every package
pnpm -r lint                 # biome check src
pnpm --filter @chuds/web build
```

Per-game:

```bash
pnpm --filter @chuds/game-captcha-dungeon test
pnpm --filter @chuds/game-one-button-samurai test
```

D1 migrations (after one-time `wrangler d1 create chuds-arcade`):

```bash
pnpm --filter @chuds/api db:apply:local
pnpm --filter @chuds/api db:apply
```

## Visual direction

Chuds Arcade matches `chuds.dev`'s "manga-ink" tokens exactly:

- Paper `#f3f0e8`, panel `#fffdf7`, ink `#090909`.
- Space Grotesk display (600/700/900), Inter body, JetBrains Mono microcopy.
- `.win` panels with a 3px ink stripe and a hard 4px ink shadow.
- Screentone, speed-lines, grain overlay. No neon, no glow, no glassmorphism.
- "// section" headers, `ep. 02` stamps, ASCII rules, magazine colophon footer.

Mockups live in `assets/mockups/` and are direction, not pixel targets.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — runtime model, package boundaries, request lifecycle.
- [`docs/SECURITY.md`](docs/SECURITY.md) — HMAC nonce, signed cookie, replay binding, sanity caps, CSRF.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Cloudflare Pages + Workers + D1 + R2 setup, secrets, cron.
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — adding a game, the runtime contract, testing rules.
- [`specs/platform/`](specs/platform/) — product, design, runtime, data, API contracts, roadmap.
- [`specs/games/`](specs/games/) — per-game design specs.

## Status

- M0 — repo plumbing — **done**
- M1 — arcade shell — **done**
- M2 — run lifecycle (HMAC nonce, signed cookie, daily seed, D1, R2) — **done**
- M3 — Captcha Dungeon MVP — **done** (10 templates, deterministic generator, 22 tests passing)
- M4 — One Button Samurai MVP — **done** (5 bots, clash truth table, 24 tests passing)
- M5 — Synth Runner MVP — _next_
- M6 — Cursor Wars Bot Arena — _planned_
- M7 — Cursor Wars Private Rooms (Durable Objects) — _planned_

## License

This project is private until launch. See `LICENSE` once it lands.
