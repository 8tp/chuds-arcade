import { createRng } from "@chuds/deterministic-rng";
import {
  BOSS_TIME_LIMIT_MS,
  DUNGEON_LENGTH,
  FINAL_BOSS_ROOM,
  MINI_BOSS_ROOM,
  ROOM_TIME_LIMIT_MS,
} from "./constants";
import { pickTemplate } from "./templates";
import type { Dungeon, Room } from "./types";

export function generateDungeon(seed: string): Dungeon {
  const rng = createRng(seed);
  const rooms: Room[] = [];

  for (let i = 1; i <= DUNGEON_LENGTH; i++) {
    const isBoss = i === MINI_BOSS_ROOM || i === FINAL_BOSS_ROOM;
    const difficulty = Math.min(5, 1 + Math.floor(i / 2));
    const maxTemplateDifficulty = i === 1 ? 1 : difficulty + 1;
    const template = pickTemplate(rng, difficulty, isBoss, maxTemplateDifficulty);
    const puzzle = template.generate(rng, difficulty);
    puzzle.timeLimitMs = isBoss ? BOSS_TIME_LIMIT_MS : ROOM_TIME_LIMIT_MS;
    rooms.push({
      index: i,
      isBoss,
      templateId: template.id,
      difficulty,
      puzzle,
    });
  }
  return { seed, rooms };
}
