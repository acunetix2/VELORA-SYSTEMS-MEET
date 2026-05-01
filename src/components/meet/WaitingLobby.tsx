import { useState, useEffect } from "react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, Settings2, Copy, ArrowRight,
  AlertCircle, Loader2, Bell, Shield, Globe2, Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Props = {
  meetingId: string;
  userName: string;
  userAvatar: string | null;
  userColor?: string | null;
  privacy: "open" | "private";
  isWaiting: boolean;
  onJoin: (audioOn: boolean, videoOn: boolean) => void;
  onCancel: () => void;
  videoStream: MediaStream | null;
  videoOn: boolean;
  audioOn: boolean;
  onToggleAudio: (on: boolean) => void;
  onToggleVideo: (on: boolean) => void;
  onSelectAudioDevice?: (deviceId: string) => void;
  onSelectVideoDevice?: (deviceId: string) => void;
};

export function WaitingLobby({
  meetingId, userName, userAvatar, userColor, privacy, isWaiting, onJoin, onCancel,
  videoStream, videoOn, audioOn, onToggleAudio, onToggleVideo,
  onSelectAudioDevice, onSelectVideoDevice,
}: Props) {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const videoRef = useState<HTMLVideoElement | null>(null)[1];

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audio = devices.filter((d) => d.kind === "audioinput");
        const video = devices.filter((d) => d.kind === "videoinput");
        setAudioDevices(audio);
        setVideoDevices(video);
        if (audio.length > 0) setSelectedAudioId(audio[0].deviceId);
        if (video.length > 0) setSelectedVideoId(video[0].deviceId);
      } catch (err) {
        console.error("Failed to enumerate devices:", err);
      }
    };
    getDevices();
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/${meetingId}`)
      .then(() => toast.success("Meeting link copied"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 flex flex-col items-center justify-center p-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Header with logo */}
        <div className="flex items-center justify-between mb-8">
          <Logo />
          <div className="flex items-center gap-2 text-xs text-muted-foreground glass px-3 py-1.5 rounded-lg">
            {privacy === "private" ? (
              <>
                <Lock className="h-3.5 w-3.5 text-warning" />
                Private meeting
              </>
            ) : (
              <>
                <Globe2 className="h-3.5 w-3.5 text-primary" />
                Open meeting
              </>
            )}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Video preview */}
          <div className="flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-card/50 to-card/30 border border-glass-border aspect-video w-full group">
              {videoOn && videoStream ? (
                <>
                  <video
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    ref={(el) => {
                      if (el && videoStream) el.srcObject = videoStream;
                    }}
                  />
                  {/* Recording indicator if needed */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
                  <Avatar name={userName} src={userAvatar} color={userColor} size="2xl" />
                </div>
              )}

              {/* Camera toggle overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => onToggleVideo(!videoOn)}
                  className="h-12 w-12 rounded-full bg-primary/90 hover:bg-primary"
                  size="icon"
                >
                  {videoOn ? (
                    <VideoOff className="h-5 w-5" />
                  ) : (
                    <VideoIcon className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Status badge */}
              <div className="absolute top-3 right-3 glass rounded-lg px-2.5 py-1 text-[11px] font-medium text-foreground">
                {videoOn ? "📹 Camera on" : "📷 Camera off"}
              </div>
            </div>

            {/* Device settings (compact) */}
            <div className="glass rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                Device settings
              </h3>

              {audioDevices.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="audio-select" className="text-xs text-muted-foreground">
                    Microphone
                  </Label>
                  <Select value={selectedAudioId} onValueChange={(id) => {
                    setSelectedAudioId(id);
                    onSelectAudioDevice?.(id);
                  }}>
                    <SelectTrigger id="audio-select" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audioDevices.map((d) => (
                        <SelectItem key={d.deviceId} value={d.deviceId}>
                          {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {videoDevices.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="video-select" className="text-xs text-muted-foreground">
                    Camera
                  </Label>
                  <Select value={selectedVideoId} onValueChange={(id) => {
                    setSelectedVideoId(id);
                    onSelectVideoDevice?.(id);
                  }}>
                    <SelectTrigger id="video-select" className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {videoDevices.map((d) => (
                        <SelectItem key={d.deviceId} value={d.deviceId}>
                          {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Right: Join info & controls */}
          <div className="flex flex-col justify-between">
            {/* Meeting info */}
            <div className="glass rounded-2xl p-6 space-y-6 order-last md:order-first">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Meeting code
                </p>
                <p className="font-mono text-lg font-semibold text-primary mb-3">
                  {meetingId}
                </p>
                <Button
                  onClick={copyLink}
                  variant="secondary"
                  size="sm"
                  className="w-full gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy meeting link
                </Button>
              </div>

              <div className="h-px bg-glass-border" />

              <div>
                <p className="text-sm font-medium mb-4">Ready to join?</p>
                <p className="text-xs text-muted-foreground mb-4">
                  You're about to join as <span className="text-foreground font-medium">{userName}</span>
                </p>

                {isWaiting && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4 flex gap-3">
                    <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div className="text-xs text-warning">
                      Waiting for the host to admit you to this meeting…
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Media toggles & buttons */}
            <div className="space-y-3 order-first md:order-last">
              <div className="flex gap-3">
                <Button
                  onClick={() => onToggleAudio(!audioOn)}
                  variant={audioOn ? "default" : "destructive"}
                  size="lg"
                  className="flex-1 gap-2 h-11"
                >
                  {audioOn ? (
                    <>
                      <Mic className="h-5 w-5" />
                      Microphone on
                    </>
                  ) : (
                    <>
                      <MicOff className="h-5 w-5" />
                      Microphone off
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => onToggleVideo(!videoOn)}
                  variant={videoOn ? "default" : "destructive"}
                  size="lg"
                  className="flex-1 gap-2 h-11"
                >
                  {videoOn ? (
                    <>
                      <VideoIcon className="h-5 w-5" />
                      Camera on
                    </>
                  ) : (
                    <>
                      <VideoOff className="h-5 w-5" />
                      Camera off
                    </>
                  )}
                </Button>
              </div>

              <Button
                onClick={() => onJoin(audioOn, videoOn)}
                disabled={isWaiting}
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 h-12 text-base shadow-glow border-0"
              >
                {isWaiting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Waiting for host…
                  </>
                ) : (
                  <>
                    Join meeting
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              <Button
                onClick={onCancel}
                variant="ghost"
                className="w-full h-11"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          End-to-end encrypted • Your privacy is protected
        </div>
      </div>
    </div>
  );
}
