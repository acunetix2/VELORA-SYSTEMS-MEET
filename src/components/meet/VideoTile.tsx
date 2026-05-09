import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Crown, MoreVertical, UserMinus, ShieldCheck, Pin, PinOff, Hand, Circle, PictureInPicture2 } from "lucide-react";
import { Avatar, colorForName } from "@/components/Avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  stream: MediaStream | null;
  name: string;
  avatarUrl?: string | null;
  muted?: boolean;
  isLocal?: boolean;
  audioOn: boolean;
  videoOn: boolean;
  color?: string | null;
  isHost?: boolean;
  // when the local user is host and this tile isn't theirs
  amHost?: boolean;
  onMakeHost?: () => void;
  onKick?: () => void;
  /** Pin/unpin this tile to the spotlight slot. */
  pinned?: boolean;
  onTogglePin?: () => void;
  /** Visual size hints for the smart grid */
  spotlight?: boolean;
  /** When true, show a raised-hand indicator. */
  handRaised?: boolean;
  /** When true, show a recording dot. */
  recording?: boolean;
  /** Cinematic background blur / soft focus effect. */
  softFocus?: boolean;
};

export function VideoTile({
  stream, name, avatarUrl, color, muted, isLocal, audioOn, videoOn, isHost, amHost, onMakeHost, onKick,
  pinned, onTogglePin, spotlight, handRaised, recording, softFocus,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!audioOn || !stream) {
      setIsSpeaking(false);
      return;
    }
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    let ac: AudioContext;
    let rafId: number;
    try {
      ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = ac.createAnalyser();
      analyzer.fftSize = 256;
      const source = ac.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyzer);

      const dataArray = new Uint8Array(analyzer.frequencyBinCount);

      const checkAudioLevel = () => {
        analyzer.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        setIsSpeaking(average > 15); // Adjust sensitivity if needed
        rafId = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();
    } catch (e) {
      console.warn("AudioContext failed", e);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (ac && ac.state !== "closed") ac.close().catch(() => {});
    };
  }, [stream, audioOn]);

  let ringClass = "";
  if (spotlight) ringClass = "ring-2 ring-primary/60 shadow-glow z-10";
  else if (handRaised) ringClass = "ring-2 ring-warning/70 shadow-glow shadow-warning/20 z-10";
  else if (isSpeaking) ringClass = "ring-[3px] animate-speaking scale-[1.01] z-20";

  // Extract a solid color from the gradient for the glow effect
  const bg = colorForName(name, color);
  let glowColor = "#22c55e"; // default green
  if (bg.includes("oklch")) {
    const match = bg.match(/oklch\([^)]+\)/);
    if (match) glowColor = match[0];
  } else if (color && !color.includes("gradient")) {
    glowColor = color;
  }

  return (
    <div 
      className={`relative rounded-xl sm:rounded-2xl overflow-hidden glass transition-all duration-300 min-h-[120px] h-full w-full ${ringClass}`}
      style={isSpeaking ? { "--speaking-color": glowColor } as any : {}}
    >
      {stream && (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted || isLocal}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""} ${softFocus ? "blur-[6px]" : ""} ${!videoOn ? "invisible h-0 w-0" : ""}`}
        />
      )}
      {(!videoOn || !stream) && (
        <div
          className="absolute inset-0 grid place-items-center"
          style={{ backgroundImage: colorForName(name, color) }}
        >
          <Avatar name={name} src={avatarUrl ?? null} color={color} size={spotlight ? "2xl" : "xl"} />
        </div>
      )}

      {/* host crown */}
      {isHost && (
        <div className="absolute top-2 left-2 glass rounded-md px-1.5 py-1 flex items-center gap-1 text-[10px] font-medium text-primary">
          <Crown className="h-3 w-3" /> Host
        </div>
      )}

      {/* raised hand */}
      {handRaised && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 glass rounded-full px-2 py-1 flex items-center gap-1 text-[11px] font-medium text-warning animate-bounce">
          <Hand className="h-3.5 w-3.5" /> Hand raised
        </div>
      )}

      {/* recording */}
      {recording && (
        <div className="absolute top-2 right-12 glass rounded-md px-1.5 py-1 flex items-center gap-1 text-[10px] font-medium text-destructive">
          <Circle className="h-2.5 w-2.5 fill-destructive text-destructive animate-pulse" /> REC
        </div>
      )}

      {/* tile actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {videoOn && stream && (
          <button
            onClick={async () => {
              try {
                if (document.pictureInPictureElement) await document.exitPictureInPicture();
                else if (ref.current) await ref.current.requestPictureInPicture();
              } catch (e) { console.warn(e); }
            }}
            title="Picture-in-Picture"
            className="glass rounded-md p-1 hover:bg-card/80 pointer-events-auto"
          >
            <PictureInPicture2 className="h-3.5 w-3.5 text-foreground" />
          </button>
        )}
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            title={pinned ? "Unpin" : "Pin"}
            className="glass rounded-md p-1 hover:bg-card/80 pointer-events-auto"
          >
            {pinned ? <PinOff className="h-3.5 w-3.5 text-primary" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
        )}
        {amHost && !isLocal && (onMakeHost || onKick) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="glass rounded-md p-1 hover:bg-card/80 pointer-events-auto">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-glass-border">
              {onMakeHost && (
                <DropdownMenuItem onClick={onMakeHost}>
                  <ShieldCheck className="h-4 w-4 mr-2" /> Make host
                </DropdownMenuItem>
              )}
              {onKick && (
                <DropdownMenuItem onClick={onKick} className="text-destructive">
                  <UserMinus className="h-4 w-4 mr-2" /> Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
        <span className="text-[11px] sm:text-xs glass px-2 py-1 rounded-md font-medium truncate max-w-[70%]">
          {name}{isLocal ? " (you)" : ""}
        </span>
        <span className="glass rounded-md p-1.5">
          {audioOn ? <Mic className="h-3.5 w-3.5 text-primary" /> : <MicOff className="h-3.5 w-3.5 text-destructive" />}
        </span>
      </div>
    </div>
  );
}
