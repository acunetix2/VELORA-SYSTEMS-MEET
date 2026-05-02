import { useCallback, useEffect, useRef, useState } from "react";
import { uuidv4 } from "@/lib/meeting";

// Minimal types for the Web Speech API (not in TS lib by default)
type SRConstructor = new () => SpeechRecognition;
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { isFinal: boolean; 0: { transcript: string } };
  };
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}

export type CaptionLine = { id: string; speaker: string; text: string; ts: number };

export function useCaptions(speaker: string) {
  const [enabled, setEnabled] = useState(false);
  const [interim, setInterim] = useState("");
  const [lines, setLines] = useState<CaptionLine[]>([]);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SpeechRecognition | null>(null);
  const stoppedManually = useRef(false);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) setSupported(false);
  }, []);

  const stop = useCallback(() => {
    stoppedManually.current = true;
    setEnabled(false);
    setInterim("");
    recRef.current?.stop();
    recRef.current = null;
  }, []);

  const start = useCallback(() => {
    const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    stoppedManually.current = false;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript;
        if (r.isFinal) {
          setLines((prev) => [
            ...prev,
            { id: uuidv4(), speaker, text: text.trim(), ts: Date.now() },
          ]);
        } else {
          interimText += text;
        }
      }
      setInterim(interimText.trim());
    };

    rec.onerror = (e) => {
      console.warn("speech rec error", e);
    };

    rec.onend = () => {
      setInterim("");
      // auto-restart if user didn't stop manually (Chrome stops after silence)
      if (!stoppedManually.current) {
        try { rec.start(); } catch { /* ignore */ }
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      setEnabled(true);
    } catch (err) {
      console.warn("rec start failed", err);
    }
  }, [speaker]);

  useEffect(() => () => stop(), [stop]);

  return { enabled, interim, lines, supported, start, stop, setLines };
}
