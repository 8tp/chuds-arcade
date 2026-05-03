// Runtime-validated request/response shapes. Type aliases here use the
// `*Validated` suffix so they don't collide with the canonical TS types
// exported from `index.ts` — the canonical types are the public contract;
// these schemas are how the worker enforces it.

import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/);
const modeSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/);
const rulesetSchema = z.string().min(1).max(64);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const startRunRequestSchema = z.object({
  gameSlug: slugSchema,
  mode: modeSchema,
  dailyDate: dateSchema.optional(),
});
export type StartRunRequestValidated = z.infer<typeof startRunRequestSchema>;

export const startRunResponseSchema = z.object({
  runId: z.string(),
  gameSlug: slugSchema,
  mode: modeSchema,
  rulesetVersion: rulesetSchema,
  seed: z.string(),
  dailyDate: dateSchema.optional(),
  serverNonce: z.string(),
  startedAt: z.string(),
});
export type StartRunResponseValidated = z.infer<typeof startRunResponseSchema>;

export const submitRunRequestSchema = z.object({
  runId: z.string(),
  serverNonce: z.string(),
  gameSlug: slugSchema,
  mode: modeSchema,
  rulesetVersion: rulesetSchema,
  seed: z.string(),
  score: z.number().int().min(-1_000_000).max(10_000_000),
  durationMs: z
    .number()
    .int()
    .min(0)
    .max(8 * 60 * 60 * 1000),
  outcome: z.enum(["win", "loss", "draw", "complete", "failed"]),
  metrics: z.record(z.union([z.number(), z.string(), z.boolean()])),
  replayId: z.string().optional(),
  inputHash: z.string().optional(),
  clientBuildId: z.string().min(1).max(64),
});
export type SubmitRunRequestValidated = z.infer<typeof submitRunRequestSchema>;

export const submitRunResponseSchema = z.object({
  accepted: z.boolean(),
  verifiedLevel: z.enum(["client", "sanity", "resim", "server"]),
  rank: z.number().int().optional(),
  personalBest: z.boolean().optional(),
  unlockedAchievements: z.array(z.string()).optional(),
});
export type SubmitRunResponseValidated = z.infer<typeof submitRunResponseSchema>;

export const replayEventSchema = z.object({
  t: z.number(),
  type: z.string(),
  data: z.unknown().optional(),
});
export const replayPayloadSchema = z.object({
  runId: z.string().min(1),
  gameSlug: slugSchema,
  mode: modeSchema,
  rulesetVersion: rulesetSchema,
  seed: z.string(),
  startedAt: z.number(),
  durationMs: z.number().int().min(0),
  events: z.array(replayEventSchema).max(50_000),
});
export type ReplayPayloadValidated = z.infer<typeof replayPayloadSchema>;

export const playerSchema = z.object({
  id: z.string(),
  handle: z
    .string()
    .min(1)
    .max(24)
    .regex(/^[a-zA-Z0-9_-]+$/),
  avatarSeed: z.string(),
  accountType: z.enum(["guest", "github", "discord", "email"]),
  createdAt: z.string(),
  lastSeenAt: z.string(),
  banned: z.boolean(),
});
export type PlayerValidated = z.infer<typeof playerSchema>;
