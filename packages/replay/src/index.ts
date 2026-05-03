// Compact replay encoding: varint timestamps + delta-encoded.
// Use case: dense input streams (Cursor Wars at 30Hz, Synth Runner press
// times). Codec metadata extends the SDK's canonical ReplayPayload so we
// don't have two divergent shapes.

import type { ReplayEvent, ReplayPayload as SdkReplayPayload } from "@chuds/arcade-sdk";

export type { ReplayEvent };

export type ReplayEncoding = "json" | "varint-delta";

export type CodecMetadata = {
  encoding: ReplayEncoding;
  typeTable?: string[];
};

export type ReplayPayload = SdkReplayPayload & CodecMetadata;

export function createReplay(
  runId: string,
  gameSlug: string,
  mode: string,
  rulesetVersion: string,
  seed: string,
): ReplayPayload {
  return {
    runId,
    gameSlug,
    mode,
    rulesetVersion,
    seed,
    startedAt: Date.now(),
    durationMs: 0,
    encoding: "json",
    events: [],
  };
}

// ---------------- varint ----------------

function writeVarint(buf: number[], value: number): void {
  let v = value | 0;
  if (v < 0) v = (v >>> 1) ^ -(v & 1); // zigzag for signed deltas (rare)
  while (v >= 0x80) {
    buf.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  buf.push(v & 0x7f);
}

function readVarint(view: Uint8Array, offset: number): { value: number; offset: number } {
  let result = 0;
  let shift = 0;
  let o = offset;
  while (o < view.length) {
    const b = view[o]!;
    o += 1;
    result |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) return { value: result >>> 0, offset: o };
    shift += 7;
  }
  throw new Error("varint truncated");
}

// ---------------- encode ----------------

export function encodeReplay(payload: ReplayPayload): Uint8Array {
  const events = payload.events;
  const useVarint = events.length > 64;

  if (!useVarint) {
    const json = JSON.stringify({ ...payload, encoding: "json" });
    return new TextEncoder().encode(`J${json}`);
  }

  const typeTable: string[] = [];
  const typeIndex = new Map<string, number>();
  for (const e of events) {
    if (!typeIndex.has(e.type)) {
      typeIndex.set(e.type, typeTable.length);
      typeTable.push(e.type);
    }
  }

  const header = {
    runId: payload.runId,
    gameSlug: payload.gameSlug,
    mode: payload.mode,
    rulesetVersion: payload.rulesetVersion,
    seed: payload.seed,
    startedAt: payload.startedAt,
    durationMs: payload.durationMs,
    encoding: "varint-delta" as const,
    typeTable,
  };
  const headerBytes = new TextEncoder().encode(JSON.stringify(header));

  const stream: number[] = [];
  let lastT = 0;
  for (const e of events) {
    const dt = Math.max(0, Math.floor(e.t - lastT));
    lastT = e.t;
    writeVarint(stream, dt);
    writeVarint(stream, typeIndex.get(e.type)!);
    if (e.data === undefined) {
      writeVarint(stream, 0);
    } else {
      const dataBytes = new TextEncoder().encode(JSON.stringify(e.data));
      writeVarint(stream, dataBytes.length);
      for (const b of dataBytes) stream.push(b);
    }
  }

  const out = new Uint8Array(1 + 4 + headerBytes.length + stream.length);
  out[0] = "V".charCodeAt(0);
  out[1] = (headerBytes.length >>> 24) & 0xff;
  out[2] = (headerBytes.length >>> 16) & 0xff;
  out[3] = (headerBytes.length >>> 8) & 0xff;
  out[4] = headerBytes.length & 0xff;
  out.set(headerBytes, 5);
  out.set(stream, 5 + headerBytes.length);
  return out;
}

// ---------------- decode ----------------

export function decodeReplay(bytes: Uint8Array): ReplayPayload {
  if (bytes.length === 0) throw new Error("empty replay");
  const tag = String.fromCharCode(bytes[0]!);
  if (tag === "J") {
    return JSON.parse(new TextDecoder().decode(bytes.subarray(1))) as ReplayPayload;
  }
  if (tag !== "V") throw new Error("unknown replay encoding");
  const headerLen = (bytes[1]! << 24) | (bytes[2]! << 16) | (bytes[3]! << 8) | bytes[4]!;
  const headerJson = new TextDecoder().decode(bytes.subarray(5, 5 + headerLen));
  const header = JSON.parse(headerJson) as Omit<ReplayPayload, "events">;
  if (!header.typeTable) throw new Error("varint replay missing type table");

  const events: ReplayEvent[] = [];
  let lastT = 0;
  let o = 5 + headerLen;
  while (o < bytes.length) {
    const dt = readVarint(bytes, o);
    o = dt.offset;
    const ti = readVarint(bytes, o);
    o = ti.offset;
    const dl = readVarint(bytes, o);
    o = dl.offset;
    let data: unknown = undefined;
    if (dl.value > 0) {
      const slice = bytes.subarray(o, o + dl.value);
      data = JSON.parse(new TextDecoder().decode(slice));
      o += dl.value;
    }
    lastT += dt.value;
    events.push({
      t: lastT,
      type: header.typeTable[ti.value]!,
      ...(data !== undefined ? { data } : {}),
    });
  }

  return { ...header, events };
}
