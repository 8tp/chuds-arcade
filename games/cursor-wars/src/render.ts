import { ARENA_SIZE, MATCH_MS } from "./constants";
import type { CursorSnapshot } from "./game";
import type { CursorActor, Vec2 } from "./types";

const STYLE_ID = "cursor-wars-style";

const STYLE = `
.cw-root { width: 100%; min-width: 0; display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; color: var(--color-fg, #090909); }
.cw-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); }
.cw-stat { padding: 0.45rem 0.7rem; border-right: 1px solid var(--color-border, #151515); display: flex; flex-direction: column; gap: 0.15rem; }
.cw-stat:last-child { border-right: none; }
.cw-stat .lbl { font-family: var(--font-mono, monospace); font-size: 0.6rem; text-transform: uppercase; color: var(--color-fg-muted, #565656); }
.cw-stat .val { font-family: var(--font-display, "Space Grotesk"), system-ui; font-weight: 900; font-size: 1.12rem; line-height: 1; }
.cw-stage { position: relative; min-height: 430px; border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); box-shadow: 4px 4px 0 var(--color-fg, #090909); overflow: hidden; }
.cw-canvas { display: block; width: 100%; height: 430px; background: var(--color-panel, #fffdf7); touch-action: none; cursor: crosshair; }
.cw-overlay { position: absolute; left: 1rem; right: 1rem; bottom: 1rem; display: flex; justify-content: space-between; gap: 1rem; pointer-events: none; align-items: end; }
.cw-callout { font-family: var(--font-display, "Space Grotesk"); font-weight: 900; font-size: clamp(1.4rem, 5vw, 2.8rem); line-height: 0.9; text-transform: uppercase; }
.cw-help { max-width: 18rem; text-align: right; font-family: var(--font-mono, monospace); font-size: 0.7rem; text-transform: uppercase; color: var(--color-fg-muted, #565656); }
.cw-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; }
.cw-btn { min-height: 42px; border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); font-family: var(--font-mono, monospace); font-size: 0.7rem; text-transform: uppercase; color: var(--color-fg, #090909); cursor: pointer; }
.cw-btn:active { background: var(--color-fg, #090909); color: var(--color-panel, #fffdf7); }
@media (max-width: 520px) {
  .cw-root { padding: 0.65rem; }
  .cw-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cw-stage { min-height: 340px; }
  .cw-canvas { height: 340px; }
  .cw-overlay { left: 0.65rem; right: 0.65rem; bottom: 0.65rem; }
  .cw-help { display: none; }
}
`;

export type CursorHandlers = {
  onTarget: (target: Vec2) => void;
  onDash: () => void;
};

export function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const el = doc.createElement("style");
  el.id = STYLE_ID;
  el.textContent = STYLE;
  doc.head.appendChild(el);
}

function statCell(label: string, value: string): string {
  return `<div class="cw-stat"><span class="lbl">${label}</span><span class="val">${value}</span></div>`;
}

export function shell(root: HTMLElement, handlers: CursorHandlers): HTMLCanvasElement {
  ensureStyles(root.ownerDocument);
  root.innerHTML = `
    <div class="cw-root">
      <div class="cw-bar" data-stats></div>
      <div class="cw-stage">
        <canvas class="cw-canvas" width="${ARENA_SIZE.width}" height="${ARENA_SIZE.height}" aria-label="Cursor Wars arena"></canvas>
        <div class="cw-overlay">
          <div class="cw-callout" data-callout>Collect pixels</div>
          <div class="cw-help">// mouse moves target · click/space dash</div>
        </div>
      </div>
      <div class="cw-actions">
        <button class="cw-btn" data-act="dash" type="button">dash</button>
        <button class="cw-btn" data-act="center" type="button">center target</button>
      </div>
    </div>`;
  const canvas = root.querySelector<HTMLCanvasElement>("canvas")!;
  const sendTarget = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    handlers.onTarget({
      x: ((clientX - rect.left) / rect.width) * ARENA_SIZE.width,
      y: ((clientY - rect.top) / rect.height) * ARENA_SIZE.height,
    });
  };
  canvas.addEventListener("mousemove", (event) => sendTarget(event.clientX, event.clientY));
  canvas.addEventListener("click", handlers.onDash);
  canvas.addEventListener("touchmove", (event) => {
    const touch = event.changedTouches[0];
    if (touch) sendTarget(touch.clientX, touch.clientY);
  });
  canvas.addEventListener("touchend", handlers.onDash);
  root
    .querySelector<HTMLButtonElement>('[data-act="dash"]')
    ?.addEventListener("click", handlers.onDash);
  root
    .querySelector<HTMLButtonElement>('[data-act="center"]')
    ?.addEventListener("click", () =>
      handlers.onTarget({ x: ARENA_SIZE.width / 2, y: ARENA_SIZE.height / 2 }),
    );
  return canvas;
}

export function render(root: HTMLElement, canvas: HTMLCanvasElement, snap: CursorSnapshot): void {
  const stats = root.querySelector<HTMLElement>("[data-stats]");
  if (stats) {
    stats.innerHTML = [
      statCell("// time", `${Math.max(0, Math.ceil((MATCH_MS - snap.elapsedMs) / 1000))}s`),
      statCell("// hearts", "■".repeat(snap.player.health) || "-"),
      statCell("// pixels", snap.metrics.pixelsCollected.toString()),
      statCell("// combo", snap.metrics.maxCombo.toString()),
      statCell("// score", snap.score.toLocaleString()),
    ].join("");
  }
  const callout = root.querySelector<HTMLElement>("[data-callout]");
  if (callout) {
    callout.textContent =
      snap.phase === "complete"
        ? "Arena clear"
        : snap.phase === "failed"
          ? "Cursor down"
          : "Collect pixels";
  }
  draw(canvas, snap);
}

function drawTrail(ctx: CanvasRenderingContext2D, actor: CursorActor): void {
  ctx.strokeStyle = actor.id === "player" ? "#090909" : "rgba(9,9,9,0.42)";
  ctx.lineWidth = actor.id === "player" ? 3 : 2;
  ctx.setLineDash(actor.id === "player" ? [] : [5, 6]);
  ctx.beginPath();
  actor.trail.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCursor(ctx: CanvasRenderingContext2D, actor: CursorActor): void {
  if (!actor.alive) return;
  ctx.save();
  ctx.translate(actor.position.x, actor.position.y);
  ctx.rotate(Math.atan2(actor.velocity.y, actor.velocity.x || 1) - Math.PI / 4);
  ctx.fillStyle = actor.id === "player" ? "#090909" : "#fffdf7";
  ctx.strokeStyle = "#090909";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(14, 18);
  ctx.lineTo(0, 10);
  ctx.lineTo(-14, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function draw(canvas: HTMLCanvasElement, snap: CursorSnapshot): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(9,9,9,0.28)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#090909";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  for (const hazard of snap.hazards) {
    if (snap.elapsedMs < hazard.activeAtMs) continue;
    ctx.strokeStyle = "#090909";
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(hazard.position.x, hazard.position.y, hazard.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (const pixel of snap.pixels) {
    ctx.fillStyle = "#fffdf7";
    ctx.strokeStyle = "#090909";
    ctx.lineWidth = 2;
    ctx.fillRect(pixel.position.x - 7, pixel.position.y - 7, 14, 14);
    ctx.strokeRect(pixel.position.x - 7, pixel.position.y - 7, 14, 14);
  }
  for (const bot of snap.bots) drawTrail(ctx, bot);
  drawTrail(ctx, snap.player);
  for (const bot of snap.bots) drawCursor(ctx, bot);
  drawCursor(ctx, snap.player);

  ctx.strokeStyle = "#090909";
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(snap.player.position.x, snap.player.position.y);
  ctx.lineTo(snap.player.target.x, snap.player.target.y);
  ctx.stroke();
  ctx.setLineDash([]);
}
