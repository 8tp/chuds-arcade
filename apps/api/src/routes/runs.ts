import {
  NONCE_TTL_MS,
  dailySeed,
  isValidDailyDate,
  signNonce,
  startRunRequestSchema,
  submitRunRequestSchema,
  todayUtc,
  verifyNonce,
} from "@chuds/arcade-sdk";
import type { Env } from "../env";
import { json } from "../lib/cors";
import { getServerGame } from "../lib/games";
import { passesSanity } from "../lib/sanity";

function newRunId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  let s = "";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return `run_${s}`;
}

export async function startRun(request: Request, env: Env, playerId: string): Promise<Response> {
  const parsed = startRunRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400, env, request },
    );
  }

  const game = getServerGame(parsed.data.gameSlug);
  if (!game) return json({ error: "unknown_game" }, { status: 404, env, request });
  const modeCfg = game.modes[parsed.data.mode];
  if (!modeCfg) return json({ error: "unknown_mode" }, { status: 404, env, request });

  const dailyDate = parsed.data.dailyDate;
  if (dailyDate && !isValidDailyDate(dailyDate)) {
    return json({ error: "invalid_date" }, { status: 400, env, request });
  }
  if (dailyDate && dailyDate !== todayUtc()) {
    return json({ error: "stale_daily" }, { status: 400, env, request });
  }
  const seed = dailyDate
    ? dailySeed(game.slug, parsed.data.mode, game.rulesetVersion, dailyDate)
    : `freeplay:${game.slug}:${parsed.data.mode}:${game.rulesetVersion}:${crypto.randomUUID()}`;

  const runId = newRunId();
  const issuedAt = Date.now();
  const expiresAt = issuedAt + NONCE_TTL_MS;
  const startedAt = new Date(issuedAt).toISOString();

  const serverNonce = await signNonce(
    {
      runId,
      playerId,
      gameSlug: game.slug,
      mode: parsed.data.mode,
      rulesetVersion: game.rulesetVersion,
      seed,
      issuedAt,
      expiresAt,
    },
    env.RUN_NONCE_SECRET,
  );

  await env.DB.prepare(
    `insert into pending_runs
      (run_id, player_id, game_slug, mode, ruleset_version, seed, daily_date, started_at, expires_at)
      values (?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      runId,
      playerId,
      game.slug,
      parsed.data.mode,
      game.rulesetVersion,
      seed,
      dailyDate ?? null,
      startedAt,
      new Date(expiresAt).toISOString(),
    )
    .run();

  const body: Record<string, unknown> = {
    runId,
    gameSlug: game.slug,
    mode: parsed.data.mode,
    seed,
    serverNonce,
    rulesetVersion: game.rulesetVersion,
    startedAt,
  };
  if (dailyDate) body.dailyDate = dailyDate;
  return json(body, { env, request });
}

export async function submitRun(request: Request, env: Env, playerId: string): Promise<Response> {
  const parsed = submitRunRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400, env, request },
    );
  }
  const body = parsed.data;

  const nonce = await verifyNonce(body.serverNonce, env.RUN_NONCE_SECRET);
  if (!nonce) return json({ error: "invalid_nonce" }, { status: 401, env, request });

  if (
    nonce.playerId !== playerId ||
    nonce.runId !== body.runId ||
    nonce.gameSlug !== body.gameSlug ||
    nonce.mode !== body.mode ||
    nonce.rulesetVersion !== body.rulesetVersion ||
    nonce.seed !== body.seed
  ) {
    return json({ error: "nonce_mismatch" }, { status: 401, env, request });
  }

  // The pending row carries the authoritative dailyDate — never trust the client.
  const pending = await env.DB.prepare(
    "select daily_date, submitted from pending_runs where run_id = ? and player_id = ?",
  )
    .bind(body.runId, playerId)
    .first<{ daily_date: string | null; submitted: number }>();
  if (!pending) return json({ error: "unknown_run" }, { status: 404, env, request });
  if (pending.submitted === 1)
    return json({ error: "duplicate_submit" }, { status: 409, env, request });

  const game = getServerGame(body.gameSlug);
  if (!game) return json({ error: "unknown_game" }, { status: 404, env, request });
  const modeCfg = game.modes[body.mode];
  if (!modeCfg) return json({ error: "unknown_mode" }, { status: 404, env, request });

  // Resim-eligible boards must include a replay handle that's bound to this run.
  if (modeCfg.requiredVerification === "resim") {
    if (!body.replayId) return json({ error: "replay_required" }, { status: 400, env, request });
    const replay = await env.DB.prepare(
      `select run_id, player_id, seed, game_slug, mode, ruleset_version
         from replays where id = ?`,
    )
      .bind(body.replayId)
      .first<{
        run_id: string | null;
        player_id: string;
        seed: string;
        game_slug: string;
        mode: string;
        ruleset_version: string;
      }>();
    if (
      !replay ||
      replay.player_id !== playerId ||
      replay.run_id !== body.runId ||
      replay.seed !== body.seed ||
      replay.game_slug !== body.gameSlug ||
      replay.mode !== body.mode ||
      replay.ruleset_version !== body.rulesetVersion
    ) {
      return json({ error: "replay_not_bound" }, { status: 400, env, request });
    }
  }

  const sanity = passesSanity({
    gameSlug: body.gameSlug,
    score: body.score,
    durationMs: body.durationMs,
    metrics: body.metrics,
  });
  if (!sanity.ok) {
    return json(
      { accepted: false, verifiedLevel: "client", error: sanity.reason },
      { status: 422, env, request },
    );
  }

  const update = await env.DB.prepare(
    `update pending_runs set submitted = 1
       where run_id = ? and player_id = ? and submitted = 0`,
  )
    .bind(body.runId, playerId)
    .run();
  if ((update.meta?.changes ?? 0) === 0) {
    return json({ error: "duplicate_submit" }, { status: 409, env, request });
  }

  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    `insert into runs (id, player_id, game_slug, mode, ruleset_version, seed,
       score, duration_ms, outcome, metrics_json, replay_id, verified_level,
       client_build_id, created_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      body.runId,
      playerId,
      body.gameSlug,
      body.mode,
      body.rulesetVersion,
      body.seed,
      body.score,
      body.durationMs,
      body.outcome,
      JSON.stringify(body.metrics),
      body.replayId ?? null,
      "sanity",
      body.clientBuildId,
      createdAt,
    )
    .run();

  // Daily board entry — only if the run was started as a daily.
  let rank: number | undefined;
  if (pending.daily_date) {
    const boardKey = `${body.gameSlug}:${body.mode}:${body.rulesetVersion}:daily:${pending.daily_date}`;
    await env.DB.prepare(
      `insert into leaderboard_entries
         (id, run_id, player_id, game_slug, mode, board_key, rank_score, tie_breaker, created_at)
         values (?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        `lb_${body.runId}`,
        body.runId,
        playerId,
        body.gameSlug,
        body.mode,
        boardKey,
        body.score,
        body.durationMs,
        createdAt,
      )
      .run();
    const rankRow = await env.DB.prepare(
      `select count(*) + 1 as rank from leaderboard_entries
         where board_key = ? and rank_score > ?`,
    )
      .bind(boardKey, body.score)
      .first<{ rank: number }>();
    if (rankRow) rank = rankRow.rank;
  }

  // Personal-best across this game/mode.
  const pb = await env.DB.prepare(
    `select 1 as one from runs
       where player_id = ? and game_slug = ? and mode = ?
         and id != ? and score >= ? limit 1`,
  )
    .bind(playerId, body.gameSlug, body.mode, body.runId, body.score)
    .first<{ one: number }>();

  return json(
    {
      accepted: true,
      verifiedLevel: "sanity",
      personalBest: !pb,
      ...(rank !== undefined ? { rank } : {}),
      unlockedAchievements: [] as string[],
    },
    { env, request },
  );
}
