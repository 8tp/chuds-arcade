import { replayPayloadSchema } from "@chuds/arcade-sdk";
import type { Env } from "../env";
import { json } from "../lib/cors";

const MAX_REPLAY_BYTES = 1_000_000;
const MAX_REPLAYS_PER_HOUR = 30;

function newReplayId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  let s = "";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return `rep_${s}`;
}

async function rateCheckReplays(env: Env, playerId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - 60 * 60_000).toISOString();
  const row = await env.DB.prepare(
    "select count(*) as c from replays where player_id = ? and created_at > ?",
  )
    .bind(playerId, cutoff)
    .first<{ c: number }>();
  return (row?.c ?? 0) < MAX_REPLAYS_PER_HOUR;
}

export async function postReplay(request: Request, env: Env, playerId: string): Promise<Response> {
  if (!(await rateCheckReplays(env, playerId))) {
    return json({ error: "rate_limited" }, { status: 429, env, request });
  }

  const text = await request.text();
  if (text.length > MAX_REPLAY_BYTES) {
    return json({ error: "replay_too_large" }, { status: 413, env, request });
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "invalid_json" }, { status: 400, env, request });
  }
  const parsed = replayPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: "invalid_replay", issues: parsed.error.issues },
      { status: 400, env, request },
    );
  }

  // Replays must reference a real run owned by the same player.
  const runId = (body as { runId?: unknown }).runId;
  if (typeof runId !== "string") {
    return json({ error: "run_id_required" }, { status: 400, env, request });
  }
  const pending = await env.DB.prepare(
    `select run_id, game_slug, mode, ruleset_version, seed
       from pending_runs
      where run_id = ? and player_id = ? and submitted = 0`,
  )
    .bind(runId, playerId)
    .first<{
      run_id: string;
      game_slug: string;
      mode: string;
      ruleset_version: string;
      seed: string;
    }>();
  if (!pending) {
    return json({ error: "run_not_found_or_already_submitted" }, { status: 404, env, request });
  }
  if (
    pending.game_slug !== parsed.data.gameSlug ||
    pending.mode !== parsed.data.mode ||
    pending.ruleset_version !== parsed.data.rulesetVersion ||
    pending.seed !== parsed.data.seed
  ) {
    return json({ error: "replay_mismatch" }, { status: 400, env, request });
  }

  const replayId = newReplayId();
  const storageKey = `${parsed.data.gameSlug}/${parsed.data.mode}/${replayId}.json`;
  await env.REPLAYS.put(storageKey, text, {
    httpMetadata: { contentType: "application/json" },
  });

  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    `insert into replays (id, player_id, game_slug, mode, seed, ruleset_version,
       storage_key, duration_ms, size_bytes, created_at, run_id, visibility)
       values (?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      replayId,
      playerId,
      parsed.data.gameSlug,
      parsed.data.mode,
      parsed.data.seed,
      parsed.data.rulesetVersion,
      storageKey,
      parsed.data.durationMs,
      text.length,
      createdAt,
      runId,
      "private",
    )
    .run();

  return json({ replayId }, { env, request });
}

export async function getReplay(
  request: Request,
  env: Env,
  replayId: string,
  playerId: string,
): Promise<Response> {
  const row = await env.DB.prepare(
    "select storage_key, player_id, visibility from replays where id = ?",
  )
    .bind(replayId)
    .first<{ storage_key: string; player_id: string; visibility: string }>();
  if (!row) return json({ error: "not_found" }, { status: 404, env, request });
  if (row.visibility !== "public" && row.player_id !== playerId) {
    return json({ error: "forbidden" }, { status: 403, env, request });
  }
  const obj = await env.REPLAYS.get(row.storage_key);
  if (!obj) return json({ error: "blob_missing" }, { status: 410, env, request });
  return new Response(obj.body, {
    headers: {
      "content-type": "application/json",
      "cache-control": row.visibility === "public" ? "public, max-age=86400" : "private, no-store",
    },
  });
}
