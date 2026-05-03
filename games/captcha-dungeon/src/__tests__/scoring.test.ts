import { describe, expect, it } from "vitest";
import { computeScore, validateSelection } from "../scoring";

describe("validateSelection", () => {
  it("flags perfect selection", () => {
    const v = validateSelection(["a", "b"], ["a", "b"]);
    expect(v.correct).toBe(true);
    expect(v.perfect).toBe(true);
    expect(v.mistakes).toBe(0);
    expect(v.missed).toBe(0);
  });
  it("accepts a two-error human pass without marking it perfect", () => {
    const v = validateSelection(["a", "x"], ["a", "b"]);
    expect(v.correct).toBe(true);
    expect(v.perfect).toBe(false);
    expect(v.mistakes).toBe(1);
    expect(v.missed).toBe(1);
  });
  it("accepts a one-error human pass without marking it perfect", () => {
    const v = validateSelection(["a"], ["a", "b"]);
    expect(v.correct).toBe(true);
    expect(v.perfect).toBe(false);
    expect(v.mistakes).toBe(0);
    expect(v.missed).toBe(1);
  });
  it("rejects larger errors", () => {
    const v = validateSelection(["x", "y"], ["a", "b"]);
    expect(v.correct).toBe(false);
    expect(v.mistakes).toBe(2);
    expect(v.missed).toBe(2);
  });
  it("allows callers to tune the error tolerance", () => {
    const picked = ["a", "x", "y"];
    const correct = ["a", "b", "c"];
    expect(validateSelection(picked, correct, 4).correct).toBe(true);
    expect(validateSelection(picked, correct, 3).correct).toBe(false);
  });
});

describe("computeScore", () => {
  it("rewards rooms, bosses, combo, and humanity", () => {
    const score = computeScore({
      roomsCleared: 10,
      bossesDefeated: 2,
      mistakes: 0,
      timeouts: 0,
      healthRemaining: 3,
      maxCombo: 7,
      relicsCollected: 0,
      cursesAccepted: 0,
      humanityScore: 600,
      totalTimeMs: 100_000,
    });
    // 10*500 + 2*1500 + 7*100 + 3*400 + 600 - 0 - 100000/50 = 9700
    expect(score).toBe(10 * 500 + 2 * 1500 + 7 * 100 + 3 * 400 + 600 - Math.floor(100_000 / 50));
  });
  it("penalises mistakes and time", () => {
    const a = computeScore({
      roomsCleared: 5,
      bossesDefeated: 0,
      mistakes: 0,
      timeouts: 0,
      healthRemaining: 3,
      maxCombo: 0,
      relicsCollected: 0,
      cursesAccepted: 0,
      humanityScore: 0,
      totalTimeMs: 0,
    });
    const b = computeScore({
      roomsCleared: 5,
      bossesDefeated: 0,
      mistakes: 4,
      timeouts: 0,
      healthRemaining: 3,
      maxCombo: 0,
      relicsCollected: 0,
      cursesAccepted: 0,
      humanityScore: 0,
      totalTimeMs: 60_000,
    });
    expect(b).toBeLessThan(a);
  });
});
