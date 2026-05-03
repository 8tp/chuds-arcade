import type { ArcadeRuntime, GameInstance, GameModule, RunResult } from "@chuds/arcade-sdk";
import { SynthRunner } from "./game";
import { manifest } from "./manifest";
import { render, shell } from "./render";

export const game: GameModule = {
  manifest,
  mount(root: HTMLElement, runtime: ArcadeRuntime): GameInstance {
    const runner = new SynthRunner({ seed: runtime.run.seed });
    let raf = 0;
    let submitted = false;
    const handlers = {
      onLeft: () => runner.input("left"),
      onRight: () => runner.input("right"),
      onJump: () => runner.input("jump"),
      onSlide: () => runner.input("slide"),
    };
    const canvas = shell(root, handlers);

    function loop() {
      runner.tick();
      render(root, canvas, runner.snapshot());
      if (runner.isOver()) finish();
      else raf = requestAnimationFrame(loop);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") handlers.onLeft();
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") handlers.onRight();
      else if (e.key === " " || e.key === "ArrowUp") handlers.onJump();
      else if (e.key === "Shift" || e.key === "ArrowDown") handlers.onSlide();
      else return;
      e.preventDefault();
    }

    let touchStart: { x: number; y: number } | null = null;
    function onTouchStart(e: TouchEvent) {
      const touch = e.changedTouches[0];
      if (!touch) return;
      touchStart = { x: touch.clientX, y: touch.clientY };
    }
    function onTouchEnd(e: TouchEvent) {
      const start = touchStart;
      const touch = e.changedTouches[0];
      if (!start || !touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) > Math.abs(dy)) (dx < 0 ? handlers.onLeft : handlers.onRight)();
      else (dy < 0 ? handlers.onJump : handlers.onSlide)();
      touchStart = null;
    }

    async function finish() {
      if (submitted) return;
      submitted = true;
      const snap = runner.snapshot();
      const result: RunResult = {
        runId: runtime.run.runId,
        gameSlug: manifest.slug,
        mode: runtime.run.mode,
        rulesetVersion: manifest.rulesetVersion,
        seed: runtime.run.seed,
        score: snap.score,
        durationMs: snap.songTimeMs,
        outcome: snap.phase === "complete" ? "complete" : "failed",
        metrics: {
          bpm: snap.metrics.bpm,
          distanceMeters: snap.metrics.distanceMeters,
          perfects: snap.metrics.perfects,
          greats: snap.metrics.greats,
          okays: snap.metrics.okays,
          misses: snap.metrics.misses,
          maxCombo: snap.metrics.maxCombo,
          gems: snap.metrics.gems,
          accuracyPercent: snap.metrics.accuracyPercent,
          latencyOffsetMs: snap.metrics.latencyOffsetMs,
        },
        clientBuildId: "synth-runner@0.1.0",
      };
      await runtime.submitRun(result);
    }

    return {
      start() {
        window.addEventListener("keydown", onKeyDown);
        canvas.addEventListener("touchstart", onTouchStart, { passive: true });
        canvas.addEventListener("touchend", onTouchEnd);
        loop();
      },
      pause() {},
      resume() {},
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKeyDown);
        canvas.removeEventListener("touchstart", onTouchStart);
        canvas.removeEventListener("touchend", onTouchEnd);
        root.innerHTML = "";
      },
    };
  },
};

export default game;
