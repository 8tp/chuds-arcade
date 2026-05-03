# Deployment

Cloudflare Pages (web) + Cloudflare Worker (API) + D1 (database) + R2 (replay blobs). Total bill at v0 traffic should fit comfortably in the free tier.

## One-time Cloudflare setup

```bash
# Worker
wrangler login

# D1 — copy the printed database_id into apps/api/wrangler.toml
wrangler d1 create chuds-arcade

# R2 — replays bucket
wrangler r2 bucket create chuds-arcade-replays

# Secrets
wrangler secret put RUN_NONCE_SECRET     --name chuds-arcade-api
wrangler secret put GUEST_TOKEN_SECRET   --name chuds-arcade-api
# Use ≥32 random bytes, e.g.: head -c 32 /dev/urandom | base64
```

Edit `apps/api/wrangler.toml` and replace `database_id = "REPLACE_WITH_D1_ID"` with the real id.

## Running migrations

```bash
# Local D1 (file-based, used by `wrangler dev`)
pnpm --filter @chuds/api db:apply:local

# Remote D1
pnpm --filter @chuds/api db:apply
```

Migrations live in `db/migrations/`. New migrations are added by either:

```bash
wrangler d1 migrations create chuds-arcade <name>
# or just create the next 0xxx_*.sql file by hand
```

## Local development

```bash
# Terminal 1
pnpm --filter @chuds/web dev      # http://localhost:4321

# Terminal 2
pnpm --filter @chuds/api dev      # http://localhost:8787
```

The web app expects `PUBLIC_API_BASE` to point at the worker. Default is `/api` — set in `apps/web/.env.local`:

```
PUBLIC_API_BASE=http://localhost:8787/api
PUBLIC_BUILD_ID=local-dev
```

The arcade falls back to localStorage leaderboards if the worker isn't running, so the web app is usable in isolation.

## Deploying

### Worker

```bash
pnpm --filter @chuds/api deploy
```

CI does this automatically on `main` pushes that touch `apps/api/**`, `packages/arcade-sdk/**`, or `db/migrations/**`. See `.github/workflows/deploy-api.yml`. Required GitHub secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Web

Cloudflare Pages — easiest path is the dashboard:

1. Connect this repo to Pages.
2. Build command: `pnpm --filter @chuds/web build`
3. Build output directory: `apps/web/dist`
4. Environment variables:
   - `PUBLIC_API_BASE = https://chuds-arcade-api.<workers-subdomain>.workers.dev/api`
   - `PUBLIC_BUILD_ID = ${CF_PAGES_COMMIT_SHA}`
5. Node version: 20+ (Astro 5 supports it).

Pages will auto-deploy on every push to `main`. Pull-request previews are on by default.

## Configuration

`apps/api/wrangler.toml`:

```toml
name = "chuds-arcade-api"
compatibility_date = "2026-05-03"

[[d1_databases]]
binding = "DB"
database_name = "chuds-arcade"
database_id = "..."
migrations_dir = "../../db/migrations"

[[r2_buckets]]
binding = "REPLAYS"
bucket_name = "chuds-arcade-replays"

[triggers]
crons = ["17 * * * *"]   # hourly cleanup of expired pending_runs

[vars]
ALLOWED_ORIGIN = "https://chuds-arcade.pages.dev"
```

For preview deploys with their own URL, you'll either need a regex-aware `requireOrigin` or per-environment `ALLOWED_ORIGIN`. The current code expects a single string.

## Operations

### Checking status

```bash
curl https://<worker-url>/api/health
# { "ok": true, "service": "chuds-arcade-api" }
```

### Inspecting D1 directly

```bash
wrangler d1 execute chuds-arcade --command "select count(*) from runs"
wrangler d1 execute chuds-arcade --command "select board_key, count(*) from leaderboard_entries group by board_key"
```

### Tailing logs

```bash
wrangler tail chuds-arcade-api
```

### Rotating secrets

```bash
wrangler secret put RUN_NONCE_SECRET --name chuds-arcade-api
# active nonces invalidate immediately; clients re-fetch on next /runs/start
```

### Manual cron

```bash
wrangler dev --test-scheduled
# then in another shell:
curl http://localhost:8787/__scheduled
```

## Cost rough cuts

D1: free tier is 5 M reads + 100 k writes/day. A daily run is roughly:
- 1 read (cookie verify), 1 insert (pending), 1 update (submit), 2 inserts (run + lb), 1 read (rank). ≈ 6 ops.
- 100 daily players ≈ 600 ops/day. Budget headroom is ~150x that.

R2: free tier is 10 GB. Captcha Dungeon replays compress to ~1–3 KB each (event count is tiny). Cursor Wars at 30Hz × 3 min × 8 players will eat more — re-evaluate when M7 lands.

Worker requests: 100 k/day free. The arcade is well below.
