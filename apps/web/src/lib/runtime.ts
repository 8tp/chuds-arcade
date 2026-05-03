import type {
  ArcadeRuntime,
  ArcadeSettings,
  ReplayPayload,
  RunResult,
  SubmitRunResponse,
} from "@chuds/arcade-sdk";
import { dailySeed, todayUtc } from "@chuds/arcade-sdk/seed";
import type { GuestProfile } from "./profile";

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? "/api";
const BUILD_ID = import.meta.env.PUBLIC_BUILD_ID ?? "dev";

const SETTINGS_KEY = "chuds.settings.v1";
const LOCAL_RUNS_KEY = "chuds.localRuns.v1";

const defaultSettings: ArcadeSettings = {
  reducedMotion: false,
  audioEnabled: true,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  inputLatencyOffsetMs: 0,
};

export function loadSettings(): ArcadeSettings {
  if (typeof localStorage === "undefined") return defaultSettings;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<ArcadeSettings>) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: ArcadeSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

type StartRunOptions = {
  player: GuestProfile;
  gameSlug: string;
  mode: string;
  rulesetVersion: string;
  daily?: boolean;
};

export type RunSession = ArcadeRuntime["run"];

export async function startRun(opts: StartRunOptions): Promise<RunSession> {
  const dailyDate = opts.daily ? todayUtc() : undefined;

  try {
    const res = await fetch(`${API_BASE}/runs/start`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        gameSlug: opts.gameSlug,
        mode: opts.mode,
        dailyDate,
      }),
    });
    if (res.ok) {
      const json = (await res.json()) as RunSession;
      return json;
    }
  } catch {
    // fall through to offline session
  }

  // Offline / pre-API fallback. Locally-issued, unsigned nonce.
  const seed = opts.daily
    ? dailySeed(opts.gameSlug, opts.mode, opts.rulesetVersion, dailyDate)
    : `local:${opts.gameSlug}:${opts.mode}:${opts.rulesetVersion}:${crypto.randomUUID()}`;
  return {
    runId: `local_${crypto.randomUUID()}`,
    gameSlug: opts.gameSlug,
    mode: opts.mode,
    seed,
    serverNonce: "local",
    startedAt: new Date().toISOString(),
    ...(dailyDate ? { dailyDate } : {}),
  };
}

function pushLocalRun(result: RunResult): void {
  if (typeof localStorage === "undefined") return;
  const raw = localStorage.getItem(LOCAL_RUNS_KEY);
  const list: RunResult[] = raw ? (JSON.parse(raw) as RunResult[]) : [];
  list.unshift(result);
  localStorage.setItem(LOCAL_RUNS_KEY, JSON.stringify(list.slice(0, 100)));
}

export function loadLocalRuns(): RunResult[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_RUNS_KEY);
  return raw ? (JSON.parse(raw) as RunResult[]) : [];
}

export function buildRuntime(player: GuestProfile, run: RunSession): ArcadeRuntime {
  return {
    player: { id: player.id, handle: player.handle, avatarSeed: player.avatarSeed },
    settings: loadSettings(),
    run,
    async submitRun(result: RunResult): Promise<SubmitRunResponse> {
      const payload = { ...result, serverNonce: run.serverNonce, clientBuildId: BUILD_ID };
      try {
        const res = await fetch(`${API_BASE}/runs/submit`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) return (await res.json()) as SubmitRunResponse;
      } catch {
        // offline
      }
      pushLocalRun(payload);
      return { accepted: true, verifiedLevel: "client" };
    },
    async saveReplay(replay: ReplayPayload): Promise<{ replayId: string }> {
      try {
        const res = await fetch(`${API_BASE}/replays`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(replay),
        });
        if (res.ok) return (await res.json()) as { replayId: string };
      } catch {
        // offline
      }
      return { replayId: `local_${crypto.randomUUID()}` };
    },
    async unlockAchievement(_achievementId: string): Promise<void> {
      // Achievements ride along with /runs/submit response. No-op for now.
    },
    openLeaderboard(): void {
      window.location.href = `/leaderboards?game=${run.gameSlug}&mode=${run.mode}`;
    },
    openProfile(): void {
      window.location.href = "/settings";
    },
    exitToArcade(): void {
      window.location.href = "/";
    },
  };
}
