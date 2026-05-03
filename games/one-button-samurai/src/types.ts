export type SamuraiAction = "feint" | "strike" | "guard" | "danger";
export type RoundOutcome = "win" | "loss" | "draw";

export type Clash = {
  player: SamuraiAction;
  bot: SamuraiAction;
  outcome: RoundOutcome;
  perfectStrike: boolean;
  counter: boolean;
  falseDraw: boolean;
  nerveBreak: boolean;
};

export type RoundLog = {
  round: number;
  bot: string;
  playerHoldMs: number | null;
  botHoldMs: number;
  clash: Clash;
};

export type SamuraiMetrics = {
  wins: number;
  losses: number;
  perfectStrikes: number;
  counters: number;
  feints: number;
  falseDraws: number;
  nerveBreaks: number;
  cleanRounds: number;
  averageReleaseMs: number;
  totalTimeMs: number;
};

export type SamuraiReplayEvent =
  | { t: number; type: "round_start"; round: number; opponent: string }
  | { t: number; type: "press" }
  | { t: number; type: "release" }
  | { t: number; type: "round_end"; outcome: RoundOutcome };
