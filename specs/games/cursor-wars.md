# Cursor Wars Spec

## Pitch

A top-down arena where every player is a cursor. Collect pixels, cut trails, dash through danger, and survive.

## Visual direction

- Monochrome OS/grid arena.
- Cursor markers, simple dotted trails, square pixels, minimal popup hazards.
- It should read like a clean diagram/game board, not a chaotic neon effect scene.

Reference: `assets/mockups/cursor-wars.png`

## Core design rule

Do not use raw mouse position as the real player position.

```txt
Mouse position = target.
Cursor avatar = physics object that moves toward target with max speed.
```

This enables fairness, replayability, and anti-cheat.

## Core loop

```txt
Join arena
→ steer cursor toward target
→ collect pixel squares
→ avoid trails and popup hazards
→ dash strategically
→ score through survival, pickups, and eliminations
```

## Controls

```txt
Mouse move: set target
Click / Space: dash
1: shield
2: scramble
Touch drag: set target
Touch tap: dash
```

## Physics

```ts
type CursorPhysics = {
  position: Vec2;
  velocity: Vec2;
  target: Vec2;
  maxSpeed: number;
  acceleration: number;
  dashCooldownMs: number;
  dashSpeed: number;
  dashDurationMs: number;
};
```

## Modes

### Daily Bot Arena

Single-player daily challenge with deterministic bots. Build this first.

### Private Arena

Shareable room code, 2-8 players.

### Public FFA

Matchmaking. Later.

### King of the Cursor

Zone-control mode. Later.

## Bot types

### Pixel Goblin

Collects pixels and avoids combat.

### Trail Shark

Tries to cut off player movement.

### Center Camper

Controls the central high-value area.

### Dash Maniac

Uses dash aggressively and predictably.

## Scoring

```txt
score =
  pixelsCollected * 5
+ eliminations * 250
+ assists * 75
+ survivalSeconds * 10
- deaths * 150
```

Daily Bot Arena:

```txt
score =
  pixelsCollected * 5
+ botEliminations * 200
+ floor(survivalMs / 100)
+ maxCombo * 50
- damageTaken * 300
```

## Server-authoritative online model

Client sends input intent:

```ts
type CursorClientInput = {
  tick: number;
  targetX: number;
  targetY: number;
  dashPressed: boolean;
  itemPressed?: 1 | 2;
};
```

Server sends snapshots:

```ts
type CursorServerSnapshot = {
  tick: number;
  players: CursorPlayerState[];
  pixels: PixelState[];
  hazards: HazardState[];
};
```

Recommended tick rates:

```txt
Simulation: 30 ticks/sec
Snapshot send: 15/sec
Client render: requestAnimationFrame
```

## MVP tasks

- Implement bot arena first.
- Implement cursor physics.
- Implement trail buffers and collision.
- Implement pixel pickups.
- Implement Dash ability.
- Implement deterministic bot behaviors.
- Implement score and metrics.
- Add tests for movement constraints and collisions.
- Add Durable Object multiplayer only after bot arena is fun.
