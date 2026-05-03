import type { GameManifest } from "@chuds/arcade-sdk";

export const manifest: GameManifest = {
  slug: "cursor-wars",
  title: "Cursor Wars",
  tagline: "Your mouse has entered the arena.",
  description: "See specs/games/cursor-wars.md.",
  version: "0.1.0",
  rulesetVersion: "cursor-rules-v1",
  thumbnail: "/mockups/cursor-wars.png",
  tags: ["arena", "multiplayer", "daily"],
  estimatedSessionSeconds: { min: 60, max: 360 },
  supports: {
    daily: true,
    leaderboard: true,
    replay: true,
    ghost: false,
    multiplayer: true,
    touch: true,
    gamepad: false,
  },
  modes: [
    {
      id: "daily-bot-arena",
      label: "Daily Bot Arena",
      description: "Primary daily mode for Cursor Wars.",
      ranked: true,
      dailyEligible: true,
      multiplayer: true,
      leaderboardSort: "score_desc",
    },
  ],
};
