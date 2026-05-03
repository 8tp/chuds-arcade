// Minimal DOM renderer for Captcha Dungeon. Monochrome by design — no
// images required. Renderer is a pure function from snapshot → DOM diff.

import type { CaptchaDungeon, GameSnapshot } from "./game";
import type { Room } from "./types";

const STYLE_ID = "captcha-dungeon-style";

const STYLE = `
.cdg-root { width: 100%; min-width: 0; display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; font-family: var(--font-sans, system-ui); color: var(--color-fg, #090909); }
.cdg-bar { min-width: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); }
.cdg-stat { padding: 0.45rem 0.7rem; border-right: 1px solid var(--color-border, #151515); display: flex; flex-direction: column; gap: 0.15rem; }
.cdg-stat:last-child { border-right: none; }
.cdg-stat .lbl { font-family: var(--font-mono, monospace); font-size: 0.6rem; text-transform: uppercase; color: var(--color-fg-muted, #565656); }
.cdg-stat .val { font-family: var(--font-display, "Space Grotesk"), system-ui; font-weight: 900; font-size: 1.2rem; line-height: 1; }
.cdg-prompt { font-family: var(--font-display, "Space Grotesk"); font-weight: 900; font-size: clamp(1.3rem, 3vw, 2rem); line-height: 1; margin: 0.35rem 0; }
.cdg-sub { font-family: var(--font-mono, monospace); font-size: 0.8rem; color: var(--color-fg-muted, #565656); }
.cdg-grid { min-width: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.5rem; }
.cdg-tile { min-width: 0; position: relative; aspect-ratio: 1 / 1; border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); display: flex; align-items: end; justify-content: flex-start; padding: 0.6rem; font-family: var(--font-mono, monospace); font-size: 0.75rem; line-height: 1.1; overflow-wrap: anywhere; cursor: pointer; user-select: none; transition: transform 120ms; }
.cdg-tile.is-selected { background: var(--color-fg, #090909); color: var(--color-panel, #fffdf7); }
.cdg-tile.is-focus { outline: 2px solid var(--color-fg, #090909); outline-offset: 2px; }
.cdg-tile:hover { transform: translate(-2px, -2px); box-shadow: 4px 4px 0 var(--color-fg, #090909); }
.cdg-tile .check { position: absolute; top: 0.35rem; right: 0.5rem; font-family: var(--font-display, system-ui); font-weight: 900; }
.cdg-tile.is-selected .check::before { content: "✓"; }
.cdg-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.cdg-btn { font-family: var(--font-mono, monospace); font-size: 0.75rem; text-transform: uppercase; padding: 0.55rem 0.85rem; border: 1px solid var(--color-border, #151515); background: var(--color-panel, #fffdf7); cursor: pointer; }
.cdg-btn-primary { background: var(--color-fg, #090909); color: var(--color-panel, #fffdf7); }
.cdg-progress { display: flex; flex-wrap: wrap; gap: 0.25rem; align-items: center; margin-top: 0.5rem; font-family: var(--font-mono, monospace); font-size: 0.65rem; }
.cdg-progress .step { width: 18px; height: 18px; border: 1px solid var(--color-border, #151515); display: grid; place-items: center; font-size: 9px; }
.cdg-progress .step.boss { background: var(--color-fg, #090909); color: var(--color-panel, #fffdf7); }
.cdg-progress .step.done { background: var(--color-fg, #090909); color: var(--color-panel, #fffdf7); }
.cdg-end { text-align: center; padding: 1rem; }
.cdg-end h2 { font-family: var(--font-display); font-weight: 900; font-size: clamp(2rem, 5vw, 3.5rem); margin: 0; }
.cdg-end p { font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted, #565656); }
@media (max-width: 420px) {
  .cdg-root { padding: 0.65rem; }
  .cdg-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cdg-stat { padding: 0.4rem 0.5rem; }
  .cdg-grid { gap: 0.3rem; }
  .cdg-tile { padding: 0.42rem; font-size: 0.64rem; }
  .cdg-btn { min-height: 40px; }
}
`;

export type RenderHandlers = {
  onTileClick: (tileId: string) => void;
  onVerify: () => void;
  onSkip: () => void;
};

export function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const el = doc.createElement("style");
  el.id = STYLE_ID;
  el.textContent = STYLE;
  doc.head.appendChild(el);
}

function statCell(label: string, value: string): string {
  return `<div class="cdg-stat"><span class="lbl">${label}</span><span class="val">${value}</span></div>`;
}

function progressStrip(rooms: readonly Room[], currentIndex: number): string {
  const cells = rooms
    .map((r, i) => {
      const cls = i < currentIndex ? "step done" : r.isBoss ? "step boss" : "step";
      return `<span class="${cls}">${r.isBoss ? "B" : i + 1}</span>`;
    })
    .join("");
  return `<div class="cdg-progress">// dungeon &nbsp; ${cells}</div>`;
}

export function render(
  root: HTMLElement,
  game: CaptchaDungeon,
  snap: GameSnapshot,
  focusIndex: number,
  handlers: RenderHandlers,
): void {
  ensureStyles(root.ownerDocument);

  if (snap.status !== "playing") {
    root.innerHTML = `
      <div class="cdg-root">
        <div class="cdg-end">
          <h2>${snap.status === "victory" ? "Verified." : "You were a skeleton."}</h2>
          <p>// rooms ${snap.roomIndex + (snap.status === "victory" ? 1 : 0)}/${snap.totalRooms} · combo ${snap.maxCombo} · score ${snap.score.toLocaleString()}</p>
        </div>
      </div>`;
    return;
  }

  const room = snap.currentRoom!;
  const puzzle = room.puzzle;

  const tiles = puzzle.tiles
    .map((tile, i) => {
      const sel = snap.selectedTileIds.includes(tile.id) ? "is-selected" : "";
      const focus = i === focusIndex ? "is-focus" : "";
      return `<button class="cdg-tile ${sel} ${focus}" data-id="${tile.id}" type="button">
        ${tile.label}
        <span class="check"></span>
      </button>`;
    })
    .join("");

  root.innerHTML = `
    <div class="cdg-root">
      <div class="cdg-bar">
        ${statCell("// room", `${room.index}/${snap.totalRooms}${room.isBoss ? " · BOSS" : ""}`)}
        ${statCell("// hearts", "♥".repeat(snap.health) || "—")}
        ${statCell("// timer", `${Math.ceil(snap.roomRemainingMs / 1000)}s`)}
        ${statCell("// humanity", snap.humanity.toString())}
        ${statCell("// combo", snap.combo.toString())}
        ${statCell("// score", snap.score.toLocaleString())}
      </div>

      <div>
        <p class="cdg-sub">// daily dungeon · room ${String(room.index).padStart(2, "0")}</p>
        <h2 class="cdg-prompt">${puzzle.prompt}</h2>
      </div>

      <div class="cdg-grid">${tiles}</div>

      <div class="cdg-actions">
        <button class="cdg-btn cdg-btn-primary" data-act="verify" type="button">verify →</button>
        <button class="cdg-btn" data-act="skip" type="button">skip room</button>
      </div>

      ${progressStrip(game.rooms(), snap.roomIndex)}
    </div>
  `;

  // Wire handlers (event delegation).
  for (const btn of Array.from(root.querySelectorAll<HTMLButtonElement>(".cdg-tile"))) {
    btn.addEventListener("click", () => handlers.onTileClick(btn.dataset.id!));
  }
  root
    .querySelector<HTMLButtonElement>('[data-act="verify"]')
    ?.addEventListener("click", handlers.onVerify);
  root
    .querySelector<HTMLButtonElement>('[data-act="skip"]')
    ?.addEventListener("click", handlers.onSkip);
}
