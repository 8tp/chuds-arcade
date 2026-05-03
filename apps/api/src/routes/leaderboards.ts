import { todayUtc } from "@chuds/arcade-sdk";
import type { Env } from "../env";
import { json } from "../lib/cors";
import { getServerGame } from "../lib/games";

export async function getLeaderboard(
  request: Request,
  env: Env,
  gameSlug: string,
  mode: string,
): Promise<Response> {
  const game = getServerGame(gameSlug);
  if (!game) return json({ error: "unknown_game" }, { status: 404, env, request });
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") ?? "daily";
  const date = url.searchParams.get("date") ?? todayUtc();
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  const boardKey =
    scope === "daily"
      ? `${gameSlug}:${mode}:${game.rulesetVersion}:daily:${date}`
      : `${gameSlug}:${mode}:${game.rulesetVersion}:all-time`;

  const rows = await env.DB.prepare(
    `select e.rank_score as score, e.tie_breaker as duration_ms,
            r.outcome, p.handle as player_handle, e.created_at
       from leaderboard_entries e
       join runs r on r.id = e.run_id
       join players p on p.id = e.player_id
      where e.board_key = ?
      order by e.rank_score desc, e.tie_breaker asc
      limit ?`,
  )
    .bind(boardKey, limit)
    .all<{
      score: number;
      duration_ms: number;
      outcome: string;
      player_handle: string;
      created_at: string;
    }>();

  return json(
    {
      boardKey,
      entries: (rows.results ?? []).map((r, i) => ({
        rank: i + 1,
        playerHandle: r.player_handle,
        score: r.score,
        durationMs: r.duration_ms,
        verifiedLevel: "sanity",
        createdAt: r.created_at,
      })),
    },
    { env, request },
  );
}
