import type { ArcadeRuntime, GameInstance, GameModule } from "@chuds/arcade-sdk";
import { manifest } from "./manifest";

export const game: GameModule = {
  manifest,
  mount(root: HTMLElement, runtime: ArcadeRuntime): GameInstance {
    root.innerHTML = `<div class="game-placeholder"><h2>Cursor Wars</h2><p>Implement this game from specs/games/cursor-wars.md</p><pre>${runtime.run.seed}</pre></div>`;
    return {
      start() {},
      pause() {},
      resume() {},
      destroy() {
        root.innerHTML = "";
      },
    };
  },
};

export default game;
