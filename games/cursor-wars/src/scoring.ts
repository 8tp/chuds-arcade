import { SCORING } from "./constants";
import type { CursorMetrics } from "./types";

export function computeScore(m: CursorMetrics): number {
  return (
    m.pixelsCollected * SCORING.pixel +
    m.botEliminations * SCORING.botElimination +
    Math.floor(m.survivalMs / SCORING.survivalDivisor) +
    m.maxCombo * SCORING.maxCombo -
    m.damageTaken * SCORING.damageTaken
  );
}
