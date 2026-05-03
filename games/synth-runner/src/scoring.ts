import { HIT_WINDOWS_MS, SCORING } from "./constants";
import type { Judgment, SynthMetrics } from "./types";

export function judgeTiming(deltaMs: number): Judgment {
  const abs = Math.abs(deltaMs);
  if (abs <= HIT_WINDOWS_MS.perfect) return "perfect";
  if (abs <= HIT_WINDOWS_MS.great) return "great";
  if (abs <= HIT_WINDOWS_MS.okay) return "okay";
  return "miss";
}

export function computeScore(m: SynthMetrics): number {
  const base =
    m.perfects * SCORING.perfect +
    m.greats * SCORING.great +
    m.okays * SCORING.okay +
    m.gems * SCORING.gem +
    m.maxCombo * SCORING.maxCombo +
    m.distanceMeters -
    m.misses * SCORING.miss;
  const multiplier = m.maxCombo >= 100 ? 2 : m.maxCombo >= 50 ? 1.5 : m.maxCombo >= 25 ? 1.25 : 1;
  return Math.round(base * multiplier);
}
