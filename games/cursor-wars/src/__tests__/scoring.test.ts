import { describe, expect, it } from "vitest";
import { computeScore } from "../scoring";

describe("Cursor Wars scoring", () => {
  it("rewards pickups, survival, combo, and eliminations", () => {
    const score = computeScore({
      pixelsCollected: 10,
      botEliminations: 1,
      survivalMs: 10_000,
      maxCombo: 4,
      damageTaken: 0,
    });
    expect(score).toBe(10 * 5 + 200 + 100 + 4 * 50);
  });

  it("penalises damage", () => {
    const clean = computeScore({
      pixelsCollected: 10,
      botEliminations: 0,
      survivalMs: 10_000,
      maxCombo: 4,
      damageTaken: 0,
    });
    const damaged = computeScore({
      pixelsCollected: 10,
      botEliminations: 0,
      survivalMs: 10_000,
      maxCombo: 4,
      damageTaken: 2,
    });
    expect(damaged).toBeLessThan(clean);
  });
});
