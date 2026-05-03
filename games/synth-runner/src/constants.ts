export const LANES = 3;
export const SONG_BEATS = 32;
export const STARTING_HEALTH = 6;
export const LEAD_IN_MS = 1200;
export const HIT_WINDOWS_MS = {
  perfect: 45,
  great: 90,
  okay: 140,
} as const;
export const SCORING = {
  perfect: 150,
  great: 100,
  okay: 50,
  gem: 25,
  maxCombo: 10,
  miss: 200,
} as const;
