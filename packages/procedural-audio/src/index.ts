export type SongSeed = {
  seed: string;
  bpm: number;
  key: string;
  scale: "minor" | "major" | "pentatonic" | "dorian";
  intensity: number;
  swing: number;
  lengthBeats: number;
};

export type BeatEvent = {
  beat: number;
  lane: 0 | 1 | 2;
  type: "jump" | "slide" | "shift" | "gem" | "gap" | "safe";
  durationBeats?: number;
};
