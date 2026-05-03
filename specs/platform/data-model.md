# Data Model

## Player

Guest-first. Account linking is a later feature.

```ts
type Player = {
  id: string;
  handle: string;
  avatarSeed: string;
  accountType: "guest" | "github" | "discord" | "email";
  createdAt: string;
  lastSeenAt: string;
  banned: boolean;
};
```

## Run

```ts
type Run = {
  id: string;
  playerId: string;
  gameSlug: string;
  mode: string;
  rulesetVersion: string;
  seed: string;
  score: number;
  durationMs: number;
  outcome: string;
  metrics: Record<string, unknown>;
  replayId?: string;
  verifiedLevel: "client" | "sanity" | "resim" | "server";
  createdAt: string;
};
```

## Replay

```ts
type Replay = {
  id: string;
  playerId: string;
  gameSlug: string;
  mode: string;
  seed: string;
  rulesetVersion: string;
  storageKey: string;
  durationMs: number;
  createdAt: string;
};
```

## Daily challenge

```ts
type DailyChallenge = {
  gameSlug: string;
  mode: string;
  date: string;
  seed: string;
  rulesetVersion: string;
  title: string;
  description: string;
  expiresAt: string;
};
```
