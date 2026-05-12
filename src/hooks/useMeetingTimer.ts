import { useState, useEffect, useRef, useCallback } from "react";

/** Stopwatch / countdown timer synced over a Supabase broadcast channel. */
export type TimerMode = "stopwatch" | "countdown";
export type TimerState = {
  mode: TimerMode;
  running: boolean;
  startedAt: number | null;   // epoch ms when current run began
  elapsed: number;            // ms accumulated before current run
  duration: number;           // countdown target ms
};

const DEFAULT: TimerState = {
  mode: "stopwatch",
  running: false,
  startedAt: null,
  elapsed: 0,
  duration: 5 * 60 * 1000,
};

export function useMeetingTimer(isHost: boolean, channel: React.MutableRefObject<any>) {
  const [state, setState] = useState<TimerState>(DEFAULT);
  const [display, setDisplay] = useState(0); // ms to display
  const rafRef = useRef<number | undefined>(undefined);

  // Tick
  useEffect(() => {
    const tick = () => {
      setState((s) => {
        if (!s.running || s.startedAt === null) {
          setDisplay(s.mode === "countdown" ? s.duration - s.elapsed : s.elapsed);
          return s;
        }
        const now = Date.now();
        const total = s.elapsed + (now - s.startedAt);
        if (s.mode === "countdown") {
          setDisplay(Math.max(0, s.duration - total));
          if (total >= s.duration) {
            return { ...s, running: false, elapsed: s.duration, startedAt: null };
          }
        } else {
          setDisplay(total);
        }
        return s;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Subscribe to channel events
  useEffect(() => {
    const ch = channel.current;
    if (!ch) return;
    ch.on("broadcast", { event: "timer" }, ({ payload }: { payload: TimerState }) => {
      setState(payload);
    });
  }, [channel]);

  const broadcast = useCallback((next: TimerState) => {
    const ch = channel.current;
    if (!ch || !isHost) return;
    ch.send({ type: "broadcast", event: "timer", payload: next }).catch(() => {});
    setState(next);
  }, [channel, isHost]);

  const startStop = useCallback(() => {
    setState((s) => {
      const next: TimerState = s.running
        ? { ...s, running: false, elapsed: s.elapsed + (s.startedAt ? Date.now() - s.startedAt : 0), startedAt: null }
        : { ...s, running: true, startedAt: Date.now() };
      broadcast(next);
      return next;
    });
  }, [broadcast]);

  const reset = useCallback(() => {
    const next: TimerState = { ...DEFAULT };
    broadcast(next);
  }, [broadcast]);

  const setMode = useCallback((mode: TimerMode) => {
    const next: TimerState = { ...DEFAULT, mode };
    broadcast(next);
  }, [broadcast]);

  const setCountdownMinutes = useCallback((mins: number) => {
    const next: TimerState = { ...DEFAULT, mode: "countdown", duration: mins * 60 * 1000 };
    broadcast(next);
  }, [broadcast]);

  return { state, display, startStop, reset, setMode, setCountdownMinutes };
}

export function formatTimer(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
