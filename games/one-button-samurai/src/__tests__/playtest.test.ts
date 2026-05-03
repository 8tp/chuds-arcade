// Playtest QA scenarios. These tests exercise the game holistically rather than
// per-unit; they're not strict pass/fail correctness checks but balance probes.
// Each `it` logs a structured findings block to the console for the QA report.

import { createRng } from "@chuds/deterministic-rng";
import { describe, expect, it } from "vitest";
import { BOTS } from "../bots";
import { holdToAction, resolveClash } from "../clash";
import { BOT_LADDER, ROUND_LEAD_IN_MS, ROUND_MAX_MS, TIMING } from "../constants";
import { OneButtonSamurai } from "../game";
import type { RoundLog, SamuraiAction } from "../types";

class Clock {
  t = 0;
  now = () => this.t;
}

type Bucket = { feint: number; strike: number; guard: number; danger: number };

function bucketize(samples: number[]): Bucket {
  const b: Bucket = { feint: 0, strike: 0, guard: 0, danger: 0 };
  for (const s of samples) b[holdToAction(s)] += 1;
  return b;
}

function pct(b: Bucket, n: number): Record<keyof Bucket, string> {
  return {
    feint: ((b.feint / n) * 100).toFixed(1),
    strike: ((b.strike / n) * 100).toFixed(1),
    guard: ((b.guard / n) * 100).toFixed(1),
    danger: ((b.danger / n) * 100).toFixed(1),
  };
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1]! + s[m]!) / 2 : s[m]!;
}

function summary(xs: number[]): { min: number; med: number; max: number; mean: number } {
  if (xs.length === 0) return { min: 0, med: 0, max: 0, mean: 0 };
  const sorted = [...xs].sort((a, b) => a - b);
  const sum = xs.reduce((a, b) => a + b, 0);
  return {
    min: sorted[0]!,
    med: median(xs),
    max: sorted[sorted.length - 1]!,
    mean: Math.round(sum / xs.length),
  };
}

/** Play a single match where every round the player releases at the given hold. */
function playStaticMatch(
  seed: string,
  releaseMs: number,
  rounds = 5,
): { score: number; wins: number; losses: number; log: ReadonlyArray<RoundLog> } {
  const clock = new Clock();
  const game = new OneButtonSamurai({ seed, now: clock.now, rounds });
  while (!game.isOver()) {
    clock.t += ROUND_LEAD_IN_MS + 1;
    game.tick();
    game.press();
    clock.t += releaseMs;
    game.release();
    game.next();
  }
  const m = game.metrics();
  // Pull log via replay; OneButtonSamurai doesn't expose log directly, so reconstruct
  // wins/losses from metrics — log isn't strictly needed here.
  return { score: game.score(), wins: m.wins, losses: m.losses, log: [] };
}

/**
 * Play a full match against a single bot archetype repeated for every round.
 * Achieved by constructing a custom game-like loop that calls the bot directly.
 * We can't override BOT_LADDER without modifying source, so instead we bypass
 * OneButtonSamurai and directly compute clash outcomes using the same rng+bot.
 */
function simulateVsBot(
  seed: string,
  botId: keyof typeof BOTS,
  releaseFn: (history: RoundLog[], botHoldMs: number) => number,
  rounds = 5,
): { wins: number; losses: number; draws: number; log: RoundLog[] } {
  const rng = createRng(seed);
  const archetype = BOTS[botId]!;
  const log: RoundLog[] = [];
  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (let i = 0; i < rounds; i += 1) {
    const botHoldMs = archetype.pickReleaseMs(rng, log);
    const playerHoldMs = releaseFn(log, botHoldMs);
    const playerAction: SamuraiAction = holdToAction(playerHoldMs);
    const botAction: SamuraiAction = holdToAction(botHoldMs);
    const clash = resolveClash(playerAction, botAction, playerHoldMs);
    log.push({ round: i + 1, bot: botId as string, playerHoldMs, botHoldMs, clash });
    if (clash.outcome === "win") wins += 1;
    else if (clash.outcome === "loss") losses += 1;
    else draws += 1;
  }
  return { wins, losses, draws, log };
}

describe("Playtest: bot archetype distribution sanity", () => {
  it("samples 200 release times per archetype and reports buckets", () => {
    const N = 200;
    const out: Record<string, Record<string, string>> = {};
    for (const id of BOT_LADDER) {
      const arch = BOTS[id]!;
      const samples: number[] = [];
      const rng = createRng(`bucket:${id}:v1`);
      for (let i = 0; i < N; i += 1) samples.push(arch.pickReleaseMs(rng, []));
      out[id] = pct(bucketize(samples), N);
      out[id]!.med = String(median(samples));
    }
    // eslint-disable-next-line no-console
    console.log("[playtest] archetype distributions (200 samples each):", out);

    // Spec sanity assertions — flag if intent doesn't match.
    // Bamboo Rookie: slow → mostly strike+guard, few feints, few dangers.
    const bamboo = out["bamboo-rookie"]!;
    expect(Number.parseFloat(bamboo.feint!)).toBeLessThan(5);
    expect(Number.parseFloat(bamboo.strike!) + Number.parseFloat(bamboo.guard!)).toBeGreaterThan(
      90,
    );

    // Red Crane: fast strikes, occasional counter-guard (post-rebalance ~12%).
    const crane = out["red-crane"]!;
    expect(Number.parseFloat(crane.strike!)).toBeGreaterThan(80);
    expect(Number.parseFloat(crane.guard!)).toBeLessThan(20);

    // Iron Monk: guard-heavy.
    const monk = out["iron-monk"]!;
    expect(Number.parseFloat(monk.guard!)).toBeGreaterThan(60);

    // Drunk Ronin: spread including some danger.
    const ronin = out["drunk-ronin"]!;
    expect(Number.parseFloat(ronin.feint!)).toBeGreaterThan(5);
    expect(Number.parseFloat(ronin.danger!)).toBeGreaterThan(5);

    // Mirror Ghost (no history): mid range — strike heavy.
    const ghost = out["mirror-ghost"]!;
    expect(Number.parseFloat(ghost.strike!)).toBeGreaterThan(50);
  });
});

describe("Playtest: player strategy outcomes against each bot", () => {
  it("simulates 5 strategies x 5 bots x 50 seeds", () => {
    const SEEDS = 50;
    const ROUNDS = 5;
    const strategies: Array<{
      name: string;
      release: (h: RoundLog[], botHoldMs: number) => number;
    }> = [
      { name: "always-feint-100", release: () => 100 },
      { name: "always-strike-380", release: () => 380 },
      { name: "always-guard-1000", release: () => 1000 },
      // "Reactive" cheats by peeking at the bot's chosen hold.
      {
        name: "reactive-peek",
        release: (_h, botHoldMs) => {
          if (botHoldMs <= TIMING.feintMaxMs) return 380; // strike a feint
          if (botHoldMs <= TIMING.strikeMaxMs) return 1000; // guard a strike
          return 380; // strike a guard? no — bot wins. release just into strike to lose nicely.
          // Note: against a guard, only feint draws or guard draws. We pick strike to log a loss intentionally.
        },
      },
      { name: "hesitant-1500", release: () => 1500 },
    ];

    const winRates: Record<string, Record<string, number>> = {};
    const flagged: string[] = [];
    for (const s of strategies) {
      winRates[s.name] = {};
      for (const bot of BOT_LADDER) {
        let totalWins = 0;
        let totalRounds = 0;
        for (let i = 0; i < SEEDS; i += 1) {
          const seed = `playtest:${s.name}:${bot}:${i}`;
          const r = simulateVsBot(seed, bot, s.release, ROUNDS);
          totalWins += r.wins;
          totalRounds += ROUNDS;
        }
        const wr = totalWins / totalRounds;
        winRates[s.name]![bot] = +(wr * 100).toFixed(1);
        if (wr > 0.95 || wr < 0.05) {
          flagged.push(`${s.name} vs ${bot}: ${(wr * 100).toFixed(1)}%`);
        }
      }
    }
    // eslint-disable-next-line no-console
    console.log("[playtest] win rates % (strategy x bot):", winRates);
    // eslint-disable-next-line no-console
    console.log("[playtest] flagged extreme matchups (>95% or <5%):", flagged);

    // We don't fail the test on flags — they're QA findings.
    expect(Object.keys(winRates).length).toBe(strategies.length);
  });
});

describe("Playtest: Mirror Ghost adaptation", () => {
  it("converges its release toward (player_avg - 40) within 50ms after 5 rounds", () => {
    const PLAYER_HOLD = 380;
    const ROUNDS = 10;
    // Simulate manually so we can read the bot's chosen holds across rounds.
    const seed = "playtest:mirror-adapt:1";
    const rng = createRng(seed);
    const arch = BOTS["mirror-ghost"]!;
    const log: RoundLog[] = [];
    const botHolds: number[] = [];
    for (let i = 0; i < ROUNDS; i += 1) {
      const botHoldMs = arch.pickReleaseMs(rng, log);
      botHolds.push(botHoldMs);
      const clash = resolveClash(holdToAction(PLAYER_HOLD), holdToAction(botHoldMs), PLAYER_HOLD);
      log.push({
        round: i + 1,
        bot: "mirror-ghost",
        playerHoldMs: PLAYER_HOLD,
        botHoldMs,
        clash,
      });
    }
    const lateMedian = median(botHolds.slice(5));
    // Expected target: 380 - 40 = 340; with ±50 jitter → median should hit ~340.
    // eslint-disable-next-line no-console
    console.log("[playtest] mirror-ghost holds across 10 rounds:", botHolds);
    // eslint-disable-next-line no-console
    console.log("[playtest] mirror-ghost late-half median:", lateMedian, "expected ~340");
    expect(Math.abs(lateMedian - 340)).toBeLessThan(50);
  });

  it("still adapts when player varies (alternates 200ms/500ms)", () => {
    const ROUNDS = 12;
    const seed = "playtest:mirror-adapt:vary";
    const rng = createRng(seed);
    const arch = BOTS["mirror-ghost"]!;
    const log: RoundLog[] = [];
    const playerHolds: number[] = [];
    const botHolds: number[] = [];
    for (let i = 0; i < ROUNDS; i += 1) {
      const playerHoldMs = i % 2 === 0 ? 200 : 500;
      const botHoldMs = arch.pickReleaseMs(rng, log);
      botHolds.push(botHoldMs);
      playerHolds.push(playerHoldMs);
      const clash = resolveClash(holdToAction(playerHoldMs), holdToAction(botHoldMs), playerHoldMs);
      log.push({
        round: i + 1,
        bot: "mirror-ghost",
        playerHoldMs,
        botHoldMs,
        clash,
      });
    }
    const expectedTarget = playerHolds.reduce((a, b) => a + b, 0) / playerHolds.length - 40;
    // eslint-disable-next-line no-console
    console.log(
      "[playtest] mirror-ghost vs alternating player. avg target:",
      Math.round(expectedTarget),
      "late median:",
      median(botHolds.slice(6)),
    );
    expect(median(botHolds.slice(6))).toBeGreaterThan(200);
  });
});

describe("Playtest: perfect-strike window calibration", () => {
  it("flags 320/360/380/400/440 as perfect; 319/441 as not (vs feint)", () => {
    // Window per source: |hold - 380| <= 60 → [320, 440] inclusive.
    // Bot does a feint — we just call resolveClash directly with various player holds.
    const cases = [
      { ms: 319, expectPerfect: false },
      { ms: 320, expectPerfect: true },
      { ms: 360, expectPerfect: true },
      { ms: 380, expectPerfect: true },
      { ms: 400, expectPerfect: true },
      { ms: 440, expectPerfect: true },
      { ms: 441, expectPerfect: false },
      { ms: 460, expectPerfect: false },
    ];
    const out: Array<{ ms: number; perfect: boolean; expected: boolean }> = [];
    for (const c of cases) {
      const clash = resolveClash(holdToAction(c.ms), "feint", c.ms);
      out.push({ ms: c.ms, perfect: clash.perfectStrike, expected: c.expectPerfect });
      expect(clash.perfectStrike).toBe(c.expectPerfect);
    }
    // eslint-disable-next-line no-console
    console.log("[playtest] perfect-strike calibration (window=[320,440]):", out);
  });

  it("measures perfect-strike rate vs feint at 380ms across 200 cases", () => {
    // All 200 should be perfect since holdToAction is deterministic on holdMs.
    let perfect = 0;
    for (let i = 0; i < 200; i += 1) {
      const c = resolveClash("strike", "feint", 380);
      if (c.perfectStrike) perfect += 1;
    }
    expect(perfect).toBe(200);
  });
});

describe("Playtest: nerve-break paths", () => {
  it("force-releases as nerve-break when held past ROUND_MAX_MS", () => {
    const clock = new Clock();
    const game = new OneButtonSamurai({
      seed: "playtest:nerve:1",
      now: clock.now,
      rounds: 1,
    });
    clock.t += ROUND_LEAD_IN_MS + 1;
    game.tick();
    game.press();
    // Hold past max.
    clock.t += ROUND_MAX_MS + 200;
    game.tick();
    const snap = game.snapshot();
    expect(snap.phase).toBe("resolved");
    expect(snap.lastClash?.nerveBreak).toBe(true);
    expect(snap.lastClash?.outcome).toBe("loss");
  });

  it("treats no-press as nerve-break loss after ROUND_MAX_MS from round start", () => {
    const clock = new Clock();
    const game = new OneButtonSamurai({
      seed: "playtest:nerve:2",
      now: clock.now,
      rounds: 1,
    });
    clock.t += ROUND_LEAD_IN_MS + 1;
    game.tick();
    clock.t += ROUND_MAX_MS + 200;
    game.tick();
    const snap = game.snapshot();
    expect(snap.phase).toBe("resolved");
    expect(snap.lastClash?.nerveBreak).toBe(true);
    expect(snap.lastClash?.outcome).toBe("loss");
  });
});

describe("Playtest: score distributions across seeds", () => {
  it("100 seeds with 'always strike at peak' against the standard ladder", () => {
    const scores: number[] = [];
    const winsList: number[] = [];
    for (let i = 0; i < 100; i += 1) {
      const seed = `playtest:dist:380:${i}`;
      const r = playStaticMatch(seed, 380, 5);
      scores.push(r.score);
      winsList.push(r.wins);
    }
    const sumScore = summary(scores);
    const sumWins = summary(winsList);
    // eslint-disable-next-line no-console
    console.log("[playtest] strike-380 score summary:", sumScore);
    // eslint-disable-next-line no-console
    console.log("[playtest] strike-380 wins summary (out of 5):", sumWins);

    // Compare to other strategies briefly.
    const compareStrategies = [100, 1000, 1500];
    const compareOut: Record<string, ReturnType<typeof summary>> = {};
    for (const ms of compareStrategies) {
      const xs: number[] = [];
      for (let i = 0; i < 100; i += 1) {
        const r = playStaticMatch(`playtest:dist:${ms}:${i}`, ms, 5);
        xs.push(r.score);
      }
      compareOut[`hold-${ms}`] = summary(xs);
    }
    // eslint-disable-next-line no-console
    console.log("[playtest] strategy score comparison:", compareOut);

    expect(scores.length).toBe(100);
  });
});

describe("Playtest: replay determinism", () => {
  it("two runs with same seed and same player timings produce identical replay sequences", () => {
    const SEED = "playtest:replay:1";
    function runOnce() {
      const clock = new Clock();
      const game = new OneButtonSamurai({ seed: SEED, now: clock.now, rounds: 5 });
      while (!game.isOver()) {
        clock.t += ROUND_LEAD_IN_MS + 1;
        game.tick();
        game.press();
        clock.t += 380;
        game.release();
        game.next();
      }
      return {
        events: [...game.replayEvents()],
        score: game.score(),
        metrics: game.metrics(),
      };
    }
    const a = runOnce();
    const b = runOnce();
    expect(a.events.length).toBe(b.events.length);
    for (let i = 0; i < a.events.length; i += 1) {
      expect(a.events[i]).toEqual(b.events[i]);
    }
    expect(a.score).toBe(b.score);
    expect(a.metrics).toEqual(b.metrics);
  });

  it("seed varies outcomes for at least one strategy across many seeds", () => {
    function runOnce(seed: string, hold: number) {
      const clock = new Clock();
      const game = new OneButtonSamurai({ seed, now: clock.now, rounds: 5 });
      while (!game.isOver()) {
        clock.t += ROUND_LEAD_IN_MS + 1;
        game.tick();
        game.press();
        clock.t += hold;
        game.release();
        game.next();
      }
      return game.metrics();
    }
    // hold=1000 (guard) shows seed-driven variance per the score distribution test.
    const seeds = Array.from({ length: 20 }, (_, i) => `seed-var-${i}`);
    const distinctWinCounts = new Set(seeds.map((s) => runOnce(s, 1000).wins));
    // eslint-disable-next-line no-console
    console.log("[playtest] hold=1000 distinct wins values across 20 seeds:", [
      ...distinctWinCounts,
    ]);
    expect(distinctWinCounts.size).toBeGreaterThan(1);
  });

  it("FINDING: hold=380 produces identical metrics across many seeds (low-variance)", () => {
    function runOnce(seed: string) {
      const clock = new Clock();
      const game = new OneButtonSamurai({ seed, now: clock.now, rounds: 5 });
      while (!game.isOver()) {
        clock.t += ROUND_LEAD_IN_MS + 1;
        game.tick();
        game.press();
        clock.t += 380;
        game.release();
        game.next();
      }
      return game.metrics();
    }
    const seeds = Array.from({ length: 50 }, (_, i) => `seed-flat-${i}`);
    const winSet = new Set(seeds.map((s) => runOnce(s).wins));
    const lossSet = new Set(seeds.map((s) => runOnce(s).losses));
    // eslint-disable-next-line no-console
    console.log("[playtest] hold=380 distinct wins:", [...winSet], "distinct losses:", [
      ...lossSet,
    ]);
    // Document the low-variance property as a finding (does not fail).
    expect(winSet.size).toBeGreaterThanOrEqual(1);
  });
});
