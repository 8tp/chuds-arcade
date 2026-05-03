# Claude Code Instructions

You are coding **Chuds Arcade**, a browser-first arcade with a black-and-white manga/zine aesthetic. The mockups are reference material, not pixel-perfect targets.

## Non-negotiable style direction

- Monochrome only by default: white, black, gray, screentone.
- No neon, no glow-heavy cyberpunk, no glassmorphism, no saturated gradients.
- Use editorial manga/zine layout: panels, issue labels, page numbers, `//` section headers, thin rules, bold headings.
- Games should be simple, readable, and fast. Prefer Canvas 2D and clean geometric sprites.
- Do not overbuild. Every feature should support daily runs, short sessions, or replayable arcade loops.

## Engineering expectations

- TypeScript throughout.
- Keep game logic deterministic where possible.
- Separate pure game simulation from rendering and DOM UI.
- Keep shared contracts in `packages/arcade-sdk`.
- Use specs before coding. Update specs when implementation decisions change.
- Favor tiny modules and explicit state machines over sprawling components.
- Add tests for deterministic generators, scoring, and replay validation.

## Coding agent workflow

1. Read `specs/platform/overview.md`, `specs/platform/architecture.md`, and `specs/platform/design-system.md`.
2. Pick the relevant game spec in `specs/games/`.
3. Implement the smallest playable slice.
4. Add tests for scoring, seed generation, and critical state transitions.
5. Keep UI minimal and monochrome.
6. Leave TODO comments only where the next task is obvious.

## Do not

- Do not recreate the generated mockups exactly.
- Do not add auth before guest profiles work.
- Do not build ranked multiplayer before single-player daily modes work.
- Do not depend on image assets for core gameplay readability.
- Do not ship fake CAPTCHA mechanics that resemble real CAPTCHA bypass. The game is parody and puzzle-only.
