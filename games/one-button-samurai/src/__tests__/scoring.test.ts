import { describe, expect, it } from "vitest";
import { computeScore, metricsFromLog } from "../scoring";
import type { RoundLog } from "../types";

const winRound = (round: number): RoundLog => ({
  round,
  bot: "bamboo-rookie",
  playerHoldMs: 380,
  botHoldMs: 80,
  clash: {
    player: "strike",
    bot: "feint",
    outcome: "win",
    perfectStrike: true,
    counter: false,
    falseDraw: false,
    nerveBreak: false,
  },
});
const lossRound = (round: number): RoundLog => ({
  round,
  bot: "iron-monk",
  playerHoldMs: 400,
  botHoldMs: 1000,
  clash: {
    player: "strike",
    bot: "guard",
    outcome: "loss",
    perfectStrike: false,
    counter: false,
    falseDraw: false,
    nerveBreak: false,
  },
});

describe("metricsFromLog", () => {
  it("counts wins, losses, perfect strikes, average release", () => {
    const log = [winRound(1), winRound(2), lossRound(3)];
    const m = metricsFromLog(log, 12_000);
    expect(m.wins).toBe(2);
    expect(m.losses).toBe(1);
    expect(m.perfectStrikes).toBe(2);
    expect(m.cleanRounds).toBe(2);
    expect(m.averageReleaseMs).toBe(Math.round((380 + 380 + 400) / 3));
    expect(m.totalTimeMs).toBe(12_000);
  });
});

describe("computeScore", () => {
  it("rewards wins and perfect strikes, penalises false draws and time", () => {
    const score = computeScore({
      wins: 3,
      losses: 1,
      perfectStrikes: 2,
      counters: 1,
      feints: 0,
      falseDraws: 0,
      nerveBreaks: 0,
      cleanRounds: 3,
      averageReleaseMs: 400,
      totalTimeMs: 25_000,
    });
    // 3*1000 + 2*300 + 1*250 + 3*200 - 0 - 0 - floor(25000/25)
    expect(score).toBe(3 * 1000 + 2 * 300 + 1 * 250 + 3 * 200 - Math.floor(25_000 / 25));
  });
});
