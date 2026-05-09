import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Pick the best supported MIME type for recording. */
function getSupportedMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
    "", // browser default
  ];
  for (const mime of candidates) {
    if (mime === "" || MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

export function useRecording(
  meetingId: string,
  localStream: MediaStream | null,
  peers: { stream: MediaStream | null }[]
) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  /** Upload blob to Supabase storage and save metadata to transcripts table. */
  const upload = useCallback(async (blob: Blob): Promise<void> => {
    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Path must match RLS: recordings/<uid>/<file>
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const path = `recordings/${user.id}/${meetingId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(path, blob, { contentType: blob.type || "video/webm", upsert: false });

      if (uploadError) throw uploadError;

      // Get a long-lived signed URL (1 year) since the bucket is private
      const { data: signedData, error: signErr } = await supabase.storage
        .from("recordings")
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      if (signErr) throw signErr;
      const videoUrl = signedData?.signedUrl ?? "";

      const { error: dbError } = await supabase
        .from("transcripts" as any)
        .insert({
          meeting_id: meetingId,
          user_id: user.id,
          video_url: videoUrl,
          content: ["System: Video recording saved."],
        });

      if (dbError) throw dbError;

      toast.success("Recording saved to your activity section.");
    } catch (e: any) {
      console.error("Upload failed", e);
      toast.error(`Failed to save recording: ${e?.message ?? "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  }, [meetingId]);

  const start = useCallback(() => {
    if (!localStream) {
      toast.error("No media stream to record");
      return false;
    }

    chunksRef.current = [];
    try {
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = {
        videoBitsPerSecond: 2_500_000,
      };
      if (mimeType) options.mimeType = mimeType;

      const recorder = new MediaRecorder(localStream, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      // onstop fires async — we expose the promise via stopPromiseRef
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "video/webm",
        });
        upload(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // collect a chunk every second
      setRecording(true);
      return true;
    } catch (e: any) {
      console.error("Recording start failed", e);
      toast.error(`Failed to start recording: ${e?.message ?? ""}`);
      return false;
    }
  }, [localStream, upload]);

  /**
   * Stop recording and wait for the upload to finish.
   * Returns a Promise so callers can `await` it (e.g. the Leave button).
   */
  const stop = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setRecording(false);
        resolve();
        return;
      }

      // Override onstop to resolve after upload completes
      const mimeType = recorder.mimeType || "video/webm";
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await upload(blob);
        resolve();
      };

      recorder.stop();
      setRecording(false);
    });
  }, [upload]);

  return { recording, uploading, start, stop };
}