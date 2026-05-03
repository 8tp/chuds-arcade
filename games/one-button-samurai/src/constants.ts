// Timing windows from press → release (ms). These are baseline; bot
// archetypes apply small modifiers but the truth table is fixed.

export const TIMING = {
  feintMaxMs: 140,
  strikeMaxMs: 650,
  guardMaxMs: 1400,
  // Anything past guardMax is danger / nerve break.
} as const;

export const BOT_LADDER = [
  "bamboo-rookie",
  "iron-monk",
  "red-crane",
  "drunk-ronin",
  "mirror-ghost",
] as const;

export const ROUNDS_PER_MATCH = 5;
export const ROUND_LEAD_IN_MS = 800;
export const ROUND_MAX_MS = 2_400;

export const SCORING = {
  perWin: 1000,
  perPerfectStrike: 300,
  perCounter: 250,
  perCleanRound: 200,
  perFalseDraw: 150,
  perNerveBreak: 300,
  timeDivisor: 25,
} as const;
