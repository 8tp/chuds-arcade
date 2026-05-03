# Arcade Runtime SDK Spec

## Goal

Every game should plug into the arcade shell using the same runtime interface.

## Game manifest

```ts
export type GameManifest = {
  slug: string;
  title: string;
  shortTitle?: string;
  tagline: string;
  description: string;
  version: string;
  rulesetVersion: string;
  thumbnail: string;
  tags: string[];
  estimatedSessionSeconds: { min: number; max: number };
  supports: {
    daily: boolean;
    leaderboard: boolean;
    replay: boolean;
    ghost: boolean;
    multiplayer: boolean;
    touch: boolean;
    gamepad: boolean;
  };
  modes: GameModeManifest[];
};

export type GameModeManifest = {
  id: string;
  label: string;
  description: string;
  ranked: boolean;
  dailyEligible: boolean;
  multiplayer: boolean;
  leaderboardSort: "score_desc" | "time_asc" | "rating_desc" | "survival_desc";
};
```

## Runtime contract

```ts
export type ArcadeRuntime = {
  player: {
    id: string;
    handle: string;
    avatarSeed: string;
  };
  settings: ArcadeSettings;
  run: {
    runId: string;
    gameSlug: string;
    mode: string;
    seed: string;
    dailyDate?: string;
    serverNonce: string;
    startedAt: string;
  };
  submitRun(result: RunResult): Promise<SubmitRunResponse>;
  saveReplay(replay: ReplayPayload): Promise<{ replayId: string }>;
  unlockAchievement(achievementId: string): Promise<void>;
  openLeaderboard(params?: LeaderboardParams): void;
  openProfile(): void;
  exitToArcade(): void;
};
```

## Game instance

```ts
export type GameModule = {
  manifest: GameManifest;
  mount(root: HTMLElement, runtime: ArcadeRuntime): GameInstance;
};

export type GameInstance = {
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
};
```

## Run result

```ts
export type RunResult = {
  runId: string;
  gameSlug: string;
  mode: string;
  rulesetVersion: string;
  seed: string;
  score: number;
  durationMs: number;
  outcome: "win" | "loss" | "draw" | "complete" | "failed";
  metrics: Record<string, number | string | boolean>;
  replayId?: string;
  inputHash?: string;
  clientBuildId: string;
};
```

## Acceptance criteria

- Game code never directly writes leaderboard state.
- Game code never assumes auth exists.
- Game code receives run seed and player data from the shell.
- Game code submits normalized results through `submitRun`.
