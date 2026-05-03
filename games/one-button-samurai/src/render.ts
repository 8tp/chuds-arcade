// DOM renderer for One Button Samurai. Monochrome only.

import { TIMING } from "./constants";
import type { GameSnapshot } from "./game";

const STYLE_ID = "obs-style";

const STYLE = `
.obs-root { display: flex; flex-direction: column; gap: 0.85rem; padding: 1rem; font-family: var(--font-sans, system-ui); color: var(--color-fg, #090909); }
.obs-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); }
.obs-stat { padding: 0.45rem 0.7rem; border-right: 1px solid var(--color-border, #151515); display: flex; flex-direction: column; gap: 0.15rem; }
.obs-stat:last-child { border-right: none; }
.obs-stat .lbl { font-family: var(--font-mono, monospace); font-size: 0.6rem; text-transform: uppercase; color: var(--color-fg-muted, #565656); }
.obs-stat .val { font-family: var(--font-display, "Space Grotesk"), system-ui; font-weight: 900; font-size: 1.2rem; line-height: 1; }
.obs-arena { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem; padding: 1.5rem 0.5rem; border: 1px solid var(--color-border); background: var(--color-panel); position: relative; min-height: 9rem; }
.obs-arena.is-resolved { background: repeating-linear-gradient(165deg, transparent 0 12px, rgba(9,9,9,0.06) 12px 13px, transparent 13px 22px), var(--color-panel); }
.obs-fighter { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
.obs-fighter .who { font-family: var(--font-display); font-weight: 900; font-size: 1.2rem; }
.obs-fighter .glyph { font-size: 3rem; line-height: 1; }
.obs-center { font-family: var(--font-display); font-weight: 900; font-size: 1.4rem; text-align: center; min-width: 8rem; }
.obs-center .round-num { font-family: var(--font-mono); font-size: 0.7rem; text-transform: uppercase; color: var(--color-fg-muted); margin-bottom: 0.3rem; }
.obs-cta { font-family: var(--font-mono); text-transform: uppercase; font-size: 0.85rem; color: var(--color-fg); margin-top: 0.5rem; }
.obs-bar-bg {
  position: relative; height: 38px; border: 1px solid var(--color-border); background: var(--color-panel);
  display: grid;
}
.obs-bar-zones { position: absolute; inset: 0; display: grid; }
.obs-zone { display: grid; place-items: center; font-family: var(--font-mono); font-size: 0.7rem; text-transform: uppercase; border-right: 1px dashed var(--color-gutter); }
.obs-zone:last-child { border-right: none; }
.obs-zone.feint { background: transparent; }
.obs-zone.strike { background: rgba(9,9,9,0.06); }
.obs-zone.guard { background: rgba(9,9,9,0.12); }
.obs-zone.danger { background: rgba(9,9,9,0.22); }
.obs-marker { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--color-fg); }
.obs-actions { display: flex; gap: 0.5rem; }
.obs-btn { font-family: var(--font-mono, monospace); font-size: 0.75rem; text-transform: uppercase; padding: 0.55rem 0.85rem; border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); cursor: pointer; }
.obs-btn-primary { background: var(--color-fg); color: var(--color-panel); }
.obs-btn:disabled { cursor: not-allowed; background: var(--color-elev, #f7f4ed); color: var(--color-fg-muted, #565656); }
.obs-result { font-family: var(--font-display); font-weight: 900; font-size: 1.4rem; text-transform: uppercase; }
.obs-result.win { color: var(--color-fg); }
.obs-result.loss { color: var(--color-fg-dim); }
.obs-result.draw { color: var(--color-fg-muted); }
.obs-end { text-align: center; padding: 1rem; }
.obs-end h2 { font-family: var(--font-display); font-weight: 900; font-size: clamp(2rem, 5vw, 3.5rem); margin: 0; }
.obs-end p { font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); }
`;

export type RenderHandlers = {
  onActionDown: () => void;
  onActionUp: () => void;
  onNext: () => void;
};

export function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const el = doc.createElement("style");
  el.id = STYLE_ID;
  el.textContent = STYLE;
  doc.head.appendChild(el);
}

function statCell(label: string, value: string): string {
  return `<div class="obs-stat"><span class="lbl">${label}</span><span class="val">${value}</span></div>`;
}

function timingBar(currentHoldMs: number): string {
  const max = TIMING.guardMaxMs + 400;
  const widths = [
    (TIMING.feintMaxMs / max) * 100,
    ((TIMING.strikeMaxMs - TIMING.feintMaxMs) / max) * 100,
    ((TIMING.guardMaxMs - TIMING.strikeMaxMs) / max) * 100,
    ((max - TIMING.guardMaxMs) / max) * 100,
  ];
  const markerLeft =
    currentHoldMs >= 0 ? `${Math.min(100, (currentHoldMs / max) * 100)}%` : "-100%";
  return `
    <div class="obs-bar-bg" aria-label="timing">
      <div class="obs-bar-zones" style="grid-template-columns: ${widths.map((w) => `${w}%`).join(" ")}">
        <div class="obs-zone feint">feint</div>
        <div class="obs-zone strike">strike</div>
        <div class="obs-zone guard">guard</div>
        <div class="obs-zone danger">danger</div>
      </div>
      <span class="obs-marker" style="left: ${markerLeft}"></span>
    </div>
  `;
}

export function render(root: HTMLElement, snap: GameSnapshot, handlers: RenderHandlers): void {
  ensureStyles(root.ownerDocument);

  if (snap.phase === "match-over") {
    const verdict =
      snap.metrics.wins > snap.metrics.losses
        ? "Victory."
        : snap.metrics.wins === snap.metrics.losses
          ? "Draw."
          : "Defeated.";
    root.innerHTML = `
      <div class="obs-root">
        <div class="obs-end">
          <h2>${verdict}</h2>
          <p>// w ${snap.metrics.wins} · l ${snap.metrics.losses} · perfect ${snap.metrics.perfectStrikes} · counters ${snap.metrics.counters} · score ${snap.score.toLocaleString()}</p>
        </div>
      </div>`;
    return;
  }

  const isLeadIn = snap.phase === "lead-in";
  const isResolved = snap.phase === "resolved";

  const center = isLeadIn
    ? `<div class="round-num">round ${String(snap.round).padStart(2, "0")} / ${snap.totalRounds}</div><div>READY</div><div class="obs-cta">// hold to draw</div>`
    : isResolved && snap.lastClash
      ? `<div class="round-num">round ${String(snap.round).padStart(2, "0")}</div><div class="obs-result ${snap.lastClash.outcome}">${snap.lastClash.outcome}</div><div class="obs-cta">// ${snap.lastClash.player} vs ${snap.lastClash.bot}</div>`
      : `<div class="round-num">round ${String(snap.round).padStart(2, "0")} / ${snap.totalRounds}</div><div>STRIKE</div><div class="obs-cta">// release at the bar</div>`;

  root.innerHTML = `
    <div class="obs-root">
      <div class="obs-bar">
        ${statCell("// round", `${snap.round}/${snap.totalRounds}`)}
        ${statCell("// wins", snap.metrics.wins.toString())}
        ${statCell("// losses", snap.metrics.losses.toString())}
        ${statCell("// perfect", snap.metrics.perfectStrikes.toString())}
        ${statCell("// score", snap.score.toLocaleString())}
      </div>

      <div class="obs-arena ${isResolved ? "is-resolved" : ""}">
        <div class="obs-fighter">
          <span class="glyph">人</span>
          <span class="who">You</span>
        </div>
        <div class="obs-center">${center}</div>
        <div class="obs-fighter">
          <span class="glyph">侍</span>
          <span class="who">${snap.bot.label}</span>
        </div>
      </div>

      ${timingBar(snap.currentHoldMs)}

      <div class="obs-actions">
        ${
          isResolved
            ? `<button class="obs-btn obs-btn-primary" data-act="next" type="button">next round →</button>`
            : isLeadIn
              ? `<button class="obs-btn obs-btn-primary" type="button" disabled>wait for draw</button>`
              : `<button class="obs-btn obs-btn-primary" data-act="strike" type="button">press &amp; hold (space)</button>`
        }
      </div>
    </div>
  `;

  if (!isResolved) {
    const btn = root.querySelector<HTMLButtonElement>('[data-act="strike"]');
    if (btn) {
      btn.addEventListener("mousedown", handlers.onActionDown);
      btn.addEventListener("mouseup", handlers.onActionUp);
      btn.addEventListener("mouseleave", handlers.onActionUp);
      btn.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          handlers.onActionDown();
        },
        { passive: false },
      );
      btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        handlers.onActionUp();
      });
    }
  }
  root
    .querySelector<HTMLButtonElement>('[data-act="next"]')
    ?.addEventListener("click", handlers.onNext);
}
