import { describe, expect, it } from "vitest";
import { ROUND_LEAD_IN_MS } from "../constants";
import { OneButtonSamurai } from "../game";

const SEED = "daily:one-button-samurai:daily-dojo:2026-05-03:obs-rules-v1:season-0";

class Clock {
  t = 0;
  now = () => this.t;
}

describe("OneButtonSamurai", () => {
  it("plays a deterministic match with a given hold strategy", () => {
    const clock = new Clock();
    const game = new OneButtonSamurai({ seed: SEED, now: clock.now, rounds: 3 });
    while (!game.isOver()) {
      // Skip lead-in.
      clock.t += ROUND_LEAD_IN_MS + 1;
      game.tick();
      // Press, hold 380ms, release.
      game.press();
      clock.t += 380;
      game.release();
      // Advance.
      game.next();
    }
    const a = game.metrics();

    const clock2 = new Clock();
    const game2 = new OneButtonSamurai({ seed: SEED, now: clock2.now, rounds: 3 });
    while (!game2.isOver()) {
      clock2.t += ROUND_LEAD_IN_MS + 1;
      game2.tick();
      game2.press();
      clock2.t += 380;
      game2.release();
      game2.next();
    }
    const b = game2.metrics();

    expect(a.wins).toBe(b.wins);
    expect(a.losses).toBe(b.losses);
    expect(a.perfectStrikes).toBe(b.perfectStrikes);
  });

  it("treats no-press as a nerve-break loss", () => {
    const clock = new Clock();
    const game = new OneButtonSamurai({ seed: SEED, now: clock.now, rounds: 1 });
    clock.t += ROUND_LEAD_IN_MS + 1;
    game.tick();
    // Skip past round-max without pressing.
    clock.t += 5_000;
    game.tick();
    expect(game.snapshot().phase).toBe("resolved");
    expect(game.snapshot().lastClash?.nerveBreak).toBe(true);
    expect(game.snapshot().lastClash?.outcome).toBe("loss");
  });

  it("emits replay events in order", () => {
    const clock = new Clock();
    const game = new OneButtonSamurai({ seed: SEED, now: clock.now, rounds: 2 });
    clock.t += ROUND_LEAD_IN_MS + 1;
    game.tick();
    game.press();
    clock.t += 400;
    game.release();
    game.next();
    const events = game.replayEvents().slice();
    const types = events.map((e) => e.type);
    expect(types[0]).toBe("round_start");
    expect(types).toContain("press");
    expect(types).toContain("release");
    expect(types).toContain("round_end");
  });
});
