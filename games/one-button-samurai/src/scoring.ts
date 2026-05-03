import { SCORING } from "./constants";
import type { RoundLog, SamuraiMetrics } from "./types";

export function metricsFromLog(log: RoundLog[], totalTimeMs: number): SamuraiMetrics {
  let wins = 0;
  let losses = 0;
  let perfectStrikes = 0;
  let counters = 0;
  let feints = 0;
  let falseDraws = 0;
  let nerveBreaks = 0;
  let cleanRounds = 0;
  let holdSum = 0;
  let holdCount = 0;
  for (const r of log) {
    if (r.clash.outcome === "win") wins += 1;
    else if (r.clash.outcome === "loss") losses += 1;
    if (r.clash.perfectStrike) perfectStrikes += 1;
    if (r.clash.counter) counters += 1;
    if (r.clash.player === "feint") feints += 1;
    if (r.clash.falseDraw) falseDraws += 1;
    if (r.clash.nerveBreak) nerveBreaks += 1;
    if (r.clash.outcome === "win" && !r.clash.falseDraw && !r.clash.nerveBreak) cleanRounds += 1;
    if (r.playerHoldMs !== null) {
      holdSum += r.playerHoldMs;
      holdCount += 1;
    }
  }
  return {
    wins,
    losses,
    perfectStrikes,
    counters,
    feints,
    falseDraws,
    nerveBreaks,
    cleanRounds,
    averageReleaseMs: holdCount > 0 ? Math.round(holdSum / holdCount) : 0,
    totalTimeMs,
  };
}

export function computeScore(m: SamuraiMetrics): number {
  return (
    m.wins * SCORING.perWin +
    m.perfectStrikes * SCORING.perPerfectStrike +
    m.counters * SCORING.perCounter +
    m.cleanRounds * SCORING.perCleanRound -
    m.falseDraws * SCORING.perFalseDraw -
    m.nerveBreaks * SCORING.perNerveBreak -
    Math.floor(m.totalTimeMs / SCORING.timeDivisor)
  );
}
