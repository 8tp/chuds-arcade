import type { Env } from "../env";
import { json } from "../lib/cors";

export async function getMe(request: Request, env: Env, playerId: string): Promise<Response> {
  const row = await env.DB.prepare(
    `select id, handle, avatar_seed, account_type, created_at, last_seen_at, banned
       from players where id = ?`,
  )
    .bind(playerId)
    .first<{
      id: string;
      handle: string;
      avatar_seed: string;
      account_type: string;
      created_at: string;
      last_seen_at: string;
      banned: number;
    }>();
  if (!row) return json({ error: "not_found" }, { status: 404, env, request });
  return json(
    {
      id: row.id,
      handle: row.handle,
      avatarSeed: row.avatar_seed,
      accountType: row.account_type,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      banned: row.banned === 1,
    },
    { env, request },
  );
}
