# Security model

Chuds Arcade is guest-first with no signup. The bar is "a player can't fabricate or replay a high score by tampering with client requests." This document is the reference for every defence-in-depth layer.

## Threats considered

| # | Threat | Mitigation |
|---|---|---|
| 1 | Spoofing another player's runs | Signed `chuds_guest` HttpOnly cookie binds every request to a server-minted player id. |
| 2 | Submitting a high score without playing | HMAC-signed `serverNonce` issued at `/runs/start` is required at `/runs/submit`. Nonce binds runId, playerId, gameSlug, mode, ruleset, seed, expiresAt. |
| 3 | Replaying the same nonce twice | `pending_runs.submitted` is updated atomically; second submit returns 409. |
| 4 | Reusing one valid replay across many runs | `replayPayload.runId` is required; `/replays` verifies it matches a pending row for the same player + slug + mode + ruleset + seed; `/runs/submit` re-checks the binding for resim-eligible modes. |
| 5 | Backfilling yesterday's daily | `/runs/start` rejects `dailyDate !== todayUtc()` with `stale_daily`. |
| 6 | Freeplay run polluting daily board | Daily leaderboard write is gated on `pending_runs.daily_date`, not on client-supplied `dailyDate`. |
| 7 | Cross-site request forgery | `Origin` header is checked on every state-changing POST; cookie is `SameSite=Lax`. |
| 8 | Replay/metric DoS via huge payloads | Replay body capped at 1 MB; `metrics` capped at 32 keys, 64-char keys, 256-char values, 4 KB serialised. |
| 9 | Replay flood by a single client | 30 replays/hour/player rate limit on `POST /api/replays`. |
| 10 | Public R2 dumping | Replays are `private` by default; `GET /api/replays/:id` only serves them to the owner unless `visibility = 'public'`. |
| 11 | Wildcard CORS combining with credentials | `corsHeaders` omits `Allow-Credentials` whenever `ALLOWED_ORIGIN === '*'`. |
| 12 | Unbounded `pending_runs` growth | Hourly cron purges expired rows. |
| 13 | SQL injection | Every query uses `prepare(...).bind(...)`; no string interpolation. |
| 14 | Score manipulation via metrics size | `metrics` JSON body capped, NaN/Infinity rejected. |

## Run nonce design

```ts
type NoncePayload = {
  runId: string;
  playerId: string;
  gameSlug: string;
  mode: string;
  rulesetVersion: string;
  seed: string;
  issuedAt: number;
  expiresAt: number;
};
```

- HMAC-SHA256 over `b64url(JSON(payload))` with `RUN_NONCE_SECRET`.
- 30-minute TTL (covers a slow Captcha Dungeon run).
- Verified via `crypto.subtle.verify` (constant-time).
- Submit also queries `pending_runs` to ensure the nonce wasn't issued, never re-checked, and silently dropped.

## Guest cookie design

```
chuds_guest = {playerId}.{HMAC-SHA256(playerId, GUEST_TOKEN_SECRET)}
```

Flags: `Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`.

The cookie is the only player identity the worker trusts. Any `playerId` field in a request body is ignored — the cookie wins.

The cookie is minted lazily on first request: if the cookie is missing or fails verify, the worker creates a new player row, signs the id, and includes a `Set-Cookie` header on the response.

## Replay binding

A replay can only be uploaded against a `pending_runs` row that:

- belongs to the same `playerId` (cookie-derived),
- isn't already `submitted = 1`,
- matches `gameSlug`, `mode`, `rulesetVersion`, and `seed` byte-for-byte.

For resim-eligible modes (server registry, not client manifest), `/runs/submit` re-checks the replay row's bindings to the same run before accepting the score.

## Sanity caps

Per-game in `apps/api/src/lib/sanity.ts`:

| Game | Max score | Max duration | Min duration |
|---|---:|---:|---:|
| captcha-dungeon | 50,000 | 30 min | 2 s |
| one-button-samurai | 50,000 | 20 min | 1 s |
| synth-runner | 1,000,000 | 10 min | 5 s |
| cursor-wars | 200,000 | 10 min | 2 s |

Plus structural caps on `metrics`:

- Max 32 keys.
- Max 64 chars per key.
- Max 256 chars per string value.
- NaN / Infinity rejected.
- Total JSON ≤ 4 KB.

## Verification levels

```
client       accepted but unverified
sanity       passed cap checks (default for v0)
resim        replay re-simulated server-side from seed + inputs (planned)
server       authoritative server simulation (Cursor Wars realtime)
```

A mode's `requiredVerification` lives in the **server** registry (`apps/api/src/lib/games.ts`). The client manifest does not influence this.

## Secrets

Set via `wrangler secret put`:

| Name | Used for |
|---|---|
| `RUN_NONCE_SECRET` | HMAC-SHA256 over the run nonce payload. |
| `GUEST_TOKEN_SECRET` | HMAC-SHA256 over the guest cookie player id. |

Both must be ≥ 32 random bytes. Rotate by changing the secret and accepting the brief invalidation window for active runs (existing nonces will fail verify, clients refetch a new one).

## Known limitations / future work

- **No origin allowlist beyond a single env var.** Multiple deploys of the web (preview branches) need either a regex match or a per-deploy worker.
- **Replays are accepted before submit.** That's intentional (lets us drop replays for failed runs), but means the upload is the heaviest unauthenticated-ish path. Mitigation: rate limit + size cap.
- **Public replay visibility is server-gated only.** No UI to flip visibility yet — defaults to private.
- **No banlist or shadow-ban surface.** `players.banned` exists in schema; no enforcement path until needed.
- **Cookie not `__Host-` prefixed.** Add when production domain is fixed; needs `Path=/; Secure; no Domain`.

## Reporting issues

Email: hunter.meherin@teambespin.us. Don't open public issues for security-relevant findings.
