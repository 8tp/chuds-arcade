# Claude Code Prompt — Bootstrap Shell

Read these files first:

- `CLAUDE.md`
- `specs/platform/overview.md`
- `specs/platform/design-system.md`
- `specs/platform/architecture.md`
- `assets/mockups/homepage.png`

Task:

Build the first pass of the Chuds Arcade web shell. Do not implement full games yet.

Deliver:

- working Astro app
- homepage matching the monochrome manga/zine direction
- reusable panel/card/button components
- local guest profile creator
- game card grid for the four launch games
- daily challenge panel
- static leaderboard and achievements panels
- `/play/[slug]` route that can mount placeholder game modules

Constraints:

- monochrome only
- no neon/glow/gradient-heavy UI
- do not pixel-copy the mockup
- keep CSS clean and componentized
- write types for game metadata
