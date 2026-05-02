import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRecording(meetingId: string, localStream: MediaStream | null, peers: { stream: MediaStream | null }[]) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(() => {
    if (!localStream) {
      toast.error("No media stream to record");
      return;
    }

    // Combine local and remote streams for a full recording
    // In a simple version, we just record the local user's perspective
    // For a real meeting platform, we might want to composite these onto a canvas
    // For now, let's record the local stream as the primary source
    
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(localStream, {
        mimeType: "video/webm;codecs=vp8,opus",
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        await upload(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // chunk every second
      setRecording(true);
      toast.info("Recording started. Please stay in the meeting to ensure it saves correctly.");
    } catch (e) {
      console.error("Recording failed", e);
      toast.error("Failed to start recording");
    }
  }, [localStream]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, [recording]);

  const upload = async (blob: Blob) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const path = `recordings/${user.id}/${meetingId}_${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("recordings")
        .upload(path, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("recordings").getPublicUrl(path);

      // Save reference in transcripts or a new recordings table
      // Let's use transcripts table as it already exists and holds meeting history
      const { error: dbError } = await supabase
        .from("transcripts" as any)
        .insert({
          meeting_id: meetingId,
          user_id: user.id,
          video_url: publicUrl,
          content: ["System: Video recording saved."],
        });

      if (dbError) throw dbError;

      toast.success("Recording saved to your activity section.");
    } catch (e) {
      console.error("Upload failed", e);
      toast.error("Failed to save recording.");
    } finally {
      setUploading(false);
    }
  };

  return { recording, uploading, start, stop };
}