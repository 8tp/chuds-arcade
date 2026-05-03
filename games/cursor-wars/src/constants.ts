export const ARENA_SIZE = { width: 960, height: 520 } as const;
export const TICK_MS = 1000 / 30;
export const MATCH_MS = 45_000;
export const PLAYER_RADIUS = 12;
export const PIXEL_SIZE = 14;
export const STARTING_HEALTH = 5;
export const PLAYER_PHYSICS = {
  maxSpeed: 260,
  acceleration: 10,
  dashCooldownMs: 900,
  dashSpeed: 620,
  dashDurationMs: 130,
} as const;
export const SCORING = {
  pixel: 5,
  botElimination: 200,
  survivalDivisor: 100,
  maxCombo: 50,
  damageTaken: 300,
} as const;
