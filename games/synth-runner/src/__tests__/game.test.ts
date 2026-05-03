import { describe, expect, it } from "vitest";
import { beatToMs } from "../chart";
import { LEAD_IN_MS } from "../constants";
import { SynthRunner } from "../game";
import type { RunnerAction } from "../types";

function actionFor(type: string): RunnerAction {
  if (type === "slide") return "slide";
  if (type === "jump" || type === "gap") return "jump";
  return "right";
}

describe("SynthRunner", () => {
  it("starts after lead-in and can hit the next event", () => {
    let now = 0;
    const game = new SynthRunner({ seed: "daily:synth:game", now: () => now });
    expect(game.snapshot().phase).toBe("ready");
    now = LEAD_IN_MS + 1;
    game.tick();
    expect(game.snapshot().phase).toBe("running");

    const event = game.snapshot().chart[0]!;
    now = LEAD_IN_MS + beatToMs(game.snapshot().song, event.beat);
    while (game.snapshot().lane < event.lane) game.input("right");
    while (game.snapshot().lane > event.lane) game.input("left");
    game.input(actionFor(event.type));

    expect(game.snapshot().metrics.misses).toBe(0);
    expect(game.snapshot().combo).toBeGreaterThanOrEqual(1);
  });

  it("missing obstacles spends health and can fail", () => {
    let now = 0;
    const game = new SynthRunner({ seed: "daily:synth:miss", now: () => now });
    now = LEAD_IN_MS + 1;
    game.tick();
    for (const event of game.snapshot().chart) {
      now = LEAD_IN_MS + beatToMs(game.snapshot().song, event.beat) + 220;
      game.tick();
      if (game.isOver()) break;
    }
    expect(game.snapshot().metrics.misses).toBeGreaterThan(0);
    expect(game.snapshot().health).toBeLessThan(6);
  });
});
