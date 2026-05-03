// Select-tile puzzle templates. Each template is a deterministic generator
// from a seeded RNG. Tile labels are short text glyphs so the game runs
// without any image assets — matches the design rule.

import { TILE_GRID } from "./constants";
import type { PuzzleTemplate, RNG, SelectPuzzleInstance, TileSpec } from "./types";

const N = TILE_GRID.rows * TILE_GRID.cols;

type Item = { label: string; cats: string[] };

// A small monochrome glyph + label vocabulary. Each item carries its
// category set so categories can be combined per-template.
const ITEMS: Item[] = [
  { label: "★ wolf", cats: ["living", "legged", "fanged", "fur"] },
  { label: "★ raven", cats: ["living", "winged", "feathered", "two-legged"] },
  { label: "★ goblin", cats: ["living", "legged", "two-legged", "humanoid"] },
  { label: "✦ moth", cats: ["living", "winged", "many-legged", "insect"] },
  { label: "✦ centipede", cats: ["living", "many-legged", "insect"] },
  { label: "✦ skeleton", cats: ["legged", "two-legged", "humanoid", "undead"] },
  { label: "✦ ghost", cats: ["undead", "winged"] },
  { label: "✦ slime", cats: ["living", "blob"] },
  { label: "▲ sword", cats: ["object", "metal", "weapon"] },
  { label: "▲ chalice", cats: ["object", "metal", "vessel"] },
  { label: "▲ key", cats: ["object", "metal"] },
  { label: "▲ scroll", cats: ["object", "paper", "magical"] },
  { label: "▲ potion", cats: ["object", "vessel", "magical"] },
  { label: "▲ candle", cats: ["object", "burning"] },
  { label: "▲ mushroom", cats: ["living", "plant", "magical"] },
  { label: "▲ moon", cats: ["object", "magical", "celestial"] },
  { label: "▲ helmet", cats: ["object", "metal", "armor"] },
  { label: "▲ chest", cats: ["object", "wooden", "container"] },
  { label: "▲ rune", cats: ["object", "magical", "stone"] },
  { label: "▲ hat", cats: ["object", "fabric"] },
  { label: "★ bat", cats: ["living", "winged", "fanged", "fur"] },
  { label: "★ spider", cats: ["living", "many-legged", "insect"] },
  { label: "★ rat", cats: ["living", "legged", "fanged", "fur"] },
  { label: "★ fish", cats: ["living", "finned", "scaled"] },
  { label: "★ dragon", cats: ["living", "winged", "fanged", "scaled", "magical"] },
];

function pick<T>(rng: RNG, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}
function shuffle<T>(rng: RNG, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function build(
  rng: RNG,
  prompt: string,
  testFn: (item: Item) => boolean,
  difficulty: number,
  pool: Item[] = ITEMS,
): SelectPuzzleInstance {
  const positives = pool.filter(testFn);
  const negatives = pool.filter((i) => !testFn(i));

  // Desired correct count from difficulty, clamped by what's actually available.
  let correctCount = Math.max(3, Math.min(6, 3 + Math.floor(difficulty / 2)));
  correctCount = Math.max(1, Math.min(correctCount, positives.length));
  let decoyCount = N - correctCount;
  if (decoyCount > negatives.length) {
    // Not enough decoys for our correct count — rebalance toward what we have.
    decoyCount = negatives.length;
    correctCount = N - decoyCount;
  }

  const correct = shuffle(rng, positives).slice(0, correctCount);
  const decoys = shuffle(rng, negatives).slice(0, decoyCount);
  const tiles = shuffle(rng, [
    ...correct.map((c) => ({ ...c, _correct: true })),
    ...decoys.map((d) => ({ ...d, _correct: false })),
  ]);

  const tileSpecs: TileSpec[] = tiles.map((t, i) => ({
    id: `t${i}`,
    label: t.label,
    category: t.cats,
  }));
  const correctIds = tileSpecs.filter((_, i) => tiles[i]!._correct).map((t) => t.id);

  return {
    id: `puz_${Math.floor(rng() * 1e9)}`,
    prompt,
    timeLimitMs: 0, // filled in by dungeon
    tiles: tileSpecs,
    correctTileIds: correctIds,
  };
}

export const TEMPLATES: PuzzleTemplate[] = [
  {
    id: "select-living",
    type: "select",
    title: "Select all living beings.",
    difficulty: 1,
    generate: (rng, d) =>
      build(rng, "Select every living being.", (i) => i.cats.includes("living"), d),
  },
  {
    id: "select-skeletons",
    type: "select",
    title: "Prove you are not a skeleton.",
    difficulty: 1,
    generate: (rng, d) =>
      build(
        rng,
        "Select all images that show skeletons, bones, or living dead.",
        (i) => i.cats.includes("undead"),
        d,
      ),
  },
  {
    id: "select-winged",
    type: "select",
    title: "Select every winged creature.",
    difficulty: 2,
    generate: (rng, d) =>
      build(rng, "Select every creature with wings.", (i) => i.cats.includes("winged"), d),
  },
  {
    id: "select-many-legged",
    type: "select",
    title: "Select creatures with more than four legs.",
    difficulty: 2,
    generate: (rng, d) =>
      build(
        rng,
        "Select creatures with more than four legs.",
        (i) => i.cats.includes("many-legged"),
        d,
      ),
  },
  {
    id: "select-fanged",
    type: "select",
    title: "Select every fanged thing.",
    difficulty: 2,
    generate: (rng, d) =>
      build(rng, "Select every fanged thing.", (i) => i.cats.includes("fanged"), d),
  },
  {
    id: "select-magical",
    type: "select",
    title: "Select all magical objects.",
    difficulty: 3,
    generate: (rng, d) =>
      build(rng, "Select all magical objects.", (i) => i.cats.includes("magical"), d),
  },
  {
    id: "select-metal",
    type: "select",
    title: "Select every metal object.",
    difficulty: 2,
    generate: (rng, d) =>
      build(rng, "Select every metal object.", (i) => i.cats.includes("metal"), d),
  },
  {
    id: "select-objects",
    type: "select",
    title: "Select things that are not alive.",
    difficulty: 1,
    generate: (rng, d) =>
      build(rng, "Select everything that is not alive.", (i) => !i.cats.includes("living"), d),
  },
  {
    id: "select-insects",
    type: "select",
    title: "Select every insect.",
    difficulty: 3,
    generate: (rng, d) => build(rng, "Select every insect.", (i) => i.cats.includes("insect"), d),
  },
  {
    id: "select-undead-or-magical",
    type: "select",
    title: "Boss: select undead OR magical.",
    difficulty: 4,
    generate: (rng, d) =>
      build(
        rng,
        "Select every tile that is undead OR magical.",
        (i) => i.cats.includes("undead") || i.cats.includes("magical"),
        d,
      ),
  },
];

export function pickTemplate(
  rng: RNG,
  difficulty: number,
  isBoss: boolean,
  maxTemplateDifficulty = difficulty + 1,
): PuzzleTemplate {
  if (isBoss) return TEMPLATES.find((t) => t.id === "select-undead-or-magical")!;
  const eligible = TEMPLATES.filter((t) => t.difficulty <= maxTemplateDifficulty);
  return pick(rng, eligible.length ? eligible : TEMPLATES);
}
