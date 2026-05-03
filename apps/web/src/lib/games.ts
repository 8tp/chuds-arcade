import type { GameManifest, GameModule } from "@chuds/arcade-sdk";

import { manifest as captchaDungeon } from "@chuds/game-captcha-dungeon/manifest";
import { manifest as cursorWars } from "@chuds/game-cursor-wars/manifest";
import { manifest as oneButtonSamurai } from "@chuds/game-one-button-samurai/manifest";
import { manifest as synthRunner } from "@chuds/game-synth-runner/manifest";

export const gameManifests: GameManifest[] = [
  captchaDungeon,
  oneButtonSamurai,
  synthRunner,
  cursorWars,
];

export function getManifest(slug: string): GameManifest | undefined {
  return gameManifests.find((m) => m.slug === slug);
}

type GameLoader = () => Promise<GameModule>;

const loaders: Record<string, GameLoader> = {
  "captcha-dungeon": () => import("@chuds/game-captcha-dungeon").then((m) => m.default ?? m.game),
  "one-button-samurai": () =>
    import("@chuds/game-one-button-samurai").then((m) => m.default ?? m.game),
  "synth-runner": () => import("@chuds/game-synth-runner").then((m) => m.default ?? m.game),
  "cursor-wars": () => import("@chuds/game-cursor-wars").then((m) => m.default ?? m.game),
};

export async function loadGame(slug: string): Promise<GameModule | null> {
  const loader = loaders[slug];
  if (!loader) return null;
  return loader();
}
