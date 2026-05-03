export const DUNGEON_LENGTH = 10;
export const MINI_BOSS_ROOM = 5;
export const FINAL_BOSS_ROOM = 10;

// Bumped from 3 → 5: playtest showed Average archetype died in room 1 of 50/50 runs at 3 HP.
export const STARTING_HEALTH = 5;
export const ROOM_TIME_LIMIT_MS = 18_000;
export const BOSS_TIME_LIMIT_MS = 26_000;

export const PERFECT_ROOM_HUMANITY = 80;
export const ROOM_CLEAR_HUMANITY = 40;

export const SCORING = {
  perRoomCleared: 500,
  perBossDefeated: 1500,
  perCombo: 100,
  perHealthRemaining: 400,
  perMistake: 250,
  timeDivisor: 50,
} as const;

export const TILE_GRID = { rows: 4, cols: 4 } as const;
