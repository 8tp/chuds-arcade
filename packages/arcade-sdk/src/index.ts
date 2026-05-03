export type LeaderboardSort = "score_desc" | "time_asc" | "rating_desc" | "survival_desc";

export type GameModeManifest = {
  id: string;
  label: string;
  description: string;
  ranked: boolean;
  dailyEligible: boolean;
  multiplayer: boolean;
  leaderboardSort: LeaderboardSort;
  /** Verification level required to count toward ranked boards. */
  requiredVerification?: "client" | "sanity" | "resim" | "server";
};

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

export type ArcadeSettings = {
  reducedMotion: boolean;
  audioEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  inputLatencyOffsetMs: number;
};

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
  /** Echoed back so the worker can re-verify the run nonce on submit. */
  serverNonce?: string;
};

export type SubmitRunResponse = {
  accepted: boolean;
  verifiedLevel: "client" | "sanity" | "resim" | "server";
  rank?: number;
  personalBest?: boolean;
  unlockedAchievements?: string[];
};

export type ReplayEvent<TData = unknown> = {
  t: number;
  type: string;
  data?: TData;
};

export type ReplayPayload = {
  runId: string;
  gameSlug: string;
  mode: string;
  rulesetVersion: string;
  seed: string;
  startedAt: number;
  durationMs: number;
  events: ReplayEvent[];
};

export type LeaderboardParams = {
  gameSlug?: string;
  mode?: string;
  scope?: "daily" | "weekly" | "all-time" | "seeded";
};

export type ArcadeRuntime = {
  player: { id: string; handle: string; avatarSeed: string };
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

export type GameInstance = {
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
};

export type GameModule = {
  manifest: GameManifest;
  mount(root: HTMLElement, runtime: ArcadeRuntime): GameInstance;
};

export * from "./seed";
export * from "./nonce";
export * from "./schemas";
