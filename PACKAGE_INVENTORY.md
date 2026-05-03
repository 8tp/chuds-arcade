# Package Inventory

## Mockups

The newest black-and-white manga/editorial mockups are included here:

```txt
assets/mockups/homepage.png
assets/mockups/one-button-samurai.png
assets/mockups/synth-runner.png
assets/mockups/cursor-wars.png
assets/mockups/captcha-dungeon.png
```

They are also copied to:

```txt
apps/web/public/mockups/
```

so the game manifest `thumbnail` paths like `/mockups/one-button-samurai.png` resolve when the Astro app is implemented.

## Platform specs

```txt
specs/platform/overview.md
specs/platform/tech-stack.md
specs/platform/design-system.md
specs/platform/architecture.md
specs/platform/runtime-sdk.md
specs/platform/daily-leaderboards-achievements.md
specs/platform/data-model.md
specs/platform/api-contracts.md
specs/platform/roadmap.md
```

## Game specs

```txt
specs/games/one-button-samurai.md
specs/games/synth-runner.md
specs/games/cursor-wars.md
specs/games/captcha-dungeon.md
specs/games/antmaze-port.md
```

## Starter code/scaffold

```txt
apps/web/                       Astro shell placeholder
apps/api/                       Cloudflare Worker placeholder
packages/arcade-sdk/            shared runtime types
packages/deterministic-rng/     seeded RNG helper
packages/replay/                replay event contract
packages/procedural-audio/      Synth Runner audio package placeholder
games/*/src/manifest.ts         game manifests
games/*/src/index.ts            game mount placeholders
db/schema.sql                   starter database schema
```

## Agent prompts

```txt
CLAUDE.md
AGENTS.md
prompts/claude-code/*.md
prompts/codex/*.md
```
