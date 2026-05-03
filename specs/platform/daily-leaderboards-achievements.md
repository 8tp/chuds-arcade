# Daily Runs, Leaderboards, and Achievements

## Daily seed format

```txt
daily:{gameSlug}:{mode}:{YYYY-MM-DD}:{rulesetVersion}:{seasonSalt}
```

Example:

```txt
daily:captcha-dungeon:daily-dungeon:2026-05-03:captcha-rules-v1:season-0
```

## Run lifecycle

```txt
POST /api/runs/start
→ server returns runId, seed, serverNonce, rulesetVersion
→ game plays run
→ game optionally saves replay
→ game submits result
→ server validates result
→ leaderboard entries update
→ achievements are checked
```

## Verification levels

```txt
client       accepted but unverified
sanity       server checked obvious impossible values
resim        server re-simulated from seed + replay inputs
server       server-authoritative simulation, used for Cursor Wars online
```

Recommended launch verification:

| Game | Daily verification |
|---|---|
| Captcha Dungeon | resim eventually, sanity first |
| One Button Samurai | resim for bot ladder |
| Synth Runner | resim for chart + inputs |
| Cursor Wars | server for online, sanity for bot arena |

## Leaderboard scopes

```txt
all-time
weekly
daily
seeded
personal
friends, later
```

Board key format:

```txt
{gameSlug}:{mode}:{rulesetVersion}:{scope}:{dateOrRange}:{seedHash}
```

## Achievement categories

```txt
arcade-wide
one-button-samurai
synth-runner
cursor-wars
captcha-dungeon
secret
```

Achievement examples:

```txt
first-daily-run
complete one daily run

clean-slice
beat One Button Samurai under 20 seconds

gridline-perfect
finish a Synth Runner daily song with zero misses

cursor-tagged
eliminate three bots in Cursor Wars bot arena

not-a-skeleton
clear the first Captcha Dungeon daily dungeon
```
