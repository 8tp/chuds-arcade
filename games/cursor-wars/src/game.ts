import { createRng } from "@chuds/deterministic-rng";
import {
  ARENA_SIZE,
  MATCH_MS,
  PIXEL_SIZE,
  PLAYER_PHYSICS,
  PLAYER_RADIUS,
  STARTING_HEALTH,
} from "./constants";
import { computeScore } from "./scoring";
import type { CursorActor, CursorMetrics, Hazard, Pixel, Vec2 } from "./types";

export type CursorPhase = "running" | "complete" | "failed";
export type CursorSnapshot = {
  phase: CursorPhase;
  elapsedMs: number;
  player: CursorActor;
  bots: readonly CursorActor[];
  pixels: readonly Pixel[];
  hazards: readonly Hazard[];
  metrics: CursorMetrics;
  score: number;
};

export type CursorOptions = {
  seed: string;
  now?: () => number;
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function norm(v: Vec2): Vec2 {
  const d = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / d, y: v.y / d };
}

export class CursorWars {
  private readonly rng: () => number;
  private readonly now: () => number;
  private readonly startedAt: number;
  private phase: CursorPhase = "running";
  private player: CursorActor;
  private bots: CursorActor[];
  private pixels: Pixel[] = [];
  private hazards: Hazard[] = [];
  private pixelsCollected = 0;
  private botEliminations = 0;
  private combo = 0;
  private maxCombo = 0;
  private damageTaken = 0;
  private lastTickAt: number;
  private invulnerableUntilMs = 0;

  constructor(opts: CursorOptions) {
    this.rng = createRng(`cursor:${opts.seed}`);
    this.now = opts.now ?? (() => Date.now());
    this.startedAt = this.now();
    this.lastTickAt = this.startedAt;
    this.player = this.actor("player", "You", ARENA_SIZE.width * 0.5, ARENA_SIZE.height * 0.58);
    this.bots = [
      this.actor("pixel-goblin", "Pixel Goblin", ARENA_SIZE.width * 0.25, ARENA_SIZE.height * 0.28),
      this.actor("trail-shark", "Trail Shark", ARENA_SIZE.width * 0.72, ARENA_SIZE.height * 0.35),
      this.actor(
        "center-camper",
        "Center Camper",
        ARENA_SIZE.width * 0.52,
        ARENA_SIZE.height * 0.22,
      ),
    ];
    for (let i = 0; i < 18; i += 1) this.spawnPixel();
    for (let i = 0; i < 4; i += 1) this.spawnHazard(i * 5500);
  }

  setTarget(target: Vec2): void {
    this.player.target = {
      x: clamp(target.x, PLAYER_RADIUS, ARENA_SIZE.width - PLAYER_RADIUS),
      y: clamp(target.y, PLAYER_RADIUS, ARENA_SIZE.height - PLAYER_RADIUS),
    };
  }

  dash(): void {
    if (this.player.dashCooldownMs > 0 || !this.player.alive) return;
    this.player.dashRemainingMs = PLAYER_PHYSICS.dashDurationMs;
    this.player.dashCooldownMs = PLAYER_PHYSICS.dashCooldownMs;
  }

  tick(): void {
    if (this.phase !== "running") return;
    const now = this.now();
    const dt = Math.min(100, now - this.lastTickAt);
    this.lastTickAt = now;
    this.updateBotTargets(now - this.startedAt);
    this.moveActor(this.player, dt);
    for (const bot of this.bots) this.moveActor(bot, dt);
    this.collectPixels();
    this.resolveHazards(now - this.startedAt);
    this.resolveBotContact();
    if (now - this.startedAt >= MATCH_MS) this.phase = "complete";
    if (this.player.health <= 0) this.phase = "failed";
  }

  snapshot(): CursorSnapshot {
    const metrics = this.metrics();
    return {
      phase: this.phase,
      elapsedMs: this.now() - this.startedAt,
      player: structuredClone(this.player),
      bots: structuredClone(this.bots),
      pixels: structuredClone(this.pixels),
      hazards: structuredClone(this.hazards),
      metrics,
      score: computeScore(metrics),
    };
  }

  metrics(): CursorMetrics {
    return {
      pixelsCollected: this.pixelsCollected,
      botEliminations: this.botEliminations,
      survivalMs: Math.max(0, this.now() - this.startedAt),
      maxCombo: this.maxCombo,
      damageTaken: this.damageTaken,
    };
  }

  score(): number {
    return computeScore(this.metrics());
  }

  isOver(): boolean {
    return this.phase !== "running";
  }

  private actor(id: string, label: string, x: number, y: number): CursorActor {
    return {
      id,
      label,
      position: { x, y },
      velocity: { x: 0, y: 0 },
      target: { x, y },
      health: STARTING_HEALTH,
      alive: true,
      dashCooldownMs: 0,
      dashRemainingMs: 0,
      trail: [],
    };
  }

  private moveActor(actor: CursorActor, dt: number): void {
    if (!actor.alive) return;
    const toTarget = norm({
      x: actor.target.x - actor.position.x,
      y: actor.target.y - actor.position.y,
    });
    const speed = actor.dashRemainingMs > 0 ? PLAYER_PHYSICS.dashSpeed : PLAYER_PHYSICS.maxSpeed;
    actor.velocity.x += toTarget.x * PLAYER_PHYSICS.acceleration;
    actor.velocity.y += toTarget.y * PLAYER_PHYSICS.acceleration;
    const v = norm(actor.velocity);
    actor.velocity = { x: v.x * speed, y: v.y * speed };
    actor.position.x = clamp(
      actor.position.x + actor.velocity.x * (dt / 1000),
      PLAYER_RADIUS,
      ARENA_SIZE.width - PLAYER_RADIUS,
    );
    actor.position.y = clamp(
      actor.position.y + actor.velocity.y * (dt / 1000),
      PLAYER_RADIUS,
      ARENA_SIZE.height - PLAYER_RADIUS,
    );
    actor.dashCooldownMs = Math.max(0, actor.dashCooldownMs - dt);
    actor.dashRemainingMs = Math.max(0, actor.dashRemainingMs - dt);
    actor.trail.push({ ...actor.position });
    actor.trail = actor.trail.slice(-16);
  }

  private updateBotTargets(elapsedMs: number): void {
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      if (bot.id === "center-camper")
        bot.target = { x: ARENA_SIZE.width / 2, y: ARENA_SIZE.height / 2 };
      else if (bot.id === "trail-shark") bot.target = { ...this.player.position };
      else if (Math.floor(elapsedMs / 900) % 2 === 0) {
        const nearest = [...this.pixels].sort(
          (a, b) => dist(a.position, bot.position) - dist(b.position, bot.position),
        )[0];
        if (nearest) bot.target = { ...nearest.position };
      }
    }
  }

  private collectPixels(): void {
    this.pixels = this.pixels.filter((pixel) => {
      if (dist(pixel.position, this.player.position) < PLAYER_RADIUS + PIXEL_SIZE) {
        this.pixelsCollected += pixel.value;
        this.combo += 1;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.spawnPixel();
        return false;
      }
      for (const bot of this.bots) {
        if (bot.alive && dist(pixel.position, bot.position) < PLAYER_RADIUS + PIXEL_SIZE)
          return false;
      }
      return true;
    });
  }

  private resolveHazards(elapsedMs: number): void {
    for (const hazard of this.hazards) {
      if (elapsedMs < hazard.activeAtMs) continue;
      if (dist(hazard.position, this.player.position) < hazard.radius + PLAYER_RADIUS) {
        if (elapsedMs < this.invulnerableUntilMs) continue;
        this.damageTaken += 1;
        this.combo = 0;
        this.player.health -= 1;
        this.invulnerableUntilMs = elapsedMs + 1000;
        hazard.activeAtMs = elapsedMs + 10_000;
      }
    }
  }

  private resolveBotContact(): void {
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      if (dist(bot.position, this.player.position) < PLAYER_RADIUS * 2) {
        if (this.player.dashRemainingMs > 0) {
          bot.alive = false;
          this.botEliminations += 1;
          this.combo += 3;
          this.maxCombo = Math.max(this.maxCombo, this.combo);
        } else if (this.now() - this.startedAt >= this.invulnerableUntilMs) {
          const away = norm({
            x: bot.position.x - this.player.position.x,
            y: bot.position.y - this.player.position.y,
          });
          bot.position.x = clamp(
            bot.position.x + away.x * 48,
            PLAYER_RADIUS,
            ARENA_SIZE.width - PLAYER_RADIUS,
          );
          bot.position.y = clamp(
            bot.position.y + away.y * 48,
            PLAYER_RADIUS,
            ARENA_SIZE.height - PLAYER_RADIUS,
          );
          this.damageTaken += 1;
          this.combo = 0;
          this.player.health -= 1;
          this.invulnerableUntilMs = this.now() - this.startedAt + 1000;
          bot.target = { x: this.rng() * ARENA_SIZE.width, y: this.rng() * ARENA_SIZE.height };
        }
      }
    }
  }

  private spawnPixel(): void {
    this.pixels.push({
      id: `p${this.pixels.length}_${Math.floor(this.rng() * 1e6)}`,
      position: {
        x: 40 + this.rng() * (ARENA_SIZE.width - 80),
        y: 40 + this.rng() * (ARENA_SIZE.height - 80),
      },
      value: 1,
    });
  }

  private spawnHazard(activeAtMs: number): void {
    this.hazards.push({
      id: `h${this.hazards.length}`,
      position: {
        x: 80 + this.rng() * (ARENA_SIZE.width - 160),
        y: 80 + this.rng() * (ARENA_SIZE.height - 160),
      },
      radius: 28 + this.rng() * 22,
      activeAtMs,
    });
  }
}
