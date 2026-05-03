import { describe, expect, it } from "vitest";
import { type ReplayPayload, decodeReplay, encodeReplay } from "../index";

function makePayload(eventCount: number): ReplayPayload {
  const events = Array.from({ length: eventCount }, (_, i) => ({
    t: i * 33,
    type: i % 3 === 0 ? "press" : i % 3 === 1 ? "release" : "round_start",
    data: i % 3 === 2 ? { round: i, opponent: "ronin" } : undefined,
  }));
  return {
    runId: "run_test",
    gameSlug: "one-button-samurai",
    mode: "daily-dojo",
    rulesetVersion: "obs-rules-v1",
    seed: "daily:one-button-samurai:daily-dojo:2026-05-03:obs-rules-v1:season-0",
    startedAt: 1714680000000,
    durationMs: events.length * 33,
    encoding: "json",
    events,
  };
}

describe("replay codec", () => {
  it("round-trips a small JSON-encoded replay", () => {
    const payload = makePayload(8);
    const bytes = encodeReplay(payload);
    expect(String.fromCharCode(bytes[0]!)).toBe("J");
    const decoded = decodeReplay(bytes);
    expect(decoded.events).toEqual(payload.events);
  });

  it("round-trips a dense varint-delta replay", () => {
    const payload = makePayload(2_500);
    const bytes = encodeReplay(payload);
    expect(String.fromCharCode(bytes[0]!)).toBe("V");
    const decoded = decodeReplay(bytes);
    expect(decoded.events.length).toBe(payload.events.length);
    expect(decoded.events[0]).toEqual(payload.events[0]);
    expect(decoded.events.at(-1)).toEqual(payload.events.at(-1));
  });

  it("varint encoding is materially smaller than JSON", () => {
    const payload = makePayload(2_500);
    const varint = encodeReplay(payload).length;
    const json = new TextEncoder().encode(JSON.stringify(payload)).length;
    expect(varint).toBeLessThan(json * 0.7);
  });
});
