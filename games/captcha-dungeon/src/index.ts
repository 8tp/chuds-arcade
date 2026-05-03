import type { ArcadeRuntime, GameInstance, GameModule, RunResult } from "@chuds/arcade-sdk";
import { CaptchaDungeon } from "./game";
import { manifest } from "./manifest";
import { render } from "./render";

function snapshotMetrics(g: CaptchaDungeon): Record<string, number> {
  const m = g.metrics();
  return {
    roomsCleared: m.roomsCleared,
    bossesDefeated: m.bossesDefeated,
    mistakes: m.mistakes,
    timeouts: m.timeouts,
    healthRemaining: m.healthRemaining,
    maxCombo: m.maxCombo,
    humanityScore: m.humanityScore,
    totalTimeMs: m.totalTimeMs,
  };
}

export const game: GameModule = {
  manifest,
  mount(root: HTMLElement, runtime: ArcadeRuntime): GameInstance {
    const dungeon = new CaptchaDungeon({ seed: runtime.run.seed });
    let focusIndex = 0;
    let raf = 0;
    let submitted = false;

    const handlers = {
      onTileClick(id: string) {
        if (dungeon.isOver()) return;
        dungeon.toggleTile(id);
        scheduleRender();
      },
      onVerify() {
        if (dungeon.isOver()) return;
        dungeon.submit();
        focusIndex = 0;
        scheduleRender();
        if (dungeon.isOver()) finish();
      },
      onSkip() {
        if (dungeon.isOver()) return;
        dungeon.timeoutRoom();
        focusIndex = 0;
        scheduleRender();
        if (dungeon.isOver()) finish();
      },
    };

    function scheduleRender() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        render(root, dungeon, dungeon.snapshot(), focusIndex, handlers),
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (dungeon.isOver()) return;
      const puzzle = dungeon.currentPuzzle();
      if (!puzzle) return;
      const cols = 4;
      const total = puzzle.tiles.length;
      switch (e.key) {
        case "ArrowRight":
          focusIndex = (focusIndex + 1) % total;
          break;
        case "ArrowLeft":
          focusIndex = (focusIndex - 1 + total) % total;
          break;
        case "ArrowDown":
          focusIndex = (focusIndex + cols) % total;
          break;
        case "ArrowUp":
          focusIndex = (focusIndex - cols + total) % total;
          break;
        case " ":
        case "x":
          handlers.onTileClick(puzzle.tiles[focusIndex]!.id);
          e.preventDefault();
          return;
        case "Enter":
          handlers.onVerify();
          e.preventDefault();
          return;
        default:
          return;
      }
      e.preventDefault();
      scheduleRender();
    }

    async function finish() {
      if (submitted) return;
      submitted = true;
      const result: RunResult = {
        runId: runtime.run.runId,
        gameSlug: manifest.slug,
        mode: runtime.run.mode,
        rulesetVersion: manifest.rulesetVersion,
        seed: runtime.run.seed,
        score: dungeon.score(),
        durationMs: dungeon.metrics().totalTimeMs,
        outcome: dungeon.snapshot().status === "victory" ? "complete" : "failed",
        metrics: snapshotMetrics(dungeon),
        clientBuildId: "captcha-dungeon@0.1.0",
      };
      await runtime.submitRun(result);
    }

    return {
      start() {
        window.addEventListener("keydown", onKeyDown);
        scheduleRender();
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
