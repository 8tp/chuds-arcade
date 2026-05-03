export type Lane = 0 | 1 | 2;
export type Scale = "minor" | "major" | "pentatonic" | "dorian";
export type ChartEventType = "jump" | "slide" | "shift" | "gem" | "gap" | "safe";
export type Judgment = "perfect" | "great" | "okay" | "miss";
export type RunnerAction = "left" | "right" | "jump" | "slide";

export type SongSeed = {
  seed: string;
  bpm: number;
  key: string;
  scale: Scale;
  intensity: number;
  swing: number;
  lengthBeats: number;
};

export type ChartEvent = {
  id: string;
  beat: number;
  lane: Lane;
  type: ChartEventType;
  durationBeats?: number;
};

export type SynthMetrics = {
  bpm: number;
  distanceMeters: number;
  perfects: number;
  greats: number;
  okays: number;
  misses: number;
  maxCombo: number;
  gems: number;
  accuracyPercent: number;
  latencyOffsetMs: number;
};

export type HitResult = {
  eventId: string;
  judgment: Judgment;
  deltaMs: number;
};
