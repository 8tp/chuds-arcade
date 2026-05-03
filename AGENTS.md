# Agent Instructions for Chuds Arcade

This repository is a blueprint and starter scaffold. Build incrementally.

## Priority order

1. Platform shell, routing, layout, design tokens.
2. Guest profile and local persistence.
3. Daily seed generation and run lifecycle.
4. Leaderboards using stubbed/local data first.
5. Captcha Dungeon MVP.
6. One Button Samurai MVP.
7. Synth Runner MVP.
8. Cursor Wars bot arena, then realtime multiplayer.

## Code quality

- Use TypeScript strict mode.
- Pure simulation logic should not import DOM APIs.
- Rendering should consume immutable snapshots from game state.
- Keep public runtime API stable.
- Validate API input with Zod or equivalent.
- Avoid magic numbers; centralize timing windows, scoring, and difficulty tables.

## Visual quality

Use the `assets/mockups` images as references for layout density and monochrome tone. Do not copy them exactly.

The target aesthetic is closer to `chuds.dev`: black ink, manga panels, terminal microcopy, clean cards, and restrained halftone.
