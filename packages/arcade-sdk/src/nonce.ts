// HMAC-signed run nonces. Bind /runs/start to /runs/submit so submissions
// can't be fabricated without the server's secret. Web Crypto only — works
// in workers and modern browsers (we don't sign client-side, but the
// verifier is shared so contract drift can't sneak in).

export type NoncePayload = {
  runId: string;
  playerId: string;
  gameSlug: string;
  mode: string;
  rulesetVersion: string;
  seed: string;
  issuedAt: number;
  expiresAt: number;
};

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(norm);
  const buf = new ArrayBuffer(bin.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signNonce(payload: NoncePayload, secret: string): Promise<string> {
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const key = await importKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
  return `${body}.${b64urlEncode(sig)}`;
}

export async function verifyNonce(
  token: string,
  secret: string,
  now: number = Date.now(),
): Promise<NoncePayload | null> {
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const key = await importKey(secret);
  const ok = await crypto.subtle.verify("HMAC", key, b64urlDecode(sig), enc.encode(body));
  if (!ok) return null;
  let parsed: NoncePayload;
  try {
    parsed = JSON.parse(dec.decode(b64urlDecode(body))) as NoncePayload;
  } catch {
    return null;
  }
  if (parsed.expiresAt < now) return null;
  return parsed;
}

export const NONCE_TTL_MS = 30 * 60 * 1000; // 30 min — covers a slow run
