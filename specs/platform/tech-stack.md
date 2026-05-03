# Recommended Tech Stack

## Frontend

- **Astro** for the website shell, routing, content-like pages, and fast static/server-rendered surfaces.
- **Svelte islands** for interactive UI panels, game host controls, profile/settings, and game wrappers.
- **TypeScript** everywhere.
- **Canvas 2D** for game rendering.
- **Web Audio** for Synth Runner and light arcade audio.
- **CSS custom properties + utility classes** for the design system. Tailwind can be used, but do not let utility sprawl obscure the manga editorial layout.

## Backend

Preferred deployment target:

- **Cloudflare Pages** for the Astro frontend.
- **Cloudflare Workers** for API endpoints.
- **Durable Objects** for realtime rooms, especially Cursor Wars.
- **D1** for launch database if keeping Cloudflare-native.
- **PostgreSQL** is the best long-term upgrade if leaderboards and analytics grow.
- **R2** for replay blobs and exported run data.
- **KV** only for cache-like data, not critical leaderboard state.

## Shared packages

```txt
@chuds/arcade-sdk          runtime API, game manifests, run contracts
@chuds/replay              replay event types, compression helpers later
@chuds/deterministic-rng   seeded RNG and hash helpers
@chuds/procedural-audio    Web Audio helpers for Synth Runner
```

## Validation and testing

- **Zod** for API contract validation.
- **Vitest** for game logic, scoring, generators, and replay tests.
- **Playwright** for end-to-end shell and game-host smoke tests.
- **Biome** for formatting/linting.

## Game rendering constraints

- Keep each game playable without external art assets.
- Use geometric primitives, halftone fills, strokes, silhouettes, simple icons, and tile patterns.
- Prefer deterministic draw functions over bitmap-heavy scenes.
- Keep 60 FPS as a design goal, but do not sacrifice readability.

## Audio constraints

- Audio must be optional and respect settings.
- Synth Runner should use Web Audio procedural synthesis.
- Other games should use minimal synthesized SFX.
- Provide mute and reduced-motion settings before polishing audio.

## Why this stack fits

The project should feel like a natural extension of chuds.dev: Astro for the editorial shell, TypeScript/Canvas for games, Workers/Durable Objects for multiplayer and API, and local-first guest play before accounts.
