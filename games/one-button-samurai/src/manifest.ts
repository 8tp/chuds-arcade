import type { GameManifest } from "@chuds/arcade-sdk";

export const manifest: GameManifest = {
  slug: "one-button-samurai",
  title: "One Button Samurai",
  tagline: "One button. One strike. No second chance.",
  description: "See specs/games/one-button-samurai.md.",
  version: "0.1.0",
  rulesetVersion: "obs-rules-v1",
  thumbnail: "/mockups/one-button-samurai.png",
  tags: ["action", "timing", "daily"],
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
      id: "daily-dojo",
      label: "Daily Dojo",
      description: "Primary daily mode for One Button Samurai.",
      ranked: true,
      dailyEligible: true,
      multiplayer: false,
      leaderboardSort: "score_desc",
    },
  ],
};
