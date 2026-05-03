import { describe, expect, it } from "vitest";
import { STARTING_HEALTH } from "../constants";
import { CaptchaDungeon } from "../game";

const SEED = "daily:captcha-dungeon:daily-dungeon:2026-05-03:captcha-rules-v1:season-0";

describe("CaptchaDungeon", () => {
  it("clears every room when the player picks all correct tiles", () => {
    let now = 0;
    const g = new CaptchaDungeon({ seed: SEED, now: () => now });
    while (!g.isOver()) {
      const room = g.currentRoom()!;
      for (const id of room.puzzle.correctTileIds) g.toggleTile(id);
      now += 4_000;
      g.submit();
    }
    expect(g.snapshot().status).toBe("victory");
    expect(g.metrics().bossesDefeated).toBe(2);
    expect(g.metrics().healthRemaining).toBe(STARTING_HEALTH);
  });

  it("ends in defeat after enough wrong submissions", () => {
    const g = new CaptchaDungeon({ seed: SEED, now: () => 0 });
    while (!g.isOver()) {
      // Pick a tile guaranteed to be wrong: any tile not in the correct set.
      const room = g.currentRoom()!;
      const correct = new Set(room.puzzle.correctTileIds);
      const wrong = room.puzzle.tiles.find((t) => !correct.has(t.id))!;
      g.toggleTile(wrong.id);
      g.submit();
    }
    expect(g.snapshot().status).toBe("defeat");
    expect(g.metrics().mistakes).toBeGreaterThan(0);
  });

  it("resets combo on a wrong room", () => {
    const g = new CaptchaDungeon({ seed: SEED, now: () => 0 });
    // Clear room 1 cleanly.
    const r1 = g.currentRoom()!;
    for (const id of r1.puzzle.correctTileIds) g.toggleTile(id);
    g.submit();
    expect(g.snapshot().combo).toBe(1);
    // Submit a wrong selection in room 2.
    const r2 = g.currentRoom()!;
    const wrong = r2.puzzle.tiles.find((t) => !r2.puzzle.correctTileIds.includes(t.id))!;
    g.toggleTile(wrong.id);
    g.submit();
    expect(g.snapshot().combo).toBe(0);
  });
});
