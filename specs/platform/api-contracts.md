# API Contracts

## `POST /api/runs/start`

Request:

```json
{
  "playerId": "guest_123",
  "gameSlug": "captcha-dungeon",
  "mode": "daily-dungeon",
  "dailyDate": "2026-05-03"
}
```

Response:

```json
{
  "runId": "run_abc",
  "gameSlug": "captcha-dungeon",
  "mode": "daily-dungeon",
  "seed": "daily:captcha-dungeon:daily-dungeon:2026-05-03:captcha-rules-v1:season-0",
  "dailyDate": "2026-05-03",
  "rulesetVersion": "captcha-rules-v1",
  "serverNonce": "nonce_abc",
  "startedAt": "2026-05-03T12:00:00.000Z"
}
```

## `POST /api/runs/submit`

Request:

```json
{
  "runId": "run_abc",
  "gameSlug": "captcha-dungeon",
  "mode": "daily-dungeon",
  "rulesetVersion": "captcha-rules-v1",
  "seed": "daily:captcha-dungeon:daily-dungeon:2026-05-03:captcha-rules-v1:season-0",
  "score": 1240,
  "durationMs": 183000,
  "outcome": "complete",
  "metrics": {
    "roomsCleared": 10,
    "mistakes": 2,
    "maxCombo": 7
  },
  "clientBuildId": "web-v0.1.0"
}
```

Response:

```json
{
  "accepted": true,
  "verifiedLevel": "sanity",
  "rank": 27,
  "personalBest": true,
  "unlockedAchievements": ["not-a-skeleton"]
}
```

## `GET /api/leaderboards/:gameSlug/:mode`

Query params:

```txt
scope=daily|weekly|all-time|seeded
rulesetVersion=...
date=YYYY-MM-DD
limit=50
```

Response:

```json
{
  "boardKey": "captcha-dungeon:daily-dungeon:captcha-rules-v1:daily:2026-05-03",
  "entries": [
    {
      "rank": 1,
      "playerHandle": "void_99",
      "score": 2420,
      "durationMs": 120000,
      "verifiedLevel": "sanity",
      "createdAt": "2026-05-03T12:30:00.000Z"
    }
  ]
}
```
