import { beatToMs } from "./chart";
import { LEAD_IN_MS } from "./constants";
import type { SynthSnapshot } from "./game";

const STYLE_ID = "synth-runner-style";

const STYLE = `
.sr-root { width: 100%; min-width: 0; display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; color: var(--color-fg, #090909); }
.sr-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); }
.sr-stat { min-width: 0; padding: 0.45rem 0.7rem; border-right: 1px solid var(--color-border, #151515); display: flex; flex-direction: column; gap: 0.15rem; }
.sr-stat:last-child { border-right: none; }
.sr-stat .lbl { font-family: var(--font-mono, monospace); font-size: 0.6rem; text-transform: uppercase; color: var(--color-fg-muted, #565656); }
.sr-stat .val { font-family: var(--font-display, "Space Grotesk"), system-ui; font-weight: 900; font-size: 1.12rem; line-height: 1; overflow-wrap: anywhere; }
.sr-stage { position: relative; min-height: 430px; border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); box-shadow: 4px 4px 0 var(--color-fg, #090909); overflow: hidden; }
.sr-canvas { display: block; width: 100%; height: 430px; background: var(--color-panel, #fffdf7); touch-action: none; }
.sr-overlay { position: absolute; left: 1rem; right: 1rem; bottom: 1rem; display: flex; justify-content: space-between; gap: 1rem; align-items: end; pointer-events: none; }
.sr-callout { font-family: var(--font-display, "Space Grotesk"); font-weight: 900; font-size: clamp(1.6rem, 5vw, 3rem); line-height: 0.9; text-transform: uppercase; }
.sr-help { max-width: 18rem; text-align: right; font-family: var(--font-mono, monospace); font-size: 0.7rem; text-transform: uppercase; color: var(--color-fg-muted, #565656); }
.sr-next { position: absolute; top: 1rem; left: 1rem; right: 1rem; display: flex; justify-content: space-between; gap: 1rem; font-family: var(--font-mono, monospace); font-size: 0.72rem; text-transform: uppercase; color: var(--color-fg, #090909); pointer-events: none; }
.sr-next strong { font-family: var(--font-display, "Space Grotesk"); font-size: 1rem; }
.sr-actions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.5rem; }
.sr-btn { min-height: 42px; border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); font-family: var(--font-mono, monospace); font-size: 0.7rem; text-transform: uppercase; color: var(--color-fg, #090909); cursor: pointer; }
.sr-btn:active { background: var(--color-fg, #090909); color: var(--color-panel, #fffdf7); }
@media (max-width: 520px) {
  .sr-root { padding: 0.65rem; }
  .sr-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sr-stage { min-height: 340px; }
  .sr-canvas { height: 340px; }
  .sr-overlay { left: 0.65rem; right: 0.65rem; bottom: 0.65rem; }
  .sr-help { display: none; }
}
`;

export type SynthHandlers = {
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  onSlide: () => void;
};

export function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const el = doc.createElement("style");
  el.id = STYLE_ID;
  el.textContent = STYLE;
  doc.head.appendChild(el);
}

function statCell(label: string, value: string): string {
  return `<div class="sr-stat"><span class="lbl">${label}</span><span class="val">${value}</span></div>`;
}

export function shell(root: HTMLElement, handlers: SynthHandlers): HTMLCanvasElement {
  ensureStyles(root.ownerDocument);
  root.innerHTML = `
    <div class="sr-root">
      <div class="sr-bar" data-stats></div>
      <div class="sr-stage">
        <canvas class="sr-canvas" width="960" height="520" aria-label="Synth Runner playfield"></canvas>
        <div class="sr-next" data-next></div>
        <div class="sr-overlay">
          <div class="sr-callout" data-callout>Ready</div>
          <div class="sr-help">// A/D shift · Space jump · Shift slide</div>
        </div>
      </div>
      <div class="sr-actions">
        <button class="sr-btn" data-act="left" type="button">left</button>
        <button class="sr-btn" data-act="right" type="button">right</button>
        <button class="sr-btn" data-act="jump" type="button">jump</button>
        <button class="sr-btn" data-act="slide" type="button">slide</button>
      </div>
    </div>`;
  root
    .querySelector<HTMLButtonElement>('[data-act="left"]')
    ?.addEventListener("click", handlers.onLeft);
  root
    .querySelector<HTMLButtonElement>('[data-act="right"]')
    ?.addEventListener("click", handlers.onRight);
  root
    .querySelector<HTMLButtonElement>('[data-act="jump"]')
    ?.addEventListener("click", handlers.onJump);
  root
    .querySelector<HTMLButtonElement>('[data-act="slide"]')
    ?.addEventListener("click", handlers.onSlide);
  return root.querySelector<HTMLCanvasElement>("canvas")!;
}

export function render(root: HTMLElement, canvas: HTMLCanvasElement, snap: SynthSnapshot): void {
  const stats = root.querySelector<HTMLElement>("[data-stats]");
  if (stats) {
    stats.innerHTML = [
      statCell("// bpm", snap.song.bpm.toString()),
      statCell("// hearts", "■".repeat(snap.health) || "-"),
      statCell("// combo", snap.combo.toString()),
      statCell("// acc", `${snap.metrics.accuracyPercent}%`),
      statCell("// score", snap.score.toLocaleString()),
    ].join("");
  }
  const callout = root.querySelector<HTMLElement>("[data-callout]");
  if (callout) {
    callout.textContent =
      snap.phase === "ready"
        ? "Ready"
        : snap.phase === "complete"
          ? "Track clear"
          : snap.phase === "failed"
            ? "Signal lost"
            : (snap.lastHit?.judgment ?? "Run");
  }
  const next = root.querySelector<HTMLElement>("[data-next]");
  if (next) {
    const event = snap.nextEvent;
    const action = event ? actionFor(event.type) : "-";
    const dueIn = event ? beatToMs(snap.song, event.beat) - snap.songTimeMs : 0;
    const timing = Math.abs(dueIn) <= 90 ? "NOW" : `${Math.max(0, dueIn / 1000).toFixed(1)}s`;
    next.innerHTML = event
      ? `<span>// next <strong>${action}</strong></span><span>${timing} · lane ${event.lane + 1} · beat ${event.beat}</span>`
      : "<span>// outro</span><span>hold the line</span>";
  }
  draw(canvas, snap);
}

function actionFor(type: string): string {
  if (type === "slide") return "slide";
  if (type === "jump" || type === "gap") return "jump";
  if (type === "gem") return "collect";
  return "shift";
}

function draw(canvas: HTMLCanvasElement, snap: SynthSnapshot): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#090909";
  ctx.lineWidth = 2;

  const horizon = h * 0.18;
  const floor = h * 0.88;
  const center = w / 2;
  const laneBottom = [w * 0.2, w * 0.4, w * 0.6, w * 0.8];
  for (const x of laneBottom) {
    ctx.beginPath();
    ctx.moveTo(center, horizon);
    ctx.lineTo(x, floor);
    ctx.stroke();
  }
  for (let i = 0; i < 13; i += 1) {
    const y = horizon + (floor - horizon) * (i / 12) ** 1.65;
    const inset = (1 - i / 12) * w * 0.42;
    ctx.beginPath();
    ctx.moveTo(inset, y);
    ctx.lineTo(w - inset, y);
    ctx.stroke();
  }

  const songTime = snap.songTimeMs;
  for (const event of snap.chart) {
    const due = beatToMs(snap.song, event.beat);
    const until = due - songTime;
    if (until < -220 || until > 3200) continue;
    const t = 1 - until / 3200;
    const y = horizon + (floor - horizon) * t ** 1.7;
    const laneWidth = w * (0.08 + t * 0.12);
    const x = center + (event.lane - 1) * laneWidth * 1.35;
    const size = 10 + t * 34;
    ctx.fillStyle = event.type === "gem" ? "#fffdf7" : "#090909";
    ctx.strokeStyle = "#090909";
    ctx.lineWidth = 2;
    ctx.fillRect(x - size / 2, y - size / 2, size, size * 0.52);
    ctx.strokeRect(x - size / 2, y - size / 2, size, size * 0.52);
    if (event.type === "jump" || event.type === "gap") {
      ctx.beginPath();
      ctx.moveTo(x - size * 0.32, y - size * 0.85);
      ctx.lineTo(x, y - size * 1.25);
      ctx.lineTo(x + size * 0.32, y - size * 0.85);
      ctx.stroke();
    }
    if (event.type === "slide") {
      ctx.beginPath();
      ctx.moveTo(x - size * 0.42, y - size * 0.95);
      ctx.lineTo(x + size * 0.42, y - size * 0.95);
      ctx.stroke();
    }
  }

  const runnerX = center + (snap.lane - 1) * w * 0.16;
  ctx.fillStyle = "#fffdf7";
  ctx.strokeStyle = "#090909";
  ctx.lineWidth = 3;
  ctx.fillRect(runnerX - 18, floor - 62, 36, 52);
  ctx.strokeRect(runnerX - 18, floor - 62, 36, 52);
  ctx.fillStyle = "#090909";
  ctx.fillRect(runnerX - 8, floor - 84, 16, 16);

  ctx.strokeStyle = "#090909";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 48; i += 1) {
    const x = (i / 47) * w;
    const y = 30 + Math.sin(i * 0.8 + snap.nowMs / 180) * 12;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
