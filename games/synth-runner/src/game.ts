import { beatToMs, generateChart, generateSongSeed } from "./chart";
import { LEAD_IN_MS, STARTING_HEALTH } from "./constants";
import { computeScore, judgeTiming } from "./scoring";
import type { ChartEvent, HitResult, RunnerAction, SongSeed, SynthMetrics } from "./types";

export type SynthPhase = "ready" | "running" | "complete" | "failed";

export type SynthSnapshot = {
  phase: SynthPhase;
  song: SongSeed;
  chart: readonly ChartEvent[];
  nowMs: number;
  songTimeMs: number;
  lane: number;
  health: number;
  combo: number;
  metrics: SynthMetrics;
  score: number;
  nextEvent: ChartEvent | null;
  lastHit: HitResult | null;
};

export type SynthOptions = {
  seed: string;
  now?: () => number;
};

export class SynthRunner {
  private readonly now: () => number;
  private readonly startedAt: number;
  private readonly song: SongSeed;
  private readonly chart: ChartEvent[];
  private readonly hit = new Set<string>();
  private phase: SynthPhase = "ready";
  private lane = 1;
  private health = STARTING_HEALTH;
  private combo = 0;
  private maxCombo = 0;
  private perfects = 0;
  private greats = 0;
  private okays = 0;
  private misses = 0;
  private gems = 0;
  private lastHit: HitResult | null = null;

  constructor(opts: SynthOptions) {
    this.now = opts.now ?? (() => Date.now());
    this.startedAt = this.now();
    this.song = generateSongSeed(opts.seed);
    this.chart = generateChart(this.song);
  }

  tick(): void {
    if (this.phase === "complete" || this.phase === "failed") return;
    const songTime = this.songTimeMs();
    if (this.phase === "ready" && songTime >= 0) this.phase = "running";
    if (this.phase !== "running") return;

    for (const event of this.chart) {
      if (this.hit.has(event.id)) continue;
      const due = beatToMs(this.song, event.beat);
      if (event.type === "gem" && event.lane === this.lane && Math.abs(songTime - due) <= 60) {
        this.hit.add(event.id);
        this.gems += 1;
        this.combo += 1;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.lastHit = { eventId: event.id, judgment: "perfect", deltaMs: songTime - due };
        continue;
      }
      if (songTime - due > 180) this.miss(event);
    }

    if (songTime > beatToMs(this.song, this.song.lengthBeats + 1)) {
      this.phase = this.health > 0 ? "complete" : "failed";
    }
  }

  input(action: RunnerAction): void {
    this.tick();
    if (this.phase !== "running") return;
    const nextLane =
      action === "left"
        ? Math.max(0, this.lane - 1)
        : action === "right"
          ? Math.min(2, this.lane + 1)
          : this.lane;

    const event = this.findCandidate(nextLane);
    if (action === "left" || action === "right") this.lane = nextLane;
    if (!event) return;
    if (!this.actionMatches(action, event)) return;
    const deltaMs = this.songTimeMs() - beatToMs(this.song, event.beat);
    const judgment = judgeTiming(deltaMs);
    if (judgment === "miss") {
      this.miss(event, deltaMs);
      return;
    }
    this.hit.add(event.id);
    if (judgment === "perfect") this.perfects += 1;
    if (judgment === "great") this.greats += 1;
    if (judgment === "okay") this.okays += 1;
    if (event.type === "gem") this.gems += 1;
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.lastHit = { eventId: event.id, judgment, deltaMs };
  }

  snapshot(): SynthSnapshot {
    const metrics = this.metrics();
    return {
      phase: this.phase,
      song: this.song,
      chart: this.chart,
      nowMs: this.now(),
      songTimeMs: this.songTimeMs(),
      lane: this.lane,
      health: this.health,
      combo: this.combo,
      metrics,
      score: computeScore(metrics),
      nextEvent: this.nextEvent(),
      lastHit: this.lastHit,
    };
  }

  metrics(): SynthMetrics {
    const judged = this.perfects + this.greats + this.okays + this.misses;
    const hits = this.perfects + this.greats + this.okays;
    return {
      bpm: this.song.bpm,
      distanceMeters: Math.max(0, Math.floor(this.songTimeMs() / 120)),
      perfects: this.perfects,
      greats: this.greats,
      okays: this.okays,
      misses: this.misses,
      maxCombo: this.maxCombo,
      gems: this.gems,
      accuracyPercent: judged === 0 ? 100 : Math.round((hits / judged) * 100),
      latencyOffsetMs: 0,
    };
  }

  score(): number {
    return computeScore(this.metrics());
  }

  isOver(): boolean {
    return this.phase === "complete" || this.phase === "failed";
  }

  private songTimeMs(): number {
    return this.now() - this.startedAt - LEAD_IN_MS;
  }

  private findCandidate(lane = this.lane): ChartEvent | null {
    const songTime = this.songTimeMs();
    let best: { event: ChartEvent; abs: number } | null = null;
    for (const event of this.chart) {
      if (this.hit.has(event.id)) continue;
      if (event.lane !== lane) continue;
      const abs = Math.abs(songTime - beatToMs(this.song, event.beat));
      if (abs > 170) continue;
      if (!best || abs < best.abs) best = { event, abs };
    }
    return best?.event ?? null;
  }

  private nextEvent(): ChartEvent | null {
    const songTime = this.songTimeMs();
    return (
      this.chart.find(
        (event) => !this.hit.has(event.id) && beatToMs(this.song, event.beat) >= songTime - 180,
      ) ?? null
    );
  }

  private actionMatches(action: RunnerAction, event: ChartEvent): boolean {
    if (event.type === "jump" || event.type === "gap") return action === "jump";
    if (event.type === "slide") return action === "slide";
    if (event.type === "gem" || event.type === "safe") return true;
    return action === "left" || action === "right";
  }

  private miss(
    event: ChartEvent,
    deltaMs = this.songTimeMs() - beatToMs(this.song, event.beat),
  ): void {
    this.hit.add(event.id);
    this.combo = 0;
    this.misses += 1;
    this.health -= event.type === "gem" || event.type === "safe" ? 0 : 1;
    this.lastHit = { eventId: event.id, judgment: "miss", deltaMs };
    if (this.health <= 0) this.phase = "failed";
  }
}
