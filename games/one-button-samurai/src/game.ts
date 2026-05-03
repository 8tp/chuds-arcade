// Pure orchestrator. The game module ticks rounds: lead-in, accept input,
// resolve, advance. The renderer reads a snapshot.

import { createRng } from "@chuds/deterministic-rng";
import { BOTS } from "./bots";
import { holdToAction, resolveClash } from "./clash";
import { ROUNDS_PER_MATCH, ROUND_LEAD_IN_MS, ROUND_MAX_MS } from "./constants";
import { BOT_LADDER } from "./constants";
import { computeScore, metricsFromLog } from "./scoring";
import type { RoundLog, SamuraiAction, SamuraiMetrics, SamuraiReplayEvent } from "./types";

export type GamePhase = "lead-in" | "active" | "resolved" | "match-over";

export type GameSnapshot = {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  bot: { id: string; label: string };
  /** ms from round start; -1 before press */
  pressedAtMs: number;
  /** ms from press; -1 if not pressed yet or already released */
  currentHoldMs: number;
  lastClash: RoundLog["clash"] | null;
  metrics: SamuraiMetrics;
  score: number;
};

export type GameOptions = {
  seed: string;
  rounds?: number;
  now?: () => number;
};

export class OneButtonSamurai {
  private readonly rng: () => number;
  private readonly now: () => number;
  private readonly totalRounds: number;
  private readonly startedAt: number;
  private endedAt: number | null = null;

  private roundIndex = 0;
  private roundStartAt = 0;
  private pressedAt: number | null = null;
  private released = false;
  private phase: GamePhase = "lead-in";
  private currentBot: (typeof BOT_LADDER)[number] = BOT_LADDER[0]!;
  private botHoldMs = 0;
  private lastClash: RoundLog["clash"] | null = null;
  private log: RoundLog[] = [];
  private replay: SamuraiReplayEvent[] = [];

  constructor(opts: GameOptions) {
    this.rng = createRng(opts.seed);
    this.now = opts.now ?? (() => Date.now());
    this.totalRounds = opts.rounds ?? ROUNDS_PER_MATCH;
    this.startedAt = this.now();
    this.beginRound();
  }

  private beginRound(): void {
    this.currentBot = BOT_LADDER[this.roundIndex % BOT_LADDER.length]!;
    const archetype = BOTS[this.currentBot]!;
    this.botHoldMs = archetype.pickReleaseMs(this.rng, this.log);
    this.phase = "lead-in";
    this.pressedAt = null;
    this.released = false;
    this.roundStartAt = this.now() + ROUND_LEAD_IN_MS;
    this.replay.push({
      t: this.now() - this.startedAt,
      type: "round_start",
      round: this.roundIndex + 1,
      opponent: this.currentBot,
    });
  }

  /** Advance time-aware state. Caller invokes on each animation frame. */
  tick(): void {
    if (this.phase === "match-over") return;
    const now = this.now();

    if (this.phase === "lead-in" && now >= this.roundStartAt) {
      this.phase = "active";
    }
    if (this.phase === "active" && this.pressedAt !== null && !this.released) {
      // Auto-release as nerve-break if held past max.
      if (now - this.pressedAt > ROUND_MAX_MS) {
        this.release(null);
      }
    }
    if (
      this.phase === "active" &&
      this.pressedAt === null &&
      now - this.roundStartAt > ROUND_MAX_MS
    ) {
      // Player never pressed → treat as nerve-break (loss).
      this.resolve(null);
    }
  }

  press(): void {
    if (this.phase !== "active") return;
    if (this.pressedAt !== null) return;
    this.pressedAt = this.now();
    this.replay.push({ t: this.pressedAt - this.startedAt, type: "press" });
  }

  release(forceHoldMs: number | null = null): void {
    if (this.phase !== "active") return;
    if (this.released) return;
    let holdMs: number | null = forceHoldMs;
    if (holdMs === null && this.pressedAt !== null) {
      holdMs = this.now() - this.pressedAt;
    }
    this.released = true;
    this.replay.push({ t: this.now() - this.startedAt, type: "release" });
    this.resolve(holdMs);
  }

  private resolve(holdMs: number | null): void {
    const playerAction: SamuraiAction = holdToAction(holdMs);
    const botAction = holdToAction(this.botHoldMs);
    const clash = resolveClash(playerAction, botAction, holdMs);
    this.lastClash = clash;
    this.log.push({
      round: this.roundIndex + 1,
      bot: this.currentBot,
      playerHoldMs: holdMs,
      botHoldMs: this.botHoldMs,
      clash,
    });
    this.replay.push({
      t: this.now() - this.startedAt,
      type: "round_end",
      outcome: clash.outcome,
    });
    this.phase = "resolved";
  }

  next(): void {
    if (this.phase !== "resolved") return;
    this.roundIndex += 1;
    if (this.roundIndex >= this.totalRounds) {
      this.phase = "match-over";
      this.endedAt = this.now();
      return;
    }
    this.beginRound();
  }

  isOver(): boolean {
    return this.phase === "match-over";
  }

  metrics(): SamuraiMetrics {
    return metricsFromLog(this.log, (this.endedAt ?? this.now()) - this.startedAt);
  }

  score(): number {
    return computeScore(this.metrics());
  }

  replayEvents(): readonly SamuraiReplayEvent[] {
    return this.replay;
  }

  snapshot(): GameSnapshot {
    const now = this.now();
    let currentHoldMs = -1;
    if (this.pressedAt !== null && !this.released && this.phase === "active") {
      currentHoldMs = now - this.pressedAt;
    }
    const archetype = BOTS[this.currentBot]!;
    return {
      phase: this.phase,
      round: this.roundIndex + 1,
      totalRounds: this.totalRounds,
      bot: { id: archetype.id, label: archetype.label },
      pressedAtMs: this.pressedAt ?? -1,
      currentHoldMs,
      lastClash: this.lastClash,
      metrics: this.metrics(),
      score: this.score(),
    };
  }
}
