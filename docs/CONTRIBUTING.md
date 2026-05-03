# Contributing

Most contributions to Chuds Arcade are new games. This guide is the shape of that work plus the rules every game has to follow.

## Rules every game obeys

1. **Monochrome only.** Black ink, cream paper, screentone. No neon, no glow, no saturated colour, no glassmorphism. CSS vars `--color-fg`, `--color-bg`, `--color-panel`, etc. inherit from the host shell — use them, don't introduce new ones.
2. **Deterministic from the seed.** Same seed → same dungeon / chart / arena. The arcade audits this for daily fairness.
3. **No image assets for core gameplay.** Use canvas primitives, glyphs, line art. Thumbnails are fine.
4. **Pure simulation, separate render.** `game.ts` exposes a snapshot; `render.ts` is a pure function `(snapshot) → DOM`. Game logic doesn't touch the DOM.
5. **No DOM imports outside the render layer.** `game.ts` should typecheck cleanly even if `lib: ["DOM"]` were removed.
6. **Submit a normalised `RunResult` through the runtime.** Never call leaderboard endpoints directly.
7. **Tests for scoring, generators, and any state machine.** See the existing `__tests__/` for shape.

## Adding a new game

```
games/<slug>/
  package.json              "@chuds/game-<slug>"
  tsconfig.json             extends ../../tsconfig.base.json
  README.md                 short pitch
  src/
    manifest.ts             GameManifest export
    index.ts                GameModule export (default + named `game`)
    game.ts                 pure orchestrator
    render.ts               DOM render, monochrome
    constants.ts            timing / scoring numbers
    types.ts                game-specific types
    __tests__/              vitest suites
```

### Manifest

Mirror the other games' `manifest.ts`. The `slug` must match the directory name and the package's exports map subpath. The shell registry expects:

- `package.json#exports['./manifest']` → `./src/manifest.ts`
- `package.json#exports['.']` → `./src/index.ts`

### Wiring into the shell

`apps/web/src/lib/games.ts`:

```ts
import { manifest as myGame } from "@chuds/game-my-game/manifest";

export const gameManifests: GameManifest[] = [
  // ... existing ones
  myGame,
];

const loaders: Record<string, GameLoader> = {
  // ...
  "my-game": () => import("@chuds/game-my-game").then((m) => m.default ?? m.game),
};
```

`apps/web/package.json` — add `"@chuds/game-my-game": "workspace:*"` under `dependencies`.

### Wiring into the worker

`apps/api/src/lib/games.ts`:

```ts
"my-game": {
  slug: "my-game",
  rulesetVersion: "my-game-rules-v1",
  modes: { "daily": { dailyEligible: true, requiredVerification: "sanity" } },
},
```

`apps/api/src/lib/sanity.ts` — add a row to `CAPS` with reasonable score/duration ceilings. **Don't trust the client's score range when designing this.**

### Game module contract

```ts
export const game: GameModule = {
  manifest,
  mount(root: HTMLElement, runtime: ArcadeRuntime): GameInstance {
    // ... wire keyboard, render loop, runtime.submitRun(...)
    return { start() {}, pause() {}, resume() {}, destroy() {} };
  },
};
export default game;
```

The runtime gives you:

- `runtime.run.seed` — server-derived if online, locally derived otherwise.
- `runtime.run.runId`, `serverNonce`, `mode`, `dailyDate?`, `startedAt`.
- `runtime.player` — `{ id, handle, avatarSeed }`.
- `runtime.submitRun(result)` — call exactly once when the run ends.
- `runtime.saveReplay(payload)` — pre-call before submit if your mode is resim-eligible. The payload's `runId` must equal `runtime.run.runId`.

### Tests

Every game needs:

- A scoring test that re-derives the spec formula from constants.
- A determinism test: same seed → same generated structure (dungeon / chart / arena layout).
- A state-machine test: at minimum, the win condition and the loss condition.
- (Encouraged) a "playtest" suite that simulates synthetic player archetypes and reports balance numbers — see `games/captcha-dungeon/src/__tests__/playtest.test.ts`.

## Workflow

```bash
pnpm install
pnpm -r typecheck                # gate all of it
pnpm -r test                     # 49 tests at v0
pnpm -r lint                     # biome
pnpm --filter @chuds/web build   # full Astro build, 14 pages
pnpm --filter @chuds/web dev     # play locally
```

## Style

- **TypeScript strict mode.** `exactOptionalPropertyTypes: true` is on — use conditional spread `{ ...(x ? { x } : {}) }` instead of post-build mutation.
- **Biome formatting.** 2-space indent, double quotes, semicolons, 100-char lines. `pnpm -r lint` must pass.
- **`*.svelte` and `*.astro` are excluded from biome** because Biome's JS rules misbehave on Svelte's `export let` props. Format them by hand.
- **Don't add tests that document bugs as expected behavior.** When QA finds a bug, fix the bug; the test should assert the correct behavior.

## Specs

Every game has a spec in `specs/games/`. If your design changes mid-implementation, update the spec — don't let it rot.

Platform-wide specs live in `specs/platform/`. Touching the runtime contract (`runtime-sdk.md`, `api-contracts.md`, `data-model.md`) usually means a migration; coordinate before merging.

## Pull request checklist

- [ ] `pnpm -r typecheck` passes
- [ ] `pnpm -r test` passes
- [ ] `pnpm -r lint` passes
- [ ] `pnpm --filter @chuds/web build` succeeds
- [ ] If the game changed scoring or balance, the playtest suite was re-run
- [ ] Spec updated if the design changed
- [ ] Server registry (`apps/api/src/lib/games.ts`) and sanity caps updated for new modes
- [ ] No new colour outside the manga-ink palette
