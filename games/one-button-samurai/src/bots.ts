import { holdToAction } from "./clash";
import type { RoundLog, SamuraiAction } from "./types";

type RNG = () => number;

export type BotArchetype = {
  id: string;
  label: string;
  description: string;
  /**
   * Decide a release time for this round, given the seeded RNG and the
   * full match history so far. Pure — same inputs give same output.
   */
  pickReleaseMs(rng: () => number, history: RoundLog[]): number;
};

function mid(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export const BAMBOO_ROOKIE: BotArchetype = {
  id: "bamboo-rookie",
  label: "Bamboo Rookie",
  description: "Slow strikes. Long recovery. Falls for feints.",
  pickReleaseMs(rng) {
    // Rookie tends to release deep in strike or even into guard.
    return mid(rng, 520, 900);
  },
};

export const IRON_MONK: BotArchetype = {
  id: "iron-monk",
  label: "Iron Monk",
  description: "Guards often, but baits with feints. Weak to delayed release.",
  pickReleaseMs(rng) {
    // Playtest: monk's pure-guard distribution made strike-at-peak useless. Add 15% feint.
    const r = rng();
    if (r < 0.15) return mid(rng, 60, 130); // feint bait
    if (r < 0.85) return mid(rng, 720, 1300); // guard
    return mid(rng, 200, 500); // mid-strike
  },
};

export const RED_CRANE: BotArchetype = {
  id: "red-crane",
  label: "Red Crane",
  description: "Fast striker. Rarely guards but mixes one in to punish guard-campers.",
  pickReleaseMs(rng) {
    // Playtest: 100% loss vs guarders. Add 12% guard mix.
    const r = rng();
    if (r < 0.12) return mid(rng, 700, 1000); // counter-guard
    return mid(rng, 180, 380); // fast strike
  },
};

export const DRUNK_RONIN: BotArchetype = {
  id: "drunk-ronin",
  label: "Drunk Ronin",
  description: "Chaotic timing. Occasionally overholds. Feints often.",
  pickReleaseMs(rng) {
    // Playtest: 22% danger rate made him too easy. Reduced to ~10%.
    const r = rng();
    if (r < 0.22) return mid(rng, 60, 130); // feint
    if (r < 0.6) return mid(rng, 200, 600); // strike
    if (r < 0.9) return mid(rng, 700, 1300); // guard
    return mid(rng, 1500, 2200); // overhold (danger)
  },
};

/** Mirror Ghost adapts to the player's recent release timings. */
export const MIRROR_GHOST: BotArchetype = {
  id: "mirror-ghost",
  label: "Mirror Ghost",
  description: "Adapts to repeated player release timings, but counter-feints the greedy.",
  pickReleaseMs(rng, history) {
    // Playtest: pure mimicry let guard-spam farm the ghost. 15% feint to punish guards.
    if (rng() < 0.15) return mid(rng, 60, 130);
    const samples = history
      .map((h) => h.playerHoldMs)
      .filter((x): x is number => typeof x === "number");
    if (samples.length === 0) return mid(rng, 200, 600);
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const target = Math.max(140, Math.floor(avg - 40));
    const jitter = mid(rng, -50, 50);
    return Math.max(60, Math.min(2200, target + jitter));
  },
};

export const BOTS: Record<string, BotArchetype> = {
  "bamboo-rookie": BAMBOO_ROOKIE,
  "iron-monk": IRON_MONK,
  "red-crane": RED_CRANE,
  "drunk-ronin": DRUNK_RONIN,
  "mirror-ghost": MIRROR_GHOST,
};

export function botAction(holdMs: number): SamuraiAction {
  return holdToAction(holdMs);
}

export type { RNG };
