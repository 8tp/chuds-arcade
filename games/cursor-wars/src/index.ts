import type { ArcadeRuntime, GameInstance, GameModule, RunResult } from "@chuds/arcade-sdk";
import { CursorWars } from "./game";
import { manifest } from "./manifest";
import { render, shell } from "./render";

export const game: GameModule = {
  manifest,
  mount(root: HTMLElement, runtime: ArcadeRuntime): GameInstance {
    const arena = new CursorWars({ seed: runtime.run.seed });
    let raf = 0;
    let submitted = false;
    const canvas = shell(root, {
      onTarget: (target) => arena.setTarget(target),
      onDash: () => arena.dash(),
    });

    function loop() {
      arena.tick();
      render(root, canvas, arena.snapshot());
      if (arena.isOver()) finish();
      else raf = requestAnimationFrame(loop);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === " ") {
        e.preventDefault();
        arena.dash();
      }
      if (e.key === "1") arena.setTarget({ x: 480, y: 260 });
    }

    async function finish() {
      if (submitted) return;
      submitted = true;
      const snap = arena.snapshot();
      const result: RunResult = {
        runId: runtime.run.runId,
        gameSlug: manifest.slug,
        mode: runtime.run.mode,
        rulesetVersion: manifest.rulesetVersion,
        seed: runtime.run.seed,
        score: snap.score,
        durationMs: snap.elapsedMs,
        outcome: snap.phase === "complete" ? "complete" : "failed",
        metrics: {
          pixelsCollected: snap.metrics.pixelsCollected,
          botEliminations: snap.metrics.botEliminations,
          survivalMs: snap.metrics.survivalMs,
          maxCombo: snap.metrics.maxCombo,
          damageTaken: snap.metrics.damageTaken,
        },
        clientBuildId: "cursor-wars@0.1.0",
      };
      await runtime.submitRun(result);
    }

    return {
      start() {
        window.addEventListener("keydown", onKeyDown);
        loop();
      },
      pause() {},
      resume() {},
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKeyDown);
        root.innerHTML = "";
      },
    };
  },
};

export default game;
