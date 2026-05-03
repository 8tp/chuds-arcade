import type { GameManifest } from "@chuds/arcade-sdk";

export const manifest: GameManifest = {
  slug: "captcha-dungeon",
  title: "Captcha Dungeon",
  tagline: "Prove you are not a skeleton.",
  description: "See specs/games/captcha-dungeon.md.",
  version: "0.1.0",
  rulesetVersion: "captcha-rules-v1",
  thumbnail: "/mockups/captcha-dungeon.png",
  tags: ["puzzle", "roguelite", "daily"],
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
      id: "daily-dungeon",
      label: "Daily Dungeon",
      description: "Primary daily mode for Captcha Dungeon.",
      ranked: true,
      dailyEligible: true,
      multiplayer: false,
      leaderboardSort: "score_desc",
    },
  ],
};
