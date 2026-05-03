import type { ArcadeRuntime, GameInstance, GameModule, RunResult } from "@chuds/arcade-sdk";
import { OneButtonSamurai } from "./game";
import { manifest } from "./manifest";
import { render } from "./render";

export const game: GameModule = {
  manifest,
  mount(root: HTMLElement, runtime: ArcadeRuntime): GameInstance {
    const obs = new OneButtonSamurai({ seed: runtime.run.seed });
    let raf = 0;
    let submitted = false;
    let isHolding = false;
    let lastRenderKey = "";

    const handlers = {
      onActionDown() {
        if (obs.isOver()) return;
        if (obs.snapshot().phase !== "active") return;
        if (!isHolding) {
          isHolding = true;
          obs.press();
        }
      },
      onActionUp() {
        if (obs.isOver()) return;
        if (isHolding) {
          isHolding = false;
          obs.release();
        }
      },
      onNext() {
        if (obs.isOver()) return;
        obs.next();
        if (obs.isOver()) finish();
      },
    };

    function loop() {
      obs.tick();
      const snap = obs.snapshot();
      const renderKey =
        snap.phase === "active"
          ? ""
          : [
              snap.phase,
              snap.round,
              snap.metrics.wins,
              snap.metrics.losses,
              snap.metrics.perfectStrikes,
              snap.metrics.counters,
              snap.lastClash?.outcome ?? "",
              snap.lastClash?.player ?? "",
              snap.lastClash?.bot ?? "",
            ].join(":");
      if (snap.phase === "active" || renderKey !== lastRenderKey) {
        render(root, snap, handlers);
        lastRenderKey = renderKey;
      }
      if (!obs.isOver()) raf = requestAnimationFrame(loop);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.key === " ") {
        e.preventDefault();
        handlers.onActionDown();
      } else if (e.key === "Enter" && obs.snapshot().phase === "resolved") {
        handlers.onNext();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === " ") {
        e.preventDefault();
        handlers.onActionUp();
      }
    }

    async function finish() {
      if (submitted) return;
      submitted = true;
      const m = obs.metrics();
      const result: RunResult = {
        runId: runtime.run.runId,
        gameSlug: manifest.slug,
        mode: runtime.run.mode,
        rulesetVersion: manifest.rulesetVersion,
        seed: runtime.run.seed,
        score: obs.score(),
        durationMs: m.totalTimeMs,
        outcome: m.wins > m.losses ? "win" : m.wins === m.losses ? "draw" : "loss",
        metrics: {
          wins: m.wins,
          losses: m.losses,
          perfectStrikes: m.perfectStrikes,
          counters: m.counters,
          feints: m.feints,
          falseDraws: m.falseDraws,
          nerveBreaks: m.nerveBreaks,
          cleanRounds: m.cleanRounds,
          averageReleaseMs: m.averageReleaseMs,
          totalTimeMs: m.totalTimeMs,
        },
        clientBuildId: "one-button-samurai@0.1.0",
      };
      await runtime.submitRun(result);
    }

    return {
      start() {
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        loop();
      },
      pause() {},
      resume() {},
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        root.innerHTML = "";
      },
    };
  },
};

export default game;
