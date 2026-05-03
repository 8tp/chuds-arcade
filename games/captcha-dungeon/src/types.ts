export type RNG = () => number;

export type TileSpec = {
  id: string;
  label: string;
  category: string[];
};

export type SelectPuzzleInstance = {
  id: string;
  prompt: string;
  timeLimitMs: number;
  tiles: TileSpec[];
  correctTileIds: string[];
};

export type PuzzleResult = {
  correct: boolean;
  perfect: boolean;
  mistakes: number;
  missed: number;
  picked: string[];
};

export type PuzzleTemplate = {
  id: string;
  type: "select";
  title: string;
  difficulty: number;
  generate(rng: RNG, difficulty: number): SelectPuzzleInstance;
};

export type Room = {
  index: number;
  isBoss: boolean;
  templateId: string;
  difficulty: number;
  puzzle: SelectPuzzleInstance;
};

export type Dungeon = {
  seed: string;
  rooms: Room[];
};

export type RunMetrics = {
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
