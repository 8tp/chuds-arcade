// Cheap server-side sanity checks. Real per-game scoring lives in the
// game's own package (when it ships) and gets imported here later.

export type SanityInput = {
  gameSlug: string;
  score: number;
  durationMs: number;
  metrics: Record<string, number | string | boolean>;
};

const CAPS: Record<string, { maxScore: number; maxDurationMs: number; minDurationMs: number }> = {
  "captcha-dungeon": { maxScore: 50_000, maxDurationMs: 30 * 60_000, minDurationMs: 2_000 },
  "one-button-samurai": { maxScore: 50_000, maxDurationMs: 20 * 60_000, minDurationMs: 1_000 },
  "synth-runner": { maxScore: 1_000_000, maxDurationMs: 10 * 60_000, minDurationMs: 5_000 },
  "cursor-wars": { maxScore: 200_000, maxDurationMs: 10 * 60_000, minDurationMs: 2_000 },
};

const MAX_METRIC_KEYS = 32;
const MAX_METRIC_VALUE_LEN = 256;
const MAX_METRICS_JSON_BYTES = 4_096;

export function passesSanity(input: SanityInput): { ok: boolean; reason?: string } {
  const cap = CAPS[input.gameSlug];
  if (!cap) return { ok: false, reason: "unknown_game" };
  if (!Number.isFinite(input.score)) return { ok: false, reason: "score_not_finite" };
  if (input.score < 0) return { ok: false, reason: "negative_score" };
  if (input.score > cap.maxScore) return { ok: false, reason: "score_too_high" };
  if (input.durationMs < cap.minDurationMs) return { ok: false, reason: "duration_too_short" };
  if (input.durationMs > cap.maxDurationMs) return { ok: false, reason: "duration_too_long" };

  const keys = Object.keys(input.metrics);
  if (keys.length > MAX_METRIC_KEYS) return { ok: false, reason: "too_many_metrics" };
  for (const k of keys) {
    if (k.length > 64) return { ok: false, reason: "metric_key_too_long" };
    const v = input.metrics[k];
    if (typeof v === "string" && v.length > MAX_METRIC_VALUE_LEN) {
      return { ok: false, reason: "metric_value_too_long" };
    }
    if (typeof v === "number" && !Number.isFinite(v)) {
      return { ok: false, reason: "metric_value_not_finite" };
    }
  }
  if (JSON.stringify(input.metrics).length > MAX_METRICS_JSON_BYTES) {
    return { ok: false, reason: "metrics_too_large" };
  }
  return { ok: true };
}
