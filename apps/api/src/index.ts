import type { Env } from "./env";
import {
  makeHandle,
  newPlayerId,
  readGuestCookie,
  setGuestCookieHeader,
  signGuestId,
  verifyGuestCookie,
} from "./lib/cookie";
import { json, preflight, requireOrigin } from "./lib/cors";
import { getLeaderboard } from "./routes/leaderboards";
import { getMe } from "./routes/players";
import { getReplay, postReplay } from "./routes/replays";
import { startRun, submitRun } from "./routes/runs";

async function ensurePlayer(
  request: Request,
  env: Env,
): Promise<{ playerId: string; setCookie?: string }> {
  const cookie = readGuestCookie(request);
  if (cookie) {
    const verified = await verifyGuestCookie(cookie, env.GUEST_TOKEN_SECRET);
    if (verified) return { playerId: verified };
  }
  const playerId = newPlayerId();
  const handle = makeHandle(playerId);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `insert or ignore into players (id, handle, avatar_seed, account_type, created_at, last_seen_at, banned)
       values (?,?,?,?,?,?,0)`,
  )
    .bind(playerId, handle, playerId.slice(-8), "guest", now, now)
    .run();
  const signed = await signGuestId(playerId, env.GUEST_TOKEN_SECRET);
  return { playerId, setCookie: setGuestCookieHeader(signed) };
}

function withSetCookie(res: Response, setCookie?: string): Response {
  if (!setCookie) return res;
  const headers = new Headers(res.headers);
  headers.append("set-cookie", setCookie);
  return new Response(res.body, { status: res.status, headers });
}

const STATE_CHANGING_PATHS = new Set(["/api/runs/start", "/api/runs/submit", "/api/replays"]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (method === "OPTIONS") return preflight(env, request);

    if (pathname === "/api/health") {
      return json({ ok: true, service: "chuds-arcade-api" }, { env, request });
    }

    // Defence-in-depth CSRF: every state-changing request must come from a known Origin.
    if (method === "POST" && STATE_CHANGING_PATHS.has(pathname)) {
      const denied = requireOrigin(env, request);
      if (denied) return denied;
    }

    const { playerId, setCookie } = await ensurePlayer(request, env);
    let res: Response | null = null;

    if (method === "POST" && pathname === "/api/runs/start") {
      res = await startRun(request, env, playerId);
    } else if (method === "POST" && pathname === "/api/runs/submit") {
      res = await submitRun(request, env, playerId);
    } else if (method === "POST" && pathname === "/api/replays") {
      res = await postReplay(request, env, playerId);
    } else if (method === "GET" && pathname.startsWith("/api/replays/")) {
      res = await getReplay(request, env, pathname.slice("/api/replays/".length), playerId);
    } else if (method === "GET" && pathname === "/api/players/me") {
      res = await getMe(request, env, playerId);
    } else if (method === "GET" && pathname.startsWith("/api/leaderboards/")) {
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length === 4) {
        res = await getLeaderboard(request, env, parts[2]!, parts[3]!);
      }
    }

    if (!res) res = json({ error: "not_found" }, { status: 404, env, request });
    return withSetCookie(res, setCookie);
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    // Hourly purge of expired pending_runs that were never submitted.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare("delete from pending_runs where expires_at < ? and submitted = 0")
      .bind(cutoff)
      .run();
  },
};
