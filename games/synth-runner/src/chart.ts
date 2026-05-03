import { createRng } from "@chuds/deterministic-rng";
import { SONG_BEATS } from "./constants";
import type { ChartEvent, ChartEventType, Lane, Scale, SongSeed } from "./types";

const KEYS = ["C", "D", "Eb", "F", "G", "A", "Bb"] as const;
const SCALES: Scale[] = ["minor", "major", "pentatonic", "dorian"];
const OBSTACLES: ChartEventType[] = ["jump", "slide", "shift"];

function laneFrom(n: number): Lane {
  return Math.max(0, Math.min(2, n)) as Lane;
}

export function generateSongSeed(seed: string): SongSeed {
  const rng = createRng(`song:${seed}`);
  const bpm = 104 + Math.floor(rng() * 36);
  return {
    seed,
    bpm,
    key: KEYS[Math.floor(rng() * KEYS.length)]!,
    scale: SCALES[Math.floor(rng() * SCALES.length)]!,
    intensity: 0.45 + rng() * 0.45,
    swing: Math.round(rng() * 12) / 100,
    lengthBeats: SONG_BEATS,
  };
}

export function generateChart(song: SongSeed): ChartEvent[] {
  const rng = createRng(`chart:${song.seed}:${song.bpm}:${song.key}:${song.scale}`);
  const events: ChartEvent[] = [];
  let lane: Lane = 1;

  for (let beat = 2; beat <= song.lengthBeats; beat += 1) {
    const phraseBeat = beat % 8;
    const shouldPlace = phraseBeat === 0 || phraseBeat === 4 || rng() < song.intensity;
    if (!shouldPlace) continue;

    const roll = rng();
    let type: ChartEventType;
    if (roll < 0.18) type = "gem";
    else if (roll < 0.27) type = "gap";
    else type = OBSTACLES[Math.floor(rng() * OBSTACLES.length)]!;

    if (type === "shift") {
      const direction = lane === 0 ? 1 : lane === 2 ? -1 : rng() < 0.5 ? -1 : 1;
      lane = laneFrom(lane + direction);
    }

    events.push({
      id: `b${beat}_${events.length}`,
      beat,
      lane,
      type,
      ...(type === "slide" && rng() < 0.25 ? { durationBeats: 2 } : {}),
    });
  }

  return events;
}

export function beatToMs(song: SongSeed, beat: number): number {
  const base = (60_000 / song.bpm) * beat;
  const swingOffset = beat % 2 === 1 ? (60_000 / song.bpm) * song.swing : 0;
  return Math.round(base + swingOffset);
}
