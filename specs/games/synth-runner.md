# Synth Runner Spec

## Pitch

A minimal three-lane rhythm runner where the track is generated from a deterministic song seed.

## Visual direction

- Black-and-white perspective grid.
- Simple runner silhouette from behind.
- Rectangular beat tiles, outlined collectibles, simple waveform strip.
- No neon, no glow, no synthwave color palette.

Reference: `assets/mockups/synth-runner.png`

## Core loop

```txt
Generate song seed
→ generate chart from beat grid
→ player auto-runs
→ player shifts lanes / jumps / slides
→ timing judgments build combo
→ score submits at song end or failure
```

## Controls

```txt
A / Left Arrow: shift left
D / Right Arrow: shift right
Space / Up Arrow: jump
Shift / Down Arrow: slide
Touch: swipe left/right/up/down
```

## Song seed

```ts
type SongSeed = {
  seed: string;
  bpm: number;
  key: string;
  scale: "minor" | "major" | "pentatonic" | "dorian";
  intensity: number;
  swing: number;
  lengthBeats: number;
};
```

## Chart event

```ts
type ChartEvent = {
  beat: number;
  lane: 0 | 1 | 2;
  type: "jump" | "slide" | "shift" | "gem" | "gap" | "safe";
  durationBeats?: number;
};
```

## Timing windows

| Judgment | Window |
|---|---:|
| Perfect | ±45ms |
| Great | ±90ms |
| Okay | ±140ms |
| Miss | >140ms |

Add latency calibration before serious leaderboard work.

## Modes

### Daily Song

Same track for everyone. Leaderboard enabled.

### Endless Gridline

Endless chart. Difficulty increases every phrase.

### Seeded Track

Shareable seed. No global leaderboard unless promoted to daily.

## Scoring

```txt
score =
  perfects * 150
+ greats * 100
+ okays * 50
+ gems * 25
+ maxCombo * 10
+ distanceMeters
- misses * 200
```

Combo multiplier:

```txt
25 combo  -> 1.25x
50 combo  -> 1.5x
100 combo -> 2x
```

## Metrics

```ts
type SynthRunnerMetrics = {
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
```

## Audio MVP

- Procedural click/kick/snare-like sounds using Web Audio oscillators/noise.
- No external audio assets.
- Audio can be disabled.
- Gameplay must remain readable without audio.

## MVP tasks

- Implement seeded chart generator.
- Implement lane runner simulation.
- Implement timing judgment function.
- Implement simple Canvas renderer.
- Implement Web Audio metronome/loop.
- Implement Daily Song scoring and leaderboard submission.
- Add tests for chart determinism and scoring.
