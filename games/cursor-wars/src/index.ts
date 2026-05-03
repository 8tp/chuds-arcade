import type { ArcadeRuntime, GameInstance, GameModule } from "@chuds/arcade-sdk";
import { manifest } from "./manifest";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]!,
  );
}

export const game: GameModule = {
  manifest,
  mount(root: HTMLElement, runtime: ArcadeRuntime): GameInstance {
    const seed = escapeHtml(runtime.run.seed);
    root.innerHTML = `
      <section class="soon-game" aria-labelledby="cursor-wars-title">
        <div class="soon-arena" aria-hidden="true">
          <span class="cursor player"></span>
          <span class="cursor bot-a"></span>
          <span class="cursor bot-b"></span>
          <span class="pixel p1"></span>
          <span class="pixel p2"></span>
          <span class="pixel p3"></span>
          <span class="trail t1"></span>
          <span class="trail t2"></span>
        </div>
        <div class="soon-copy">
          <p>// bot arena staging</p>
          <h2 id="cursor-wars-title">Cursor Wars</h2>
          <dl>
            <div><dt>Status</dt><dd>Physics prototype next</dd></div>
            <div><dt>Seed</dt><dd>${seed}</dd></div>
          </dl>
        </div>
      </section>
      <style>
        .soon-game { width: min(100%, 760px); min-height: 430px; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(220px, 0.9fr); border: 1px solid var(--color-border); background: var(--color-panel); box-shadow: 4px 4px 0 var(--color-fg); color: var(--color-fg); }
        .soon-arena { position: relative; overflow: hidden; min-height: 430px; border-right: 1px solid var(--color-border); background: linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px); background-size: 34px 34px; }
        .soon-arena::before { content: ""; position: absolute; inset: 9%; border: 3px double var(--color-fg); }
        .cursor { position: absolute; width: 0; height: 0; border-top: 28px solid var(--color-fg); border-right: 18px solid transparent; filter: drop-shadow(4px 4px 0 var(--color-panel)); }
        .player { left: 44%; top: 45%; transform: rotate(-18deg); }
        .bot-a { left: 20%; top: 26%; transform: scale(0.75) rotate(26deg); opacity: 0.72; }
        .bot-b { right: 19%; bottom: 24%; transform: scale(0.82) rotate(-112deg); opacity: 0.72; }
        .pixel { position: absolute; width: 14px; height: 14px; border: 1px solid var(--color-border); background: var(--color-bg); box-shadow: 2px 2px 0 var(--color-fg); }
        .p1 { left: 30%; top: 62%; }
        .p2 { right: 27%; top: 31%; }
        .p3 { right: 35%; bottom: 18%; }
        .trail { position: absolute; height: 1px; border-top: 2px dashed var(--color-fg); opacity: 0.55; }
        .t1 { left: 18%; top: 39%; width: 42%; transform: rotate(18deg); }
        .t2 { right: 16%; bottom: 34%; width: 38%; transform: rotate(-27deg); }
        .soon-copy { padding: 1rem; align-self: end; }
        .soon-copy p, .soon-copy dt { font-family: var(--font-mono); font-size: 0.68rem; text-transform: uppercase; color: var(--color-fg-muted); }
        .soon-copy h2 { margin: 0.2rem 0 1rem; font-family: var(--font-display); font-size: clamp(2rem, 7vw, 4rem); line-height: 0.9; }
        .soon-copy dl { display: grid; gap: 0.65rem; margin: 0; }
        .soon-copy div { border-top: 1px solid var(--color-border); padding-top: 0.55rem; }
        .soon-copy dt, .soon-copy dd { margin: 0; }
        .soon-copy dd { font-family: var(--font-mono); font-size: 0.78rem; overflow-wrap: anywhere; }
        @media (max-width: 680px) {
          .soon-game { grid-template-columns: 1fr; }
          .soon-arena { min-height: 280px; border-right: 0; border-bottom: 1px solid var(--color-border); }
        }
      </style>`;
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
