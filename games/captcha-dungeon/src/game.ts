// Pure orchestrator. No DOM here — the renderer pulls a snapshot.

import {
  MINI_BOSS_ROOM,
  PERFECT_ROOM_HUMANITY,
  ROOM_CLEAR_HUMANITY,
  STARTING_HEALTH,
} from "./constants";
import { generateDungeon } from "./dungeon";
import { computeScore, validateSelection } from "./scoring";
import type { Dungeon, Room, RunMetrics, SelectPuzzleInstance } from "./types";

export type GameStatus = "playing" | "victory" | "defeat";

export type GameSnapshot = {
  status: GameStatus;
  roomIndex: number;
  totalRooms: number;
  health: number;
  combo: number;
  maxCombo: number;
  humanity: number;
  score: number;
  mistakes: number;
  startedAtMs: number;
  elapsedMs: number;
  currentRoom: Room | null;
  selectedTileIds: string[];
  lastResult: { correct: boolean; perfect: boolean; mistakes: number; missed: number } | null;
};

export type GameOptions = {
  seed: string;
  now?: () => number;
};

export class CaptchaDungeon {
  private readonly dungeon: Dungeon;
  private readonly now: () => number;
  private idx = 0;
  private health = STARTING_HEALTH;
  private combo = 0;
  private maxCombo = 0;
  private humanity = 0;
  private mistakes = 0;
  private timeouts = 0;
  private bossesDefeated = 0;
  private roomsCleared = 0;
  private startedAt: number;
  private endedAt: number | null = null;
  private status: GameStatus = "playing";
  private selected = new Set<string>();
  private lastResult: GameSnapshot["lastResult"] = null;

  constructor(opts: GameOptions) {
    this.dungeon = generateDungeon(opts.seed);
    this.now = opts.now ?? (() => Date.now());
    this.startedAt = this.now();
  }

  get totalRooms(): number {
    return this.dungeon.rooms.length;
  }

  rooms(): readonly Room[] {
    return this.dungeon.rooms;
  }

  currentRoom(): Room | null {
    return this.dungeon.rooms[this.idx] ?? null;
  }

  currentPuzzle(): SelectPuzzleInstance | null {
    return this.currentRoom()?.puzzle ?? null;
  }

  toggleTile(id: string): void {
    if (this.status !== "playing") return;
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
  }

  isTileSelected(id: string): boolean {
    return this.selected.has(id);
  }

  /** Submit the current selection and advance. Returns whether the room was cleared. */
  submit(): { cleared: boolean; perfect: boolean } {
    const room = this.currentRoom();
    if (this.status !== "playing" || !room) return { cleared: false, perfect: false };
    const tolerance = room.isBoss ? 1 : room.index < MINI_BOSS_ROOM ? 3 : 2;
    const v = validateSelection(Array.from(this.selected), room.puzzle.correctTileIds, tolerance);
    this.lastResult = v;

    if (v.correct) {
      this.mistakes += v.mistakes;
      this.roomsCleared += 1;
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.humanity += v.perfect ? PERFECT_ROOM_HUMANITY : ROOM_CLEAR_HUMANITY;
      if (room.isBoss) this.bossesDefeated += 1;
      this.advance();
      return { cleared: true, perfect: v.perfect };
    }

    this.combo = 0;
    if (v.mistakes > 0) {
      this.mistakes += v.mistakes;
      this.health -= 1;
    }
    if (v.missed > 0 && v.mistakes === 0) {
      this.health -= 1;
    }
    if (this.health <= 0) {
      this.status = "defeat";
      this.endedAt = this.now();
    }
    return { cleared: false, perfect: false };
  }

  /** Time-out the current room. Caller (loop) decides when. */
  timeoutRoom(): void {
    if (this.status !== "playing") return;
    const room = this.currentRoom();
    this.timeouts += 1;
    this.health -= 1;
    this.combo = 0;
    this.lastResult = { correct: false, perfect: false, mistakes: 0, missed: 0 };
    if (this.health <= 0) {
      this.status = "defeat";
      this.endedAt = this.now();
      return;
    }
    // Skipping the final boss is not a win — playtest caught this.
    if (room?.isBoss && room.index === this.dungeon.rooms.length) {
      this.status = "defeat";
      this.endedAt = this.now();
      return;
    }
    this.advance();
  }

  private advance(): void {
    this.idx += 1;
    this.selected.clear();
    if (this.idx >= this.dungeon.rooms.length) {
      this.status = "victory";
      this.endedAt = this.now();
    }
  }

  metrics(): RunMetrics {
    return {
      roomsCleared: this.roomsCleared,
      bossesDefeated: this.bossesDefeated,
      mistakes: this.mistakes,
      timeouts: this.timeouts,
      healthRemaining: Math.max(0, this.health),
      maxCombo: this.maxCombo,
      relicsCollected: 0,
      cursesAccepted: 0,
      humanityScore: this.humanity,
      totalTimeMs: (this.endedAt ?? this.now()) - this.startedAt,
    };
  }

  score(): number {
    return computeScore(this.metrics());
  }

  snapshot(): GameSnapshot {
    return {
      status: this.status,
      roomIndex: Math.min(this.idx, this.dungeon.rooms.length - 1),
      totalRooms: this.dungeon.rooms.length,
      health: Math.max(0, this.health),
      combo: this.combo,
      maxCombo: this.maxCombo,
      humanity: this.humanity,
      score: this.score(),
      mistakes: this.mistakes,
      startedAtMs: this.startedAt,
      elapsedMs: (this.endedAt ?? this.now()) - this.startedAt,
      currentRoom: this.currentRoom(),
      selectedTileIds: Array.from(this.selected),
      lastResult: this.lastResult,
    };
  }

  isOver(): boolean {
    return this.status !== "playing";
  }
}
