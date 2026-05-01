import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Local meeting recording. Records the host's local stream (camera + mic, or
 * screen-share when active because it replaces the local video track) into a
 * .webm file the host can download when they stop.
 *
 * This is intentionally LOCAL ONLY — no server upload — to keep things simple
 * and private. Other participants are notified via a separate broadcast.
 */
export function useRecording(getStream: () => MediaStream | null) {
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const [recording, setRecording] = useState(false);

  const start = useCallback(() => {
    const stream = getStream();
    if (!stream) {
      toast.error("Recording needs an active camera or mic.");
      return false;
    }
    if (recRef.current) return true;
    try {
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_500_000 });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(1000); // gather 1s chunks
      recRef.current = rec;
      startedAtRef.current = Date.now();
      setRecording(true);
      return true;
    } catch (e) {
      console.error(e);
      toast.error("Couldn't start recording on this device.");
      return false;
    }
  }, [getStream]);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    return new Promise<void>((resolve) => {
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        a.href = url;
        a.download = `velora-meeting-${ts}.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        recRef.current = null;
        chunksRef.current = [];
        setRecording(false);
        resolve();
      };
      rec.stop();
    });
  }, []);

  // Stop on unmount — but DO NOT trigger a download from a teardown effect.
  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* noop */ } }, []);

  return { recording, start, stop };
}