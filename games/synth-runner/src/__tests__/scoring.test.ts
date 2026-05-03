import { describe, expect, it } from "vitest";
import { computeScore, judgeTiming } from "../scoring";

describe("Synth Runner scoring", () => {
  it("calibrates timing windows", () => {
    expect(judgeTiming(0)).toBe("perfect");
    expect(judgeTiming(45)).toBe("perfect");
    expect(judgeTiming(46)).toBe("great");
    expect(judgeTiming(90)).toBe("great");
    expect(judgeTiming(91)).toBe("okay");
    expect(judgeTiming(140)).toBe("okay");
    expect(judgeTiming(141)).toBe("miss");
  });

  it("rewards hits, gems, distance, and combo while penalising misses", () => {
    const base = computeScore({
      bpm: 120,
      distanceMeters: 100,
      perfects: 2,
      greats: 1,
      okays: 1,
      misses: 0,
      maxCombo: 4,
      gems: 2,
      accuracyPercent: 100,
      latencyOffsetMs: 0,
    });
    const sloppy = computeScore({
      bpm: 120,
      distanceMeters: 100,
      perfects: 2,
      greats: 1,
      okays: 1,
      misses: 3,
      maxCombo: 4,
      gems: 2,
      accuracyPercent: 57,
      latencyOffsetMs: 0,
    });
    expect(base).toBeGreaterThan(sloppy);
  });
});
