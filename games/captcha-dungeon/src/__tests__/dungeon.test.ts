import { describe, expect, it } from "vitest";
import { DUNGEON_LENGTH, FINAL_BOSS_ROOM, MINI_BOSS_ROOM, TILE_GRID } from "../constants";
import { generateDungeon } from "../dungeon";

describe("generateDungeon", () => {
  const seed = "daily:captcha-dungeon:daily-dungeon:2026-05-03:captcha-rules-v1:season-0";

  it("is deterministic for a given seed", () => {
    const a = generateDungeon(seed);
    const b = generateDungeon(seed);
    expect(a.rooms.length).toBe(b.rooms.length);
    for (let i = 0; i < a.rooms.length; i++) {
      expect(a.rooms[i]!.puzzle.correctTileIds).toEqual(b.rooms[i]!.puzzle.correctTileIds);
      expect(a.rooms[i]!.puzzle.tiles.map((t) => t.label)).toEqual(
        b.rooms[i]!.puzzle.tiles.map((t) => t.label),
      );
    }
  });

  it("differs across seeds", () => {
    const a = generateDungeon(seed);
    const b = generateDungeon(seed.replace("season-0", "season-1"));
    const aIds = a.rooms.map((r) => r.puzzle.id).join(",");
    const bIds = b.rooms.map((r) => r.puzzle.id).join(",");
    expect(aIds).not.toBe(bIds);
  });

  it("has the right structure", () => {
    const d = generateDungeon(seed);
    expect(d.rooms.length).toBe(DUNGEON_LENGTH);
    expect(d.rooms[MINI_BOSS_ROOM - 1]!.isBoss).toBe(true);
    expect(d.rooms[FINAL_BOSS_ROOM - 1]!.isBoss).toBe(true);
    for (const room of d.rooms) {
      expect(room.puzzle.tiles.length).toBe(TILE_GRID.rows * TILE_GRID.cols);
      expect(room.puzzle.correctTileIds.length).toBeGreaterThan(0);
    }
  });
});
