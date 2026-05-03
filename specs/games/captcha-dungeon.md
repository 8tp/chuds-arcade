# Captcha Dungeon Spec

## Pitch

A fake-CAPTCHA micro-puzzle roguelite.

```txt
Prove you are not a skeleton.
```

This is parody and puzzle design. Do not implement real CAPTCHA bypass mechanics.

## Visual direction

- Black-and-white dungeon frame.
- Clean puzzle grid.
- Illustrated tiles with simple line art.
- Checkmarks, hearts, room path, relic/curses cards.
- Keep it readable and calm.

Reference: `assets/mockups/captcha-dungeon.png`

## Core loop

```txt
Enter daily dungeon
→ solve fake CAPTCHA room
→ gain combo / humanity / score
→ choose relic or accept curse occasionally
→ progress to next room
→ defeat final boss puzzle
→ submit score
```

## Room structure

MVP daily dungeon:

```txt
10 rooms
1 mini-boss at room 5
1 final boss at room 10
```

Future full dungeon:

```txt
18 rooms
2 mini-bosses
1 final boss
branching paths
```

## Puzzle categories

### Select tiles

Examples:

```txt
Select all living beings.
Select every goblin wearing a hat.
Select all objects that can fly.
Select every creature with more than four legs.
```

### Drag/sort

Examples:

```txt
Drag the key into the correct lock.
Sort potions from safest to most cursed.
Match bones to the skeleton.
```

### Memory

Examples:

```txt
Repeat the rune sequence.
Remember which door blinked.
Find the missing symbol.
```

### Logic

Examples:

```txt
Pick the chest that is lying.
Select the only duplicate creature.
Choose the object that does not belong.
```

## Puzzle template contract

```ts
type PuzzleTemplate = {
  id: string;
  type: "select" | "drag" | "memory" | "logic";
  title: string;
  difficulty: number;
  generate(rng: RNG, difficulty: number): PuzzleInstance;
  validate(input: PuzzleInput, instance: PuzzleInstance): PuzzleResult;
};
```

## Select puzzle instance

```ts
type SelectPuzzleInstance = {
  id: string;
  prompt: string;
  timeLimitMs: number;
  tiles: Array<{
    id: string;
    label: string;
    category: string[];
    selected?: boolean;
  }>;
  correctTileIds: string[];
};
```

## Health and mistakes

```txt
Health: 3 hearts
Wrong tile: -1 heart
Timeout: -1 heart
Perfect room: +combo
Room clear: +humanity
```

## Relics

| Relic | Effect |
|---|---|
| Guiding Hint | Highlights one correct tile |
| Clarity Lens | Reveals one decoy |
| Extra Time | Adds 5 seconds once |
| Skeleton Key | Skip one non-boss room |
| Combo Candle | Combo bonus increases |

## Curses

| Curse | Effect |
|---|---|
| Blind Spots | Some tiles hide labels until hover |
| Trickster | More decoys |
| Mirror Room | Tile order mirrored |
| Time Debt | Less time, higher score multiplier |

## Scoring

```txt
score =
  roomsCleared * 500
+ bossesDefeated * 1500
+ maxCombo * 100
+ healthRemaining * 400
+ humanityScore
- mistakes * 250
- floor(totalTimeMs / 50)
```

Tie breakers:

1. Completed dungeon.
2. Fewer mistakes.
3. Faster time.
4. Higher max combo.

## Metrics

```ts
type CaptchaDungeonMetrics = {
  roomsCleared: number;
  bossesDefeated: number;
  mistakes: number;
  timeouts: number;
  healthRemaining: number;
  maxCombo: number;
  relicsCollected: number;
  cursesAccepted: number;
  humanityScore: number;
  totalTimeMs: number;
};
```

## Accessibility

- No puzzle should rely only on color.
- Provide keyboard navigation for tile selection.
- Use clear text, not distorted text.
- No audio-only puzzle in MVP.
- Reduced motion mode must work.

## MVP tasks

- Implement 10 select-tile puzzle templates.
- Implement daily dungeon generator.
- Implement health, combo, humanity, score.
- Implement relic/curses data model.
- Implement dungeon progress strip.
- Implement verification through deterministic puzzle validation.
- Add tests for generation, validation, and scoring.
