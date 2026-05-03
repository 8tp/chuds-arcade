# Start Here

This package gives you enough structure to begin implementation with Claude Code or Codex without having to re-explain the concept.

## The product in one sentence

**Chuds Arcade** is a monochrome manga-zine browser arcade for small, sharp games with daily seeded runs, leaderboards, achievements, and lightweight replays.

## The first milestone

Build a static arcade shell that visually matches the black-and-white mockups:

- homepage
- game cards
- daily challenge panel
- guest profile card
- leaderboard panel
- `/play/[slug]` route
- minimal local guest identity

Do not build the games first. The games should mount into the shell through `ArcadeRuntime`.

## Where to look

- `assets/mockups/homepage.png` — current visual direction
- `specs/platform/overview.md` — product plan
- `specs/platform/design-system.md` — style rules
- `specs/platform/architecture.md` — project architecture
- `specs/games/captcha-dungeon.md` — first recommended game
- `prompts/claude-code/00-bootstrap-shell.md` — first agent prompt
