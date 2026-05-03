# Playtest notes

Findings from QA agents that simulate real player sessions. Each game keeps its own `playtest.test.ts` under `__tests__/` — those are the receipts. This doc is the human-readable summary of what they found and what we changed in response.

## Captcha Dungeon

### Findings (50–100 seeds, three player archetypes)

- **Difficulty curve** is monotonic but room 1 is the steepest jump (avg correct count goes 2.96 → 3.46 → 3.64 → … → 5.00 across rooms 1–10).
- **Score range:** "Perfect" floor (10,000) never overlaps "Bad" ceiling (–2,920). Skill correctly dominates outcome.
- **Pre-rebalance:** "Average" archetype died on room 1 in 90% of 50 runs at HP=3. Zero runs reached the final boss.
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

### Open questions / future tuning

- Restrict room 1 to difficulty-1 templates only (currently allows up to difficulty-2).
- Cap "select-all" exploit by capping mistake-only HP loss vs. full-mistake count.

## One Button Samurai

### Findings (5 strategies × 5 bots × 50 seeds)

Pre-rebalance win rates (% per round):

| Strategy | Bamboo | Iron Monk | Red Crane | Drunk Ronin | Mirror Ghost |
|---|---:|---:|---:|---:|---:|
| Always feint (100ms) | 0 | 0 | 0 | 21.6 | 0 |
| Always strike at peak (380ms) | 0 | 0 | 0 | 36.4 | 0 |
| Always guard (1000ms) | 37.6 | 20.0 | **100.0** | 60.4 | 20.0 |
| Reactive | 36.4 | 24.4 | **100.0** | 73.2 | 50.0 |
| Hesitant (1500ms) | 0 | 0 | 0 | 0 | 0 |

Score distribution (100 seeds, 5 rounds each):

| Strategy | min | median | max |
|---|---:|---:|---:|
| hold-100 | –780 | –480 | 1,020 |
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

### Verified working

- Mirror Ghost adaptation: with player held at 380ms, late-round (rounds 6–10) median bot-hold = 336ms, target = 340. Adaptation works.
- Perfect-strike window is the closed interval [320, 440] (±60ms inclusive).
- Replay determinism: same seed + same timings produces byte-identical events.
- Nerve-break paths both fire (held past max, never-pressed past max).

### Open questions / future tuning

- Tighten guard window from `[651, 1400]` to `[651, 1100]` so 1000ms isn't the safest hit-zone.
- Add a noisy-human player model (release ± 30ms jitter) to validate that the tightening doesn't punish skilled players unfairly.
- Re-run the strategy matrix after the bot rebalance to confirm guard-dominance is actually broken.

## Re-running playtests

```bash
pnpm --filter @chuds/game-captcha-dungeon test
pnpm --filter @chuds/game-one-button-samurai test
```

The playtest suites print histograms and matrices to stdout — copy them here when balance numbers change.
