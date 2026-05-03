# Architecture Spec

## Monorepo layout

```txt
apps/
  web/              Astro frontend shell
  api/              Cloudflare Worker API
packages/
  arcade-sdk/       shared types, runtime contracts, manifests
  replay/           replay event contracts and helpers
  deterministic-rng seeded RNG/hash helpers
  procedural-audio/ Synth Runner audio helpers
games/
  one-button-samurai/
  synth-runner/
  cursor-wars/
  captcha-dungeon/
db/
  schema.sql
docs/
  START_HERE.md
specs/
  platform/
  games/
prompts/
```

## Runtime model

The website owns the shell, player profile, run lifecycle, leaderboard UI, settings, and achievement notifications.

Each game owns simulation, rendering, controls, and score metrics.

Games are mounted through a shared runtime contract:

```ts
const game = await loadGame(slug);
const instance = game.mount(rootElement, arcadeRuntime);
instance.start();
```

## Separation of concerns

```txt
Arcade shell
  owns navigation, layout, profiles, leaderboards, daily run data

Game module
  owns state machine, controls, rendering, scoring metrics

API
  owns run creation, submission, leaderboard writes, replay metadata

Realtime server
  owns authoritative Cursor Wars simulation and online rooms
```

## Game module structure

```txt
games/<slug>/
  README.md
  manifest.ts
  src/
    index.ts          exports GameModule
    game.ts           state machine
    scoring.ts        pure scoring functions
    render.ts         Canvas rendering
    input.ts          input mapping
    constants.ts      timings/difficulty/settings
    __tests__/
```

## Web app routes

```txt
/                    home
/games               game grid
/g/:slug             game detail
/play/:slug          game host route
/daily               daily hub
/leaderboards        leaderboard index
/settings            local settings
```

## API routes

```txt
GET  /api/games
GET  /api/games/:slug
GET  /api/daily
GET  /api/daily/:gameSlug
POST /api/runs/start
POST /api/runs/submit
GET  /api/runs/:runId
GET  /api/leaderboards/:gameSlug/:mode
POST /api/replays
GET  /api/replays/:replayId
GET  /api/players/me
PATCH /api/players/me
GET  /api/achievements
```

## Realtime routes

```txt
POST /api/rooms
GET  /api/rooms/:roomId
WS   /api/rooms/:roomId/connect
```

Cursor Wars should be the only v0 game that requires server-authoritative realtime. One Button Samurai online duel can wait.
