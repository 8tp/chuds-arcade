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
      <section class="soon-game" aria-labelledby="synth-runner-title">
        <div class="soon-frame" aria-hidden="true">
          <div class="soon-lanes">
            <span></span><span></span><span></span>
          </div>
          <div class="soon-runner"></div>
          <div class="soon-beats">
            <i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>
        <div class="soon-copy">
          <p>// daily song queued</p>
          <h2 id="synth-runner-title">Synth Runner</h2>
          <dl>
            <div><dt>Status</dt><dd>Chart generator next</dd></div>
            <div><dt>Seed</dt><dd>${seed}</dd></div>
          </dl>
        </div>
      </section>
      <style>
        .soon-game { width: min(100%, 760px); min-height: 430px; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(220px, 0.9fr); border: 1px solid var(--color-border); background: var(--color-panel); box-shadow: 4px 4px 0 var(--color-fg); color: var(--color-fg); }
        .soon-frame { position: relative; overflow: hidden; min-height: 430px; border-right: 1px solid var(--color-border); background: repeating-linear-gradient(0deg, transparent 0 22px, color-mix(in srgb, var(--color-fg) 10%, transparent) 23px 24px); }
        .soon-frame::before { content: ""; position: absolute; inset: 0; background: linear-gradient(160deg, transparent 0 38%, color-mix(in srgb, var(--color-fg) 8%, transparent) 39% 40%, transparent 41%); }
        .soon-lanes { position: absolute; inset: 12% 12% 0; display: grid; grid-template-columns: repeat(3, 1fr); transform: perspective(460px) rotateX(58deg); transform-origin: bottom; border-bottom: 3px solid var(--color-fg); }
        .soon-lanes span { border-left: 1px solid var(--color-border); }
        .soon-lanes span:last-child { border-right: 1px solid var(--color-border); }
        .soon-runner { position: absolute; left: 50%; bottom: 18%; width: 34px; height: 52px; transform: translateX(-50%) skew(-6deg); border: 2px solid var(--color-fg); background: var(--color-panel); box-shadow: 5px 5px 0 var(--color-fg); }
        .soon-beats { position: absolute; inset: 18% 18% auto; height: 42%; display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; transform: perspective(460px) rotateX(58deg); transform-origin: bottom; }
        .soon-beats i { display: block; align-self: end; height: 24px; border: 1px solid var(--color-border); background: var(--color-bg); }
        .soon-beats i:nth-child(2n) { height: 52px; background: var(--color-fg); }
        .soon-copy { padding: 1rem; align-self: end; }
        .soon-copy p, .soon-copy dt { font-family: var(--font-mono); font-size: 0.68rem; text-transform: uppercase; color: var(--color-fg-muted); }
        .soon-copy h2 { margin: 0.2rem 0 1rem; font-family: var(--font-display); font-size: clamp(2rem, 7vw, 4rem); line-height: 0.9; }
        .soon-copy dl { display: grid; gap: 0.65rem; margin: 0; }
        .soon-copy div { border-top: 1px solid var(--color-border); padding-top: 0.55rem; }
        .soon-copy dt, .soon-copy dd { margin: 0; }
        .soon-copy dd { font-family: var(--font-mono); font-size: 0.78rem; overflow-wrap: anywhere; }
        @media (max-width: 680px) {
          .soon-game { grid-template-columns: 1fr; }
          .soon-frame { min-height: 280px; border-right: 0; border-bottom: 1px solid var(--color-border); }
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
