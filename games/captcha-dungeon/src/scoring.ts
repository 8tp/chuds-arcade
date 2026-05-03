import { SCORING } from "./constants";
import type { RunMetrics } from "./types";

export function computeScore(m: RunMetrics): number {
  return (
    m.roomsCleared * SCORING.perRoomCleared +
    m.bossesDefeated * SCORING.perBossDefeated +
    m.maxCombo * SCORING.perCombo +
    m.healthRemaining * SCORING.perHealthRemaining +
    m.humanityScore -
    m.mistakes * SCORING.perMistake -
    Math.floor(m.totalTimeMs / SCORING.timeDivisor)
  );
}

export type Validation = {
  correct: boolean;
  perfect: boolean;
  mistakes: number;
  missed: number;
};

export function validateSelection(picked: string[], correctIds: string[]): Validation {
  const expect = new Set(correctIds);
  const got = new Set(picked);
  let mistakes = 0;
  for (const id of got) if (!expect.has(id)) mistakes += 1;
  let missed = 0;
  for (const id of expect) if (!got.has(id)) missed += 1;
  const correct = mistakes === 0 && missed === 0;
  return { correct, perfect: correct, mistakes, missed };
}
