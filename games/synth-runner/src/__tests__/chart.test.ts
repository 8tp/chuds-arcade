import { describe, expect, it } from "vitest";
import { beatToMs, generateChart, generateSongSeed } from "../chart";

describe("Synth Runner chart generation", () => {
  it("is deterministic for a seed", () => {
    const song = generateSongSeed("daily:synth:deterministic");
    expect(generateChart(song)).toEqual(generateChart(song));
  });

  it("varies across seeds and keeps events in bounds", () => {
    const a = generateChart(generateSongSeed("daily:synth:a"));
    const b = generateChart(generateSongSeed("daily:synth:b"));
    expect(a).not.toEqual(b);
    for (const event of a) {
      expect(event.lane).toBeGreaterThanOrEqual(0);
      expect(event.lane).toBeLessThanOrEqual(2);
      expect(event.beat).toBeGreaterThan(0);
    }
  });

  it("maps beats to increasing times with swing", () => {
    const song = generateSongSeed("daily:synth:time");
    const t1 = beatToMs(song, 1);
    const t2 = beatToMs(song, 2);
    const t3 = beatToMs(song, 3);
    expect(t2).toBeGreaterThan(t1);
    expect(t3).toBeGreaterThan(t2);
  });
});
