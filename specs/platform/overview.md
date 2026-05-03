# Chuds Arcade Platform Overview

## Product pitch

Chuds Arcade is a clean black-and-white browser arcade for tiny, polished games. Each game should be understandable in seconds, playable in minutes, and replayable through daily seeded challenges.

## Launch scope

The first release should support:

- guest profiles
- game directory
- daily challenge hub
- local and global leaderboards
- achievements
- lightweight replay metadata
- monochrome editorial manga UI
- four original games:
  - One Button Samurai
  - Synth Runner
  - Cursor Wars
  - Captcha Dungeon

AntMaze can be added later as the first existing-game port.

## Design principles

1. **Small loops, high polish** — every game should have a clean core interaction.
2. **Daily-first** — the daily challenge is the primary retention mechanic.
3. **Guest-first** — no login required at launch.
4. **Deterministic where possible** — daily runs and replays should be reproducible.
5. **Monochrome identity** — black ink, white space, manga panels, terminal microcopy.
6. **Not another bloated web app** — keep the frontend fast and the games lightweight.

## Main pages

```txt
/                    homepage
/games               game directory
/g/:slug             game landing page
/play/:slug          game host route
/daily               daily challenge hub
/leaderboards        leaderboard index
/u/:handle           public profile, later
/settings            local player settings
```

## Core user flow

```txt
Visitor opens homepage
→ local guest profile is created
→ user chooses today's challenge
→ arcade creates a run with a deterministic seed
→ game mounts through ArcadeRuntime
→ user finishes the run
→ score is submitted
→ leaderboard and achievements update
→ user can replay or share the result
```

## MVP acceptance criteria

- The shell looks like a monochrome manga-zine web arcade.
- A guest can play a daily run without signing in.
- Daily seeds are deterministic by date, game, and ruleset version.
- Captcha Dungeon has at least 10 puzzle templates.
- One Button Samurai has a playable bot ladder.
- Synth Runner has at least one generated daily track.
- Cursor Wars has a bot arena before full multiplayer.
