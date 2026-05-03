# One Button Samurai Spec

## Pitch

A minimalist timing duel. One input controls feint, strike, guard, counter, and failure.

```txt
Press. Hold. Release. Do not flinch.
```

## Visual direction

- Black-and-white duel silhouettes.
- Sparse battlefield, grass line, ink splatter, restrained motion lines.
- No colored slash effects.
- UI should be mostly empty space and a clear timing bar.

Reference: `assets/mockups/one-button-samurai.png`

## Core loop

```txt
Round starts
→ both fighters idle
→ opponent timing behavior begins
→ player presses/holds/releases
→ clash resolves
→ round result displayed
→ next round or match end
```

## Controls

```txt
Keyboard: Space
Mouse: left button
Touch: press and hold screen
```

## Input windows

Default timing from press start:

| Window | Time | Result |
|---|---:|---|
| Feint | 0-140ms | bait / fake draw |
| Strike | 140-650ms | main attack |
| Guard | 650-1400ms | defensive stance |
| Danger | >1400ms | nerve break / punishable |

These should be constants per ruleset and adjustable by opponent modifiers.

## Player states

```ts
type SamuraiState =
  | "idle"
  | "drawing"
  | "feinting"
  | "striking"
  | "guarding"
  | "countering"
  | "recovering"
  | "stunned"
  | "defeated";
```

## Bot archetypes

### Bamboo Rookie

- Slow strikes.
- Long recovery.
- Falls for feints.

### Iron Monk

- Guards often.
- Counters greedy strikes.
- Weak to delayed release.

### Red Crane

- Fast striker.
- Rarely guards.
- Punishes hesitation.

### Drunk Ronin

- Chaotic timing.
- Occasionally overholds.
- Feints often.

### Mirror Ghost

- Adapts to repeated player release timings.

## Modes

### Dojo Practice

Unranked bot practice with visible timing windows.

### Daily Dojo

Fixed seed, fixed opponent ladder, leaderboard enabled.

### Survival Ronin

Endless bot ladder. Difficulty increases after each win.

### Local Duel

Two players on one device. Not ranked.

## Scoring

```txt
score =
  wins * 1000
+ perfectStrikes * 300
+ counters * 250
+ cleanRounds * 200
- falseDraws * 150
- nerveBreaks * 300
- floor(totalTimeMs / 25)
```

Tie breakers:

1. More wins.
2. Fewer mistakes.
3. Faster time.
4. Earlier submission.

## Metrics

```ts
type SamuraiMetrics = {
  wins: number;
  losses: number;
  perfectStrikes: number;
  counters: number;
  feints: number;
  falseDraws: number;
  nerveBreaks: number;
  cleanRounds: number;
  averageReleaseMs: number;
  totalTimeMs: number;
};
```

## Replay events

```ts
type SamuraiReplayEvent =
  | { t: number; type: "round_start"; round: number; opponent: string }
  | { t: number; type: "press" }
  | { t: number; type: "release" }
  | { t: number; type: "round_end"; outcome: "win" | "loss" | "draw" };
```

## MVP tasks

- Implement timing bar component.
- Implement pure `resolveClash(playerAction, botAction)`.
- Implement five bot archetypes.
- Implement Daily Dojo ladder.
- Implement scoring and metrics.
- Implement monochrome Canvas renderer.
- Add Vitest coverage for input windows and scoring.
