import { TIMING } from "./constants";
import type { Clash, SamuraiAction } from "./types";

/** Pure: convert a press→release hold time into a SamuraiAction. */
export function holdToAction(holdMs: number | null): SamuraiAction {
  if (holdMs === null) return "danger";
  if (holdMs <= TIMING.feintMaxMs) return "feint";
  if (holdMs <= TIMING.strikeMaxMs) return "strike";
  if (holdMs <= TIMING.guardMaxMs) return "guard";
  return "danger";
}

/** Pure: resolve a clash from two actions. Symmetric truth table. */
export function resolveClash(
  player: SamuraiAction,
  bot: SamuraiAction,
  playerHoldMs: number | null,
): Clash {
  if (player === "danger" || bot === "danger") {
    return {
      player,
      bot,
      outcome:
        player === "danger" && bot === "danger" ? "draw" : player === "danger" ? "loss" : "win",
      perfectStrike: false,
      counter: false,
      falseDraw: false,
      nerveBreak: player === "danger",
    };
  }

  // Same action → draw, but flag false-draw on feint/feint and guard/guard.
  if (player === bot) {
    return {
      player,
      bot,
      outcome: "draw",
      perfectStrike: false,
      counter: false,
      falseDraw: player === "feint" || player === "guard",
      nerveBreak: false,
    };
  }

  // Strike vs guard → guard counters; the striker loses.
  if (player === "strike" && bot === "guard") {
    return {
      player,
      bot,
      outcome: "loss",
      perfectStrike: false,
      counter: false,
      falseDraw: false,
      nerveBreak: false,
    };
  }
  if (player === "guard" && bot === "strike") {
    return {
      player,
      bot,
      outcome: "win",
      perfectStrike: false,
      counter: true,
      falseDraw: false,
      nerveBreak: false,
    };
  }

  // Strike vs feint → strike wins. Perfect strike if release was at peak window.
  if (player === "strike" && bot === "feint") {
    const peak = playerHoldMs !== null && Math.abs(playerHoldMs - 380) <= 60;
    return {
      player,
      bot,
      outcome: "win",
      perfectStrike: peak,
      counter: false,
      falseDraw: false,
      nerveBreak: false,
    };
  }
  if (player === "feint" && bot === "strike") {
    return {
      player,
      bot,
      outcome: "loss",
      perfectStrike: false,
      counter: false,
      falseDraw: false,
      nerveBreak: false,
    };
  }

  // Feint vs guard → no contact, draw.
  if ((player === "feint" && bot === "guard") || (player === "guard" && bot === "feint")) {
    return {
      player,
      bot,
      outcome: "draw",
      perfectStrike: false,
      counter: false,
      falseDraw: true,
      nerveBreak: false,
    };
  }

  // Should be unreachable.
  return {
    player,
    bot,
    outcome: "draw",
    perfectStrike: false,
    counter: false,
    falseDraw: false,
    nerveBreak: false,
  };
}
