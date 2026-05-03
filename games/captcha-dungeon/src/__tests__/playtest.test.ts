// Playtest QA scenarios for Captcha Dungeon.
// These tests simulate real player sessions and report aggregate findings
// rather than asserting strict invariants. Where assertions are made they
// flag potential balance/fairness regressions.

import { createRng } from "@chuds/deterministic-rng";
import { describe, expect, it } from "vitest";
import {
  BOSS_TIME_LIMIT_MS,
  DUNGEON_LENGTH,
  FINAL_BOSS_ROOM,
  MINI_BOSS_ROOM,
  ROOM_TIME_LIMIT_MS,
  STARTING_HEALTH,
  TILE_GRID,
} from "../constants";
import { generateDungeon } from "../dungeon";
import { CaptchaDungeon } from "../game";
import { TEMPLATES } from "../templates";

const TILE_COUNT = TILE_GRID.rows * TILE_GRID.cols;

function makeSeed(i: number): string {
  return `daily:captcha-dungeon:playtest:2026-05-${String((i % 28) + 1).padStart(2, "0")}:captcha-rules-v1:season-${i}`;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Picks a stable per-room time cost (ms) representing how long the archetype
// spends "thinking" before submitting. Used so totalTimeMs is consistent.
const PERFECT_ROOM_TIME = 5_000;
const AVERAGE_ROOM_TIME = 9_000;
const BAD_ROOM_TIME = 7_000;

function runPerfect(seed: string): CaptchaDungeon {
  let now = 0;
  const g = new CaptchaDungeon({ seed, now: () => now });
  while (!g.isOver()) {
    const room = g.currentRoom()!;
    for (const id of room.puzzle.correctTileIds) g.toggleTile(id);
    now += PERFECT_ROOM_TIME;
    g.submit();
  }
  return g;
}

// Average player: per-tile, picks each correct tile with prob 0.8, also
// 10% chance to wrongly select a decoy. Roughly the spec's "80/10/10".
function runAverage(seed: string, rngSeed: string): CaptchaDungeon {
  const rng = createRng(rngSeed);
  let now = 0;
  const g = new CaptchaDungeon({ seed, now: () => now });
  while (!g.isOver()) {
    const room = g.currentRoom()!;
    const correctSet = new Set(room.puzzle.correctTileIds);
    for (const tile of room.puzzle.tiles) {
      const isCorrect = correctSet.has(tile.id);
      if (isCorrect) {
        if (rng() < 0.8) g.toggleTile(tile.id);
      } else {
        if (rng() < 0.1) g.toggleTile(tile.id);
      }
    }
    now += AVERAGE_ROOM_TIME;
    g.submit();
  }
  return g;
}

// Bad player: picks 4 random tiles per room without regard to correctness.
function runBad(seed: string, rngSeed: string): CaptchaDungeon {
  const rng = createRng(rngSeed);
  let now = 0;
  const g = new CaptchaDungeon({ seed, now: () => now });
  while (!g.isOver()) {
    const room = g.currentRoom()!;
    const ids = room.puzzle.tiles.map((t) => t.id);
    // Fisher-Yates partial shuffle.
    const a = [...ids];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    for (let i = 0; i < 4; i++) g.toggleTile(a[i]!);
    now += BAD_ROOM_TIME;
    g.submit();
  }
  return g;
}

describe("playtest: distribution sanity", () => {
  it("100 daily seeds produce well-formed puzzles with sensible difficulty progression", () => {
    const seeds = Array.from({ length: 100 }, (_, i) => makeSeed(i));
    const correctCounts: number[][] = Array.from({ length: DUNGEON_LENGTH }, () => []);
    const templatesByRoom: Map<string, number>[] = Array.from(
      { length: DUNGEON_LENGTH },
      () => new Map(),
    );
    let bossAlwaysCorrectTemplate = true;
    const broken: string[] = [];

    for (const seed of seeds) {
      const d = generateDungeon(seed);
      for (let i = 0; i < d.rooms.length; i++) {
        const room = d.rooms[i]!;
        const cc = room.puzzle.correctTileIds.length;
        correctCounts[i]!.push(cc);
        templatesByRoom[i]!.set(
          room.templateId,
          (templatesByRoom[i]!.get(room.templateId) ?? 0) + 1,
        );
        if (cc === 0) broken.push(`${seed} room ${i + 1}: zero correct tiles`);
        if (cc === TILE_COUNT) broken.push(`${seed} room ${i + 1}: all tiles correct`);
        if (room.puzzle.tiles.length < TILE_COUNT)
          broken.push(`${seed} room ${i + 1}: only ${room.puzzle.tiles.length} tiles`);
        if (room.isBoss && room.templateId !== "select-undead-or-magical")
          bossAlwaysCorrectTemplate = false;
      }
    }

    const avgCorrect = correctCounts.map((arr) => mean(arr));
    // eslint-disable-next-line no-console
    console.log(
      "[playtest] avg correctTileIds per room (1..10):",
      avgCorrect.map((n) => n.toFixed(2)),
    );
    // eslint-disable-next-line no-console
    console.log(
      "[playtest] template distribution per room:",
      templatesByRoom.map((m, i) => ({ room: i + 1, ...Object.fromEntries(m) })),
    );
    // eslint-disable-next-line no-console
    console.log("[playtest] broken puzzles:", broken.length, broken.slice(0, 5));

    expect(broken).toEqual([]);
    expect(bossAlwaysCorrectTemplate).toBe(true);

    // Difficulty (correct tile count) should not strictly drop from early to late game.
    const earlyAvg = mean(avgCorrect.slice(0, 3));
    const lateAvg = mean(avgCorrect.slice(7, 10));
    // eslint-disable-next-line no-console
    console.log(
      "[playtest] early avg correct =",
      earlyAvg.toFixed(2),
      "late avg correct =",
      lateAvg.toFixed(2),
    );
    expect(lateAvg).toBeGreaterThanOrEqual(earlyAvg);
  });
});

describe("playtest: score range across archetypes", () => {
  it("Perfect floor exceeds Bad ceiling across 10 seeds", () => {
    const seeds = Array.from({ length: 10 }, (_, i) => makeSeed(i + 200));

    const perfectScores: number[] = [];
    const averageScores: number[] = [];
    const badScores: number[] = [];

    const perfectStatus: string[] = [];
    const averageStatus: string[] = [];
    const badStatus: string[] = [];

    for (const seed of seeds) {
      const p = runPerfect(seed);
      perfectScores.push(p.score());
      perfectStatus.push(p.snapshot().status);

      const a = runAverage(seed, `avg:${seed}`);
      averageScores.push(a.score());
      averageStatus.push(a.snapshot().status);

      const b = runBad(seed, `bad:${seed}`);
      badScores.push(b.score());
      badStatus.push(b.snapshot().status);
    }

    const summarise = (label: string, arr: number[], statuses: string[]) => {
      const counts: Record<string, number> = {};
      for (const s of statuses) counts[s] = (counts[s] ?? 0) + 1;
      // eslint-disable-next-line no-console
      console.log(
        `[playtest] ${label}: min=${Math.min(...arr)} median=${median(arr)} max=${Math.max(...arr)} status=${JSON.stringify(counts)}`,
      );
    };
    summarise("Perfect", perfectScores, perfectStatus);
    summarise("Average", averageScores, averageStatus);
    summarise("Bad    ", badScores, badStatus);

    // Perfect floor (min) should beat Bad ceiling (max) by a wide margin.
    expect(Math.min(...perfectScores)).toBeGreaterThan(Math.max(...badScores));
  });
});

describe("playtest: health pacing for Average archetype", () => {
  it("most Average runs reach at least the mini-boss; tracks final-room reach rate", () => {
    const N = 50;
    const reachedRooms: number[] = [];
    let reachedFinal = 0;
    let reachedMiniBoss = 0;
    let victories = 0;

    for (let i = 0; i < N; i++) {
      const seed = makeSeed(i + 500);
      const g = runAverage(seed, `avg:${seed}`);
      const snap = g.snapshot();
      // roomIndex is clamped to lastRoom on overflow, but bossesDefeated/roomsCleared
      // tells us how far they actually went.
      const cleared = g.metrics().roomsCleared;
      // If victory: cleared all rooms. Otherwise: died on room (cleared+1) or earlier
      // depending on timeouts (no timeouts in this scenario, so died on cleared+1).
      const deepest = snap.status === "victory" ? DUNGEON_LENGTH : cleared + 1;
      reachedRooms.push(deepest);
      if (deepest >= MINI_BOSS_ROOM) reachedMiniBoss += 1;
      if (deepest >= FINAL_BOSS_ROOM) reachedFinal += 1;
      if (snap.status === "victory") victories += 1;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[playtest] Average pacing over ${N} seeds: reachedMiniBoss=${reachedMiniBoss}/${N} reachedFinalBoss=${reachedFinal}/${N} victories=${victories}/${N} avgDeepestRoom=${mean(reachedRooms).toFixed(2)} medianDeepest=${median(reachedRooms)}`,
    );

    // Distribution of deepest rooms.
    const histo: Record<number, number> = {};
    for (const r of reachedRooms) histo[r] = (histo[r] ?? 0) + 1;
    // eslint-disable-next-line no-console
    console.log("[playtest] deepest-room histogram:", histo);

    expect(reachedMiniBoss / N).toBeGreaterThan(0.5);
    expect(reachedFinal / N).toBeLessThan(0.2); // documents current brutality
  });
});

describe("playtest: combo dynamics", () => {
  it("Perfect runs always achieve maxCombo == DUNGEON_LENGTH; Average median is much lower", () => {
    const seeds = Array.from({ length: 30 }, (_, i) => makeSeed(i + 800));
    const perfectMaxCombos: number[] = [];
    const averageMaxCombos: number[] = [];

    for (const seed of seeds) {
      perfectMaxCombos.push(runPerfect(seed).metrics().maxCombo);
      averageMaxCombos.push(runAverage(seed, `avg:${seed}`).metrics().maxCombo);
    }

    // eslint-disable-next-line no-console
    console.log(
      `[playtest] maxCombo Perfect: min=${Math.min(...perfectMaxCombos)} median=${median(perfectMaxCombos)} max=${Math.max(...perfectMaxCombos)}`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `[playtest] maxCombo Average: min=${Math.min(...averageMaxCombos)} median=${median(averageMaxCombos)} max=${Math.max(...averageMaxCombos)}`,
    );

    expect(Math.min(...perfectMaxCombos)).toBe(DUNGEON_LENGTH);
    // Average should typically not chain everything — sanity check.
    expect(median(averageMaxCombos)).toBeLessThan(DUNGEON_LENGTH);
  });
});

describe("playtest: edge case scenarios", () => {
  const SEED = "edge:captcha-dungeon:case:2026-05-02";

  it("submitting zero tiles on a non-empty puzzle still penalises 1 health (missed-only branch)", () => {
    const g = new CaptchaDungeon({ seed: SEED, now: () => 0 });
    const startHealth = g.snapshot().health;
    expect(g.currentPuzzle()!.correctTileIds.length).toBeGreaterThan(0);
    const r = g.submit();
    expect(r.cleared).toBe(false);
    expect(g.snapshot().health).toBe(startHealth - 1);
    expect(g.snapshot().mistakes).toBe(0); // missed-only path doesn't increment mistakes
  });

  it("selecting every tile counts each decoy as a mistake and burns 1 health (mistake branch)", () => {
    const g = new CaptchaDungeon({ seed: SEED, now: () => 0 });
    const room = g.currentRoom()!;
    for (const tile of room.puzzle.tiles) g.toggleTile(tile.id);
    const startHealth = g.snapshot().health;
    g.submit();
    const decoyCount = room.puzzle.tiles.length - room.puzzle.correctTileIds.length;
    expect(g.snapshot().mistakes).toBe(decoyCount);
    expect(g.snapshot().health).toBe(startHealth - 1);
    // Note: even though there are many mistakes, only 1 health is lost per submission.
  });

  it("timeoutRoom on the final boss ends in defeat regardless of remaining health", () => {
    let now = 0;
    const g = new CaptchaDungeon({ seed: SEED, now: () => now });
    while (g.snapshot().roomIndex < FINAL_BOSS_ROOM - 1 && !g.isOver()) {
      const room = g.currentRoom()!;
      for (const id of room.puzzle.correctTileIds) g.toggleTile(id);
      now += 5_000;
      g.submit();
    }
    expect(g.snapshot().roomIndex).toBe(FINAL_BOSS_ROOM - 1);
    expect(g.currentRoom()!.isBoss).toBe(true);
    // Skipping the final boss must always defeat — playtest caught the
    // pre-fix behavior where it granted a false victory.
    g.timeoutRoom();
    expect(g.snapshot().status).toBe("defeat");
    expect(g.metrics().bossesDefeated).toBe(1); // mini-boss only
    expect(g.metrics().timeouts).toBeGreaterThanOrEqual(1);
  });

  it("submit and toggleTile after isOver() are no-ops", () => {
    const g = new CaptchaDungeon({ seed: SEED, now: () => 0 });
    while (!g.isOver()) g.timeoutRoom();
    expect(g.snapshot().status).toBe("defeat");
    const before = g.snapshot();
    const r = g.submit();
    expect(r).toEqual({ cleared: false, perfect: false });
    g.toggleTile("t0");
    const after = g.snapshot();
    expect(after.score).toBe(before.score);
    expect(after.health).toBe(before.health);
    expect(after.selectedTileIds).toEqual(before.selectedTileIds);
  });
});

describe("playtest: determinism stress", () => {
  it("50 seeds produce identical end-to-end Perfect runs across two executions", () => {
    const seeds = Array.from({ length: 50 }, (_, i) => makeSeed(i + 1100));
    const first = seeds.map((s) => {
      const g = runPerfect(s);
      const m = g.metrics();
      return {
        score: g.score(),
        maxCombo: m.maxCombo,
        humanity: m.humanityScore,
        total: m.totalTimeMs,
      };
    });
    const second = seeds.map((s) => {
      const g = runPerfect(s);
      const m = g.metrics();
      return {
        score: g.score(),
        maxCombo: m.maxCombo,
        humanity: m.humanityScore,
        total: m.totalTimeMs,
      };
    });
    expect(second).toEqual(first);
  });
});

describe("playtest: time-limit sanity", () => {
  it("each room carries the right time limit (boss vs regular)", () => {
    const d = generateDungeon(makeSeed(1));
    for (const room of d.rooms) {
      const expected = room.isBoss ? BOSS_TIME_LIMIT_MS : ROOM_TIME_LIMIT_MS;
      expect(room.puzzle.timeLimitMs).toBe(expected);
    }
  });
});

describe("playtest: STARTING_HEALTH sanity vs. archetype model", () => {
  it("STARTING_HEALTH constant matches the post-rebalance value", () => {
    // Bumped from 3 after playtest showed Average archetype died on room 1 too often.
    expect(STARTING_HEALTH).toBe(5);
    expect(TEMPLATES.find((t) => t.id === "select-undead-or-magical")).toBeTruthy();
  });
});
