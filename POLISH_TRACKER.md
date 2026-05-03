# Polish Tracker

> One change per iteration. The polish loop reads this, picks the highest-value `[ ]`, does it, marks `[x]`, commits.

## Gates (last verified: 2026-05-03T04:54:31-05:00)
- typecheck: __green__
- tests: __53 passing__
- lint: __0 errors__
- build: __14 pages__, largest client chunk __30.77 KB__
- ci: __green__ (`25275614247`)

## Visual fidelity
- [ ] Right-rail composition on homepage matching `assets/mockups/homepage.png` (profile + leaderboard + achievements stack)
- [ ] Match-stats strip at the bottom of `/play/[slug]` matching the mockups
- [ ] Replace gcard `_correct: true` mutated objects in templates.ts with structurally typed correct flag
- [x] Replace Synth Runner and Cursor Wars raw implementation placeholders with polished coming-soon game panels

## Accessibility
- [ ] Skip-to-content link in `ArcadeLayout.astro`
- [ ] Focus ring audit on `.btn`, `.gcard`, `.nav a`, `.pill`
- [ ] Confirm One Button Samurai keyboard and touch controls expose equivalent state changes

## States
- [ ] Loading skeleton for `/leaderboards` while the client island mounts
- [ ] Empty state for "no daily runs yet" on the homepage

## Mobile
- [ ] Header collapses below 480px (kana subtitle wraps cleanly)
- [ ] Captcha Dungeon 4x4 grid is touch-friendly under 360px
- [ ] One Button Samurai timing bar legible on phone

## Performance
- [ ] Total JS shipped per page documented in CHANGELOG; nothing >50 KB without justification
- [ ] Images: dimensions + `loading="lazy"` on non-hero

## Game polish — Captcha Dungeon
- [x] Restrict room 1 to difficulty-1 templates only (playtest finding)
- [x] Auto-timeout enforcement when room timer expires
- [x] Revisit Average archetype pacing after room-1 restriction; Average now reaches mini-boss in 32/50 runs

## Game polish — One Button Samurai
- [x] Re-run playtest matrix after the bot rebalance; commit numbers to PLAYTEST_NOTES.md
- [x] Tighten guard window to [651, 1100] if guard-dominance persists
- [x] Fix lead-in input so early holds cannot resolve as false danger losses
- [x] Stabilize resolved-round rendering so next-round clicks do not detach under browser play
- [ ] Add a noisy-human player model (release +/- 30ms jitter)
- [ ] Guard-at-1000 remains the highest static score strategy; consider score or bot-mix tuning after manual play

## Game prototype — Synth Runner
- [x] Seeded daily song + chart generator
- [x] Lane runner simulation, timing judgments, scoring, and tests
- [x] Monochrome canvas renderer with perspective grid, beat tiles, runner silhouette, waveform, and `NOW` cue
- [x] Keyboard/touch input and run submission
- [x] Headless browser playtest reaches `TRACK CLEAR` on guided run
- [ ] Add procedural audio metronome after visual timing is stable
- [ ] Add latency calibration before ranked tuning

## Game prototype — Cursor Wars
- [x] Deterministic Daily Bot Arena simulation with target-based physics, pixels, hazards, dash, trails, and bots
- [x] Scoring/tests for pickups, survival, combo, eliminations, and damage
- [x] Monochrome canvas renderer with OS/grid arena, cursor markers, trails, pixels, and hazards
- [x] Mouse/touch target steering, click/Space dash, and run submission
- [x] Headless browser steering smoke survives, collects pixels, and avoids horizontal overflow
- [ ] Add longer bot arena playtest matrix for damage/pickup tuning
- [ ] Add target reticle affordance and dash cooldown readout

## Browser playtest
- [x] Headless desktop/mobile smoke for all four `/play/[slug]` pages with no horizontal overflow at 360px
- [x] Headless Captcha Dungeon: completed 3 rooms from visible prompts; timer 18s -> 17s and auto-timeout to room 2 with 1 HP loss
- [x] Headless One Button Samurai: lead-in hold regression fixed; completed a 5-round keyboard match
- [x] Headless Synth Runner: guided `NOW` cue run reached track clear
- [x] Headless Cursor Wars: steering/dash smoke collected pixels and survived contact damage

## Worker hardening
- [ ] Regex-based origin allowlist for preview deploys
- [ ] Cache headers on `GET /api/leaderboards/...`

## Documentation
- [ ] Architecture diagram in `docs/ARCHITECTURE.md` upgraded to a real SVG

## Done log
- 11f502d · Captcha Dungeon opening-room and validation pacing polish; Samurai guard-window tightening; polished Synth Runner and Cursor Wars preview panels
- local · Captcha auto-timeout/countdown, mobile grid fit, Samurai lead-in and stable next-round browser fixes
- local · Synth Runner playable canvas prototype; Cursor Wars playable bot-arena prototype

## Blocked
(nothing yet)
