# Playtest notes

Findings from QA agents that simulate real player sessions. Each game keeps its own `playtest.test.ts` under `__tests__/` — those are the receipts. This doc is the human-readable summary of what they found and what we changed in response.

## Captcha Dungeon

### Findings (50–100 seeds, three player archetypes)

- **Difficulty curve** is monotonic after room-1 restriction (avg correct count goes 3.03 → 3.46 → 3.64 → … → 5.00 across rooms 1–10).
- **Opening room templates** are now restricted to difficulty-1 only (`select-living`, `select-skeletons`, `select-objects`).
- **Score range:** "Perfect" floor (10,000) never overlaps "Bad" ceiling (–2,920). Skill correctly dominates outcome.
- **Pre-rebalance:** "Average" archetype died on room 1 in 90% of 50 runs at HP=3. Zero runs reached the final boss.
- **Post-polish pacing:** "Average" archetype reaches the mini-boss in 32/50 runs, reaches the final boss in 6/50 runs, and wins 3/50 runs (median deepest room 5).
- **Combo:** Perfect always hits maxCombo=10. Average median 0, max 1.
- **Determinism** confirmed: 50 seeds reproduced bit-identical metrics across two executions.

### Bugs caught

| Severity | Bug | Fix |
|---|---|---|
| HIGH | `timeoutRoom()` on the final boss granted a false victory. | `game.ts` → if room is the final boss, `timeoutRoom` sets `status = "defeat"`. |
| MED | "Select all 16 tiles" only cost 1 HP despite ~12 mistakes. | Scoring still penalises mistakes via `-mistakes * 250`; HP stays at 1-loss-per-submission. Acceptable. |
| LOW | Zero-tile submission cost 1 HP and 0 mistakes. | Acceptable — still costs HP. |

### Tuning applied

- `STARTING_HEALTH: 3 → 5`. Average archetype now reaches 3–4 rooms before dying instead of dying on room 1.
- Room 1 now draws only difficulty-1 templates.
- Selection validation now accepts a small non-perfect human-pass tolerance: early rooms allow up to 3 tile errors, later regular rooms allow 2, and boss rooms allow 1. Decoy mistakes on accepted imperfect clears still count against metrics and score.
- Browser playtest: the room timer now counts down visibly and auto-times out into the next room, burning 1 HP.

### Open questions / future tuning

- Cap "select-all" exploit by capping mistake-only HP loss vs. full-mistake count.

## One Button Samurai

### Findings (5 strategies × 5 bots × 50 seeds)

Post-polish win rates (% per round, 5 strategies × 5 bots × 50 seeds):

| Strategy | Bamboo | Iron Monk | Red Crane | Drunk Ronin | Mirror Ghost |
|---|---:|---:|---:|---:|---:|
| Always feint (100ms) | 0 | 0 | 0 | 21.6 | 0 |
| Always strike at peak (380ms) | 0 | 15.6 | 0 | 28.4 | 17.2 |
| Always guard (1000ms) | 37.6 | 13.6 | 88.0 | 52.0 | 14.8 |
| Reactive | 36.4 | 28.4 | 86.4 | 68.8 | 64.4 |
| Hesitant (1500ms) | 0 | 0 | 0 | 0 | 0 |

Score distribution (100 seeds, 5 rounds each):

| Strategy | min | median | max |
|---|---:|---:|---:|
| hold-100 | –930 | –630 | 870 |
| hold-380 | –236 | –236 | 1,264 |
| hold-1000 | 490 | **2,090** | 5,290 |
| hold-1500 | –1,960 | –1,960 | –1,960 |

### Issues caught

| Severity | Issue | Fix |
|---|---|---|
| HIGH | Guard at 1000ms wins 100% vs Red Crane and dominates score (median 2,090 vs strike's 364). | Iron Monk now feints 15%; Red Crane mixes 12% guard; Mirror Ghost feints 15%. |
| HIGH | Strike-at-peak (380ms) had no opponents — only Drunk Ronin feinted. | Iron Monk and Mirror Ghost now feint occasionally. |
| MED | Red Crane was a free win for guarders. | 12% counter-guard added. |
| MED | Mirror Ghost never feinted. | 15% feint chance, otherwise still mirrors. |
| LOW | Drunk Ronin's 22% danger rate made him too easy. | Dropped to 10%. |
| LOW | Guard had a very wide safe tail through 1400ms. | Guard now ends at 1100ms; bot guard ranges were clamped to match. |

### Verified working

- Mirror Ghost adaptation: with player held at 380ms, late-round (rounds 6–10) median bot-hold = 336ms, target = 340. Adaptation works.
- Perfect-strike window is the closed interval [320, 440] (±60ms inclusive).
- Replay determinism: same seed + same timings produces byte-identical events.
- Nerve-break paths both fire (held past max, never-pressed past max).
- Browser playtest: holding Space during lead-in no longer resolves as a false danger loss; full 5-round keyboard match can advance via the next-round button.

### Open questions / future tuning

- Guard-at-1000 remains the strongest static score strategy; consider score tuning or bot mix changes if it still feels dominant in manual play.
- Add a noisy-human player model (release ± 30ms jitter) to validate that the tightening doesn't punish skilled players unfairly.
- Re-run the strategy matrix after the bot rebalance to confirm guard-dominance is actually broken.

## Re-running playtests

```bash
pnpm --filter @chuds/game-captcha-dungeon test
pnpm --filter @chuds/game-one-button-samurai test
pnpm --filter @chuds/game-synth-runner test
pnpm --filter @chuds/game-cursor-wars test
```

The playtest suites print histograms and matrices to stdout — copy them here when balance numbers change.

## Synth Runner

### Implemented prototype

- Deterministic daily song seed and chart generation.
- Three-lane runner simulation with jump, slide, shift, gap, and gem events.
- Timing judgments use the spec windows: Perfect ±45ms, Great ±90ms, Okay ±140ms.
- Canvas renderer uses a monochrome perspective grid, runner silhouette, beat tiles, waveform strip, and explicit `NOW` timing cue.
- Keyboard controls: A/Left, D/Right, Space/Up, Shift/Down. Touch buttons and swipe surface are wired through the same input path.

### Browser playtest

- Desktop and 360px mobile pages render nonblank canvas content with no horizontal overflow.
- Guided headless run using the visible `NOW` cue reached `TRACK CLEAR` with 28 combo, 100% accuracy, and score 3,733 on the current daily seed.

### Open questions / future tuning

- Add procedural Web Audio once the visual timing lane is stable.
- Add a latency calibration setting before ranked leaderboard tuning.

## Cursor Wars

### Implemented prototype

- Deterministic Daily Bot Arena simulation with target-based cursor physics, pixels, hazards, dash, trails, and three bot archetypes.
- Mouse/touch input sets a target; click/Space triggers dash.
- Canvas renderer uses a monochrome OS/grid arena with cursor markers, dotted trails, square pixels, and dashed hazards.

### Browser playtest

- Desktop and 360px mobile pages render nonblank canvas content with no horizontal overflow.
- Headless steering/dash smoke run survived several target changes, collected 1 pixel, and retained 4/5 health after contact damage.

### Open questions / future tuning

- Bot damage and pickup rates need a longer playtest matrix.
- Add explicit target reticle affordance and dash cooldown readout.
