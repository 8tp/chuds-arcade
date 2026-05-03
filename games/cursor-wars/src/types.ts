export type Vec2 = { x: number; y: number };
export type CursorActor = {
  id: string;
  label: string;
  position: Vec2;
  velocity: Vec2;
  target: Vec2;
  health: number;
  alive: boolean;
  dashCooldownMs: number;
  dashRemainingMs: number;
  trail: Vec2[];
};
export type Pixel = { id: string; position: Vec2; value: number };
export type Hazard = { id: string; position: Vec2; radius: number; activeAtMs: number };
export type CursorMetrics = {
  pixelsCollected: number;
  botEliminations: number;
  survivalMs: number;
  maxCombo: number;
  damageTaken: number;
};
