import { useEffect, useState } from "react";

/**
 * Tracks meeting time + counts on the local device. Each meeting is logged
 * when the user joins (start) and again on leave (duration).
 */

export type MeetingLog = {
  id: string;
  meetingId: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  isHost: boolean;
};

const KEY = "velora:meeting-logs";

function load(): MeetingLog[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(items: MeetingLog[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, 200))); } catch { /* noop */ }
}

export function logMeeting(entry: Omit<MeetingLog, "id">) {
  const item: MeetingLog = { ...entry, id: crypto.randomUUID() };
  const next = [item, ...load()];
  save(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("velora:meeting-log"));
  }
}

export function clearMeetingLogs() {
  save([]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("velora:meeting-log"));
  }
}

export function useMeetingStats() {
  const [logs, setLogs] = useState<MeetingLog[]>([]);

  useEffect(() => {
    setLogs(load());
    const refresh = () => setLogs(load());
    window.addEventListener("velora:meeting-log", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("velora:meeting-log", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const totalMs = logs.reduce((s, l) => s + l.durationMs, 0);
  const weekMs = logs.filter((l) => l.endedAt >= weekAgo).reduce((s, l) => s + l.durationMs, 0);
  const total = logs.length;
  const week = logs.filter((l) => l.endedAt >= weekAgo).length;
  return { logs, total, week, totalMs, weekMs };
}

export function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "0m";
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${r.toString().padStart(2, "0")}m`;
}