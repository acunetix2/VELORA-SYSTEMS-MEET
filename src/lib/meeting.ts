/**
 * Cross-browser UUID v4 — falls back to Math.random when
 * crypto.randomUUID is unavailable (iOS Safari < 15.4, some Android WebViews).
 */
export function uuidv4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Generate a friendly meeting code: xxx-yyyy-zzz
export function generateMeetingId(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz";
  const pick = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${pick(3)}-${pick(4)}-${pick(3)}`;
}

export function isValidMeetingId(id: string): boolean {
  return /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i.test(id.trim());
}

const NAME_KEY = "velora:displayName";
export function getStoredName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NAME_KEY) || "";
}
export function setStoredName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name);
}

// ---- Per-meeting metadata (host + privacy) stored in localStorage on the host's browser ----
// In a P2P architecture without a backend room registry, the creator's browser is the
// source of truth for the room they created. Other participants learn the privacy mode
// (and host identity) over the realtime channel when they join.

export type MeetingPrivacy = "open" | "private";

export type LocalMeeting = {
  id: string;
  privacy: MeetingPrivacy;
  createdAt: number;
  hostUserId: string | null;
  /** Maximum number of participants the host wants to allow in this room. */
  capacity?: number;
  /** Optional expiry timestamp (ms). After this, the room can't be joined. */
  expiresAt?: number | null;
  title?: string;
  description?: string;
  imageUrl?: string;
};

const MEET_KEY = (id: string) => `velora:meeting:${id}`;
const RECENTS_KEY = "velora:recents";

export function saveLocalMeeting(m: LocalMeeting) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEET_KEY(m.id), JSON.stringify(m));
  // also push to recents (deduped, capped)
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const list: LocalMeeting[] = raw ? JSON.parse(raw) : [];
    const next = [m, ...list.filter((x) => x.id !== m.id)].slice(0, 8);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch { /* noop */ }
}

export function getLocalMeeting(id: string): LocalMeeting | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MEET_KEY(id));
    return raw ? (JSON.parse(raw) as LocalMeeting) : null;
  } catch { return null; }
}

export function getRecentMeetings(): LocalMeeting[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as LocalMeeting[]) : [];
  } catch { return []; }
}
