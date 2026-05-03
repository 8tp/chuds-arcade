# Polish Tracker

> One change per iteration. The polish loop reads this, picks the highest-value `[ ]`, does it, marks `[x]`, commits.

## Gates (last verified: 2026-05-03T04:36:51-05:00)
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
- [ ] Auto-timeout enforcement when room timer expires (currently skip-only)
- [x] Revisit Average archetype pacing after room-1 restriction; Average now reaches mini-boss in 32/50 runs

## Game polish — One Button Samurai
- [x] Re-run playtest matrix after the bot rebalance; commit numbers to PLAYTEST_NOTES.md
- [x] Tighten guard window to [651, 1100] if guard-dominance persists
- [ ] Add a noisy-human player model (release +/- 30ms jitter)
- [ ] Guard-at-1000 remains the highest static score strategy; consider score or bot-mix tuning after manual play

## Worker hardening
- [ ] Regex-based origin allowlist for preview deploys
- [ ] Cache headers on `GET /api/leaderboards/...`

## Documentation
- [ ] Architecture diagram in `docs/ARCHITECTURE.md` upgraded to a real SVG

## Done log
- 11f502d · Captcha Dungeon opening-room and validation pacing polish; Samurai guard-window tightening; polished Synth Runner and Cursor Wars preview panels

## Blocked
(nothing yet)
