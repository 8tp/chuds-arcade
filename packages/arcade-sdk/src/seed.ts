// Daily seed contract shared by web + worker.
// Boundary policy: UTC. Format: daily:{slug}:{mode}:{YYYY-MM-DD}:{ruleset}:{salt}

export const DEFAULT_SEASON_SALT = "season-0";

export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function dailySeed(
  gameSlug: string,
  mode: string,
  rulesetVersion: string,
  date: string = todayUtc(),
  seasonSalt: string = DEFAULT_SEASON_SALT,
): string {
  return `daily:${gameSlug}:${mode}:${date}:${rulesetVersion}:${seasonSalt}`;
}

export function nextDailyResetMs(now: Date = new Date()): number {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isValidDailyDate(date: string): boolean {
  return DATE_RE.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`));
}
