// Local guest profile. Browser-only. Server-issued tokens replace this in M2.

const STORAGE_KEY = "chuds.profile.v1";

export type GuestProfile = {
  id: string;
  handle: string;
  avatarSeed: string;
  createdAt: string;
};

const adjectives = [
  "void",
  "ink",
  "gloss",
  "static",
  "pixel",
  "panel",
  "ghost",
  "ronin",
  "circuit",
  "vellum",
  "hollow",
  "lumen",
  "neon-free",
  "hatch",
  "tone",
];
const nouns = [
  "samurai",
  "runner",
  "cursor",
  "skeleton",
  "goblin",
  "page",
  "issue",
  "frame",
  "duel",
  "relic",
  "halftone",
  "grid",
  "chud",
  "beat",
];

function rand36(len: number): string {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => (b % 36).toString(36)).join("");
}

function makeHandle(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const n = Math.floor(Math.random() * 99)
    .toString()
    .padStart(2, "0");
  return `${adj}_${noun}_${n}`;
}

export function loadProfile(): GuestProfile | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuestProfile;
  } catch {
    return null;
  }
}

export function ensureProfile(): GuestProfile {
  const existing = loadProfile();
  if (existing) return existing;
  const profile: GuestProfile = {
    id: `guest_${rand36(10)}`,
    handle: makeHandle(),
    avatarSeed: rand36(8),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export function updateHandle(handle: string): GuestProfile {
  const p = ensureProfile();
  const next = { ...p, handle };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function rerollProfile(): GuestProfile {
  localStorage.removeItem(STORAGE_KEY);
  return ensureProfile();
}
