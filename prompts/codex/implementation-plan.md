# Codex Implementation Plan

Use this repo as a blueprint. Do not ask for design clarification unless blocked. Build in small commits.

## Commit 1

Set up monorepo dependencies and get `pnpm build` / `pnpm typecheck` working.

## Commit 2

Implement design system components in `apps/web`:

- `Panel`
- `Button`
- `GameCard`
- `IssueBadge`
- `StatBlock`
- `LeaderboardList`

## Commit 3

Implement local guest profile:

- create random guest id
- generate handle
- store in localStorage
- render in profile card

## Commit 4

Implement daily challenge helpers:

- seed generation
- daily date handling
- game manifest loading

## Commit 5

Implement Captcha Dungeon MVP.

## Commit 6

Implement One Button Samurai MVP.

## Commit 7

Implement Synth Runner MVP.

## Commit 8

Implement Cursor Wars Daily Bot Arena.
