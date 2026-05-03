import { describe, expect, it } from "vitest";
import { ARENA_SIZE, TICK_MS } from "../constants";
import { CursorWars } from "../game";

describe("CursorWars", () => {
  it("is deterministic for the same seed and target path", () => {
    function run() {
      let now = 0;
      const game = new CursorWars({ seed: "daily:cursor:deterministic", now: () => now });
      game.setTarget({ x: 700, y: 260 });
      for (let i = 0; i < 20; i += 1) {
        now += TICK_MS;
        game.tick();
      }
      return game.snapshot();
    }
    expect(run()).toEqual(run());
  });

  it("moves toward target without leaving arena bounds", () => {
    let now = 0;
    const game = new CursorWars({ seed: "daily:cursor:bounds", now: () => now });
    game.setTarget({ x: 9999, y: -9999 });
    for (let i = 0; i < 30; i += 1) {
      now += TICK_MS;
      game.tick();
    }
    const { player } = game.snapshot();
    expect(player.position.x).toBeGreaterThanOrEqual(0);
    expect(player.position.x).toBeLessThanOrEqual(ARENA_SIZE.width);
    expect(player.position.y).toBeGreaterThanOrEqual(0);
    expect(player.position.y).toBeLessThanOrEqual(ARENA_SIZE.height);
  });

  it("can collect pixels by steering into them", () => {
    let now = 0;
    const game = new CursorWars({ seed: "daily:cursor:collect", now: () => now });
    const pixel = game.snapshot().pixels[0]!;
    game.setTarget(pixel.position);
    for (let i = 0; i < 120; i += 1) {
      now += TICK_MS;
      game.tick();
    }
    expect(game.snapshot().metrics.pixelsCollected).toBeGreaterThan(0);
    expect(game.score()).toBeGreaterThan(0);
  });
});
