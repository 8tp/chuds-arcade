import type { GameManifest } from "@chuds/arcade-sdk";

export const manifest: GameManifest = {
  slug: "synth-runner",
  title: "Synth Runner",
  tagline: "Run the grid. Hit the beat.",
  description: "See specs/games/synth-runner.md.",
  version: "0.1.0",
  rulesetVersion: "synth-rules-v1",
  thumbnail: "/mockups/synth-runner.png",
  tags: ["rhythm", "runner", "daily"],
  estimatedSessionSeconds: { min: 60, max: 360 },
  supports: {
    daily: true,
    leaderboard: true,
    replay: true,
    ghost: false,
    multiplayer: false,
    touch: true,
    gamepad: false,
  },
  modes: [
    {
      id: "daily-song",
      label: "Daily Song",
      description: "Primary daily mode for Synth Runner.",
      ranked: true,
      dailyEligible: true,
      multiplayer: false,
      leaderboardSort: "score_desc",
    },
  ],
};
