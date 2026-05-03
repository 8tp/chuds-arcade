// Signed guest cookie. Server is the only one that can mint a player id;
// the client just keeps the cookie around. Format: "{playerId}.{sigB64}"

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad));
  const buf = new ArrayBuffer(bin.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

const COOKIE_NAME = "chuds_guest";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function signGuestId(playerId: string, secret: string): Promise<string> {
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", await key(secret), enc.encode(playerId)),
  );
  return `${playerId}.${b64url(sig)}`;
}

export async function verifyGuestCookie(
  cookieValue: string,
  secret: string,
): Promise<string | null> {
  const dot = cookieValue.indexOf(".");
  if (dot < 0) return null;
  const playerId = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  const ok = await crypto.subtle.verify(
    "HMAC",
    await key(secret),
    b64urlDecode(sig),
    enc.encode(playerId),
  );
  return ok ? playerId : null;
}

export function readGuestCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const [k, v] = part.split("=");
    if (k === COOKIE_NAME && v) return v;
  }
  return null;
}

export function setGuestCookieHeader(value: string): string {
  // SameSite=Lax so daily-link redirects still carry the cookie.
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${ONE_YEAR}; HttpOnly; Secure; SameSite=Lax`;
}

export function newPlayerId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `guest_${b64url(bytes)}`;
}

export function makeHandle(playerId: string): string {
  // Deterministic from the id so callers that don't ship one still get a stable handle.
  const h = playerId.replace("guest_", "").slice(0, 8);
  return `void_${h.toLowerCase()}`;
}
