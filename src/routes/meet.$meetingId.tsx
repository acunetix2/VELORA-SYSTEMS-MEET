import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, getDisplayName } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWebRTC, type ConnectionQuality } from "@/hooks/useWebRTC";
import { useCaptions } from "@/hooks/useCaptions";
import { getLocalMeeting, type MeetingPrivacy, uuidv4 } from "@/lib/meeting";
import { useRecording } from "@/hooks/useRecording";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { WaitingLobby } from "@/components/meet/WaitingLobby";
import { VideoTile } from "@/components/meet/VideoTile";
import { ChatPanel, type ChatMessage } from "@/components/meet/ChatPanel";
import { ReactionsLayer, REACTION_EMOJIS, type Reaction } from "@/components/meet/ReactionsLayer";
import { QnAPanel, type Question } from "@/components/meet/QnAPanel";
import { NotesPanel, type SharedNote } from "@/components/meet/NotesPanel";
import { WhiteboardPanel, type DrawEvent } from "@/components/meet/WhiteboardPanel";
import { PollPanel, type Poll } from "@/components/meet/PollPanel";
import { AgendaPanel } from "@/components/meet/AgendaPanel";
import { BreakoutPanel } from "@/components/meet/BreakoutPanel";
import { useMeetingTimer, formatTimer } from "@/hooks/useMeetingTimer";
import { Logo } from "@/components/Logo";
import { gridStyle } from "@/lib/grid";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, MonitorX,
  PhoneOff, MessagesSquare, Captions, Copy, X, Sparkles, Lock, Unlock,
  Users, Wifi, WifiOff, Activity, Loader2, ShieldAlert, MicOff as MicOffIcon, Minimize2, Maximize2,
  Smile, Hand, MessageCircleQuestion, FileText, Circle, StopCircle, Presentation, BarChart3, Settings as SettingsIcon,
  Timer, BarChart2, CheckCircle2, ShieldCheck, LayoutGrid, Plus, MoreVertical, GraduationCap, Building2, ChevronRight,
  Info, Video
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trackMeetingJoin } from "@/lib/analytics";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";


const SOUNDS = {
  join: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3",
  leave: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
  chat: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
  hand: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  knock: "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3",
};

const playNotificationSound = (type: keyof typeof SOUNDS) => {
  if (typeof Audio === "undefined") return;
  try {
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.4;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  } catch (e) {
    console.warn("Failed to play sound", e);
  }
};

const searchSchema = z.object({
  mode: z.enum(["open", "private"]).optional().catch(undefined),
});

export const Route = createFileRoute("/meet/$meetingId")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      { title: `Velora Meet - ${params.meetingId}` },
      { name: "description", content: "Live video meeting on Velora." },
    ],
  }),
  component: MeetingComponent,
});

function MeetingComponent() {
  return (
    <MeetingAuthGate>
      <MeetingContainer />
    </MeetingAuthGate>
  );
}

/** Shows a branded sign-in prompt when the user is not authenticated. */
function MeetingAuthGate({ children }: { children: React.ReactNode }) {
  const { meetingId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your identity…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative glass rounded-3xl p-8 sm:p-10 max-w-md w-full text-center shadow-elegant flex flex-col items-center gap-6">
          {/* Logo */}
          <Logo />

          {/* Meeting badge */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3 w-full">
            <p className="text-xs text-muted-foreground font-medium mb-1">You've been invited to a meeting</p>
            <p className="font-mono text-sm font-bold text-primary tracking-widest">{meetingId}</p>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Sign in to join</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Velora Meet requires an account to join meetings — keeping conversations secure and private.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={() => navigate({ to: "/auth", search: { redirect: window.location.href, mode: "login" } as any })}
              className="w-full h-12 bg-gradient-primary text-primary-foreground border-0 shadow-glow font-bold"
            >
              Sign in to Velora
            </Button>
            <Button
              onClick={() => navigate({ to: "/auth", search: { redirect: window.location.href, mode: "signup" } as any })}
              variant="outline"
              className="w-full h-12 border-glass-border font-bold"
            >
              Create a free account
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Already signed in on another device? <button onClick={() => window.location.reload()} className="text-primary underline">Refresh</button>
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            End-to-end encrypted · Your privacy is protected
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const TRANSCRIPT_KEY = (id: string) => `velora:transcript:${id}`;

function MeetingContainer() {
  const [leftStatus, setLeftStatus] = useState<"ended" | "left" | null>(null);
  if (leftStatus) return <LeftMeetingScreen status={leftStatus} />;
  return <MeetingRoomInner onLeave={setLeftStatus} />;
}

function MeetingInfoBtn({ session, peopleCount }: { session: any, peopleCount: number }) {
  const title = session?.title || "Untitled Meeting";
  const desc = session?.description || "No description provided for this session.";
  const image = session?.image_url || session?.imageUrl;
  const host = session?.host?.display_name || "Organized by Velora";
  const capacity = session?.capacity || 100;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all">
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-glass-border sm:max-w-[440px] p-0 overflow-hidden rounded-[2.5rem] shadow-brand">
        <div className="relative h-40 bg-gradient-to-br from-blue-600/20 to-primary/10">
          {image ? (
            <img src={image} alt="Meeting preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center opacity-30">
              <Video className="h-16 w-16 text-primary" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">Meeting Details</span>
            <h2 className="text-2xl font-black text-foreground mt-2 line-clamp-1">{title}</h2>
          </div>
        </div>
        
        <div className="p-6 pt-2 space-y-6">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {desc}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card/40 border border-glass-border rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Host</span>
              <span className="text-xs font-bold truncate">{host}</span>
            </div>
            <div className="bg-card/40 border border-glass-border rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Participants</span>
              <span className="text-xs font-bold">{peopleCount} / {capacity}</span>
            </div>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">Secure Session</p>
              <p className="text-[10px] text-muted-foreground">End-to-end encrypted and moderated by host.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeftMeetingScreen({ status }: { status: "ended" | "left" }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate({ to: "/dashboard" });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <FullScreen>
      <Logo />
      <h2 className="text-2xl font-bold mt-4">
        {status === "ended" ? "The meeting has ended" : "You left the meeting"}
      </h2>
      <p className="text-muted-foreground mt-2">
        Returning to dashboard in {countdown} seconds...
      </p>
      <div className="flex gap-3 mt-6 w-full">
        {status === "left" && (
          <Button variant="secondary" className="flex-1 bg-card hover:bg-card/80 text-foreground" onClick={() => window.location.reload()}>Rejoin</Button>
        )}
        <Button className="flex-1 bg-gradient-primary border-0 text-primary-foreground shadow-glow" onClick={() => navigate({ to: "/dashboard" })}>Return Home</Button>
      </div>
    </FullScreen>
  );
}

function MeetingRoomInner({ onLeave }: { onLeave: (status: "ended" | "left") => void }) {
  const { meetingId } = Route.useParams();
  const search = Route.useSearch();
  const { user } = useAuth();
  const { profile } = useProfile();

  const local = getLocalMeeting(meetingId);
  const [isCreator, setIsCreator] = useState<boolean | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsCreator(false);
          return;
        }

        // Check DB for actual host_id and metadata
        const { data } = await supabase
          .from("meeting_sessions" as any)
          .select("*, host:profiles(*)")
          .eq("meeting_id", meetingId)
          .maybeSingle();

        if (data) {
          setIsCreator(data.host_id === user.id);
          setSession(data);
        } else {
          // Fallback to local storage if not in DB yet (e.g. legacy/instant)
          setIsCreator(!!local && local.hostUserId === user.id);
          setSession(local);
        }
      } catch (err) {
        console.error("Error verifying meeting access:", err);
        // Fallback to safe defaults on error
        setIsCreator(false);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [meetingId, local?.hostUserId]);

  const navigate = useNavigate();
  const expired = !!local?.expiresAt && Date.now() > local.expiresAt;
  useEffect(() => {
    if (expired && isCreator === false) {
      toast.error("This meeting link has expired.");
      navigate({ to: "/dashboard" });
    }
  }, [expired, isCreator, navigate]);

  const displayName = profile?.display_name || getDisplayName(user);
  const identity = useMemo(() => ({
    userId: user?.id ?? null,
    name: displayName,
    avatarUrl: profile?.avatar_url ?? null,
    color: profile?.color ?? null,
  }), [user?.id, displayName, profile?.avatar_url, profile?.color]);

  const initialPrivacy: MeetingPrivacy = (local?.privacy ?? search.mode ?? "open");

  if (loading) return (
    <FullScreen>
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground text-sm font-medium">Verifying access...</p>
    </FullScreen>
  );

  if (expired && isCreator === false) return null;

  return (
    <Room
      meetingId={meetingId}
      identity={identity}
      isCreator={isCreator as boolean}
      initialPrivacy={initialPrivacy}
      expiresAt={local?.expiresAt ?? null}
      session={session}
      onLeave={onLeave}
    />
  );
}

function Room({
  meetingId, identity, isCreator, initialPrivacy, expiresAt, session, onLeave,
}: {
  meetingId: string;
  identity: { userId: string | null; name: string; avatarUrl: string | null; color: string | null };
  isCreator: boolean;
  initialPrivacy: MeetingPrivacy;
  expiresAt: number | null;
  session: any;
  onLeave: (status: "ended" | "left") => void;
}) {
  const isMobile = useIsMobile();
  const rtc = useWebRTC({ meetingId, identity, isCreator, privacy: initialPrivacy });
  const captions = useCaptions(identity.name);
  const recording = useRecording(meetingId, rtc.localStream, rtc.peers);
  const timer = useMeetingTimer(rtc.isHost, rtc.channel);

  const [side, setSide] = useState<"chat" | "captions" | "people" | "qna" | "notes" | "whiteboard" | "polls" | "settings" | "agenda" | "breakout" | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [pinned, setPinned] = useState<string | null>(null); // peer id, or "self"
  const [selfMinimized, setSelfMinimized] = useState(false);
  const fullTranscriptRef = useRef<string[]>([]);

  // ---- New collaborative state ----
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({}); // peerId/"self" -> raised
  const [questions, setQuestions] = useState<Question[]>([]);
  const [unreadQna, setUnreadQna] = useState(0);
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [unreadNotes, setUnreadNotes] = useState(0);
  const [whiteboardEvents, setWhiteboardEvents] = useState<DrawEvent[]>([]);
  const [whiteboardClearTrigger, setWhiteboardClearTrigger] = useState(0);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [unreadPolls, setUnreadPolls] = useState(0);
  const [recordingPeers, setRecordingPeers] = useState<Record<string, boolean>>({});
  const [agenda, setAgenda] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [unreadAgenda, setUnreadAgenda] = useState(0);
  const [breakoutRooms, setBreakoutRooms] = useState<{ id: string; name: string; capacity: number }[]>([]);
  const [softFocus, setSoftFocus] = useState(false);
  // Track previous peer IDs so we can fire join/leave toasts.
  const prevPeerIdsRef = useRef<Set<string>>(new Set());

  // Live profile sync — broadcast my updated identity to peers
  useEffect(() => {
    if (rtc.status !== "joined") return;
    rtc.broadcastProfile(identity);
  }, [identity, rtc.status, rtc.broadcastProfile]);

  // Persist transcript
  useEffect(() => {
    if (captions.lines.length === 0) return;
    const newest = captions.lines[captions.lines.length - 1];
    fullTranscriptRef.current.push(`${newest.speaker}: ${newest.text}`);
    
    // Throttled save to Supabase every 10 lines to avoid spamming
    if (fullTranscriptRef.current.length % 10 === 0) {
      const save = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // We update or insert. Since we don't have a unique ID for the transcript session yet,
        // we can use a local state to track if we've already inserted for this meeting.
        // For simplicity in P2P, we just insert a new record or ideally update the existing one for this user+meeting.
        
        const { data: existing } = await supabase
          .from("transcripts" as any)
          .select("id")
          .eq("user_id", user.id)
          .eq("meeting_id", meetingId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("transcripts" as any)
            .update({ content: fullTranscriptRef.current })
            .eq("id", (existing as any).id);
        } else {
          await supabase
            .from("transcripts" as any)
            .insert({ user_id: user.id, meeting_id: meetingId, content: fullTranscriptRef.current });
        }
      };
      save();
    }
  }, [captions.lines, meetingId]);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("transcripts" as any)
        .select("content")
        .eq("user_id", user.id)
        .eq("meeting_id", meetingId)
        .maybeSingle();
      if (data) fullTranscriptRef.current = (data as any).content;
    };
    fetch();
  }, [meetingId]);

  // Track side panel in a ref so channel handlers don't need it as a dep
  const sideRef = useRef(side);
  useEffect(() => { sideRef.current = side; }, [side]);

  // Chat + agenda + breakout over realtime channel
  useEffect(() => {
    const ch = rtc.channel.current;
    if (!ch) return;
    const chatHandler = ({ payload }: { payload: { from: string; text?: string; fileUrl?: string; fileName?: string; id: string; ts: number } }) => {
      setChat((prev) => {
        // Deduplicate by id to prevent tripling from re-subscriptions
        if (prev.some((m) => m.id === payload.id)) return prev;
        return [...prev, { ...payload, self: false }];
      });
      if (sideRef.current !== "chat") setUnreadChat((u) => u + 1);
    };
    const agendaHandler = ({ payload }: { payload: any }) => {
      setAgenda(payload);
      if (sideRef.current !== "agenda") setUnreadAgenda(u => u + 1);
    };
    const breakoutHandler = ({ payload }: { payload: any }) => {
      setBreakoutRooms(payload);
      toast.info("Meeting breakout configuration updated.");
    };
    ch.on("broadcast", { event: "chat" }, chatHandler);
    ch.on("broadcast", { event: "agenda-update" }, agendaHandler);
    ch.on("broadcast", { event: "breakout-config" }, breakoutHandler);
  // Also clean up chat/agenda/breakout channel listeners safely
    return () => {
      // Handled by channel teardown in useWebRTC
    };
    // Only re-run when the channel changes, NOT when `side` changes
  }, [rtc.channel.current]);

  useEffect(() => { if (side === "chat") setUnreadChat(0); }, [side]);
  useEffect(() => { if (side === "qna") setUnreadQna(0); }, [side]);
  useEffect(() => { if (side === "notes") setUnreadNotes(0); }, [side]);

  // ---- Audio Notifications ----
  const lastPeersCount = useRef(rtc.peers.length);
  useEffect(() => {
    if (rtc.peers.length > lastPeersCount.current) {
      playNotificationSound("join");
    } else if (rtc.peers.length < lastPeersCount.current) {
      playNotificationSound("leave");
    }
    lastPeersCount.current = rtc.peers.length;
  }, [rtc.peers.length]);

  const lastWaitingCount = useRef(rtc.waiting.length);
  useEffect(() => {
    if (rtc.waiting.length > lastWaitingCount.current) {
      playNotificationSound("knock");
    }
    lastWaitingCount.current = rtc.waiting.length;
  }, [rtc.waiting.length]);

  const lastChatLen = useRef(chat.length);
  useEffect(() => {
    if (chat.length > lastChatLen.current) {
      const last = chat[chat.length - 1];
      if (last && !last.self) playNotificationSound("chat");
    }
    lastChatLen.current = chat.length;
  }, [chat.length]);

  const sendChat = (text: string) => {
    const msg = { id: uuidv4(), from: identity.name, text, ts: Date.now() };
    rtc.channel.current?.send({ type: "broadcast", event: "chat", payload: msg });
    setChat((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, { ...msg, self: true }];
    });
  };

  const sendFile = useCallback((fileUrl: string, fileName: string, fileSize?: number) => {
    const msg = { id: uuidv4(), from: identity.name, fileUrl, fileName, fileSize, ts: Date.now() };
    // Only broadcast small (<500KB) files over Supabase channel; large files arrive via P2P data channel
    if (!fileSize || fileSize <= 500 * 1024) {
      rtc.channel.current?.send({ type: "broadcast", event: "chat", payload: msg });
    }
    setChat((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, { ...msg, self: true }];
    });
  }, [identity.name, rtc.channel]);

  // ---- P2P file chunk assembler ----
  const incomingChunksRef = useRef<Record<string, {
    fileName: string; fileSize: number; totalChunks: number; mimeType: string;
    chunks: Record<number, string>; received: number;
  }>>({});

  useEffect(() => {
    rtc.setFileChunkHandler((raw: string, peerId: string) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.kind === "file-start") {
          incomingChunksRef.current[msg.id] = {
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            totalChunks: msg.totalChunks,
            mimeType: msg.mimeType,
            chunks: {},
            received: 0,
          };
        } else if (msg.kind === "file-chunk") {
          const transfer = incomingChunksRef.current[msg.id];
          if (!transfer) return;
          transfer.chunks[msg.index] = msg.data;
          transfer.received++;
        } else if (msg.kind === "file-end") {
          const transfer = incomingChunksRef.current[msg.id];
          if (!transfer) return;
          // Reassemble
          const binaryChunks = Object.values(transfer.chunks).map((b64) => {
            const binary = atob(b64);
            return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
          });
          const totalLength = binaryChunks.reduce((s, c) => s + c.length, 0);
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          binaryChunks.forEach((chunk) => { combined.set(chunk, offset); offset += chunk.length; });
          const blob = new Blob([combined], { type: transfer.mimeType });
          const url = URL.createObjectURL(blob);
          // Add to chat as incoming file
          const senderPeer = rtc.peers.find(p => p.id === peerId);
          const chatMsg = {
            id: msg.id,
            from: senderPeer?.name ?? "Peer",
            fileUrl: url,
            fileName: transfer.fileName,
            fileSize: transfer.fileSize,
            ts: Date.now(),
            self: false,
          };
          setChat((prev) => {
            if (prev.some((m) => m.id === chatMsg.id)) return prev;
            return [...prev, chatMsg];
          });
          if (side !== "chat") setUnreadChat((u) => u + 1);
          toast(`📎 ${chatMsg.from} shared a file: ${transfer.fileName}`);
          delete incomingChunksRef.current[msg.id];
        }
      } catch { /* ignore malformed */ }
    });
  }, [rtc.setFileChunkHandler, rtc.peers, side]);

  // ---- Helpers for new realtime events ----
  const sendOnChannel = useCallback((event: string, payload: unknown) => {
    rtc.channel.current?.send({ type: "broadcast", event, payload });
  }, [rtc.channel]);

  // Reactions
  const sendReaction = useCallback((emoji: string) => {
    const r: Reaction = { id: uuidv4(), emoji, from: identity.name, ts: Date.now() };
    setReactions((prev) => [...prev.slice(-30), r]);
    sendOnChannel("reaction", r);
  }, [identity.name, sendOnChannel]);

  // Raise hand
  const myHand = !!raisedHands["self"];
  const toggleHand = useCallback(() => {
    const next = !myHand;
    setRaisedHands((prev) => ({ ...prev, self: next }));
    sendOnChannel("hand", { from: rtc.selfId, name: identity.name, raised: next });
    if (next) toast(`${identity.name}, your hand is raised ✋`);
  }, [myHand, sendOnChannel, rtc.selfId, identity.name]);

  // Agenda
  const updateAgenda = useCallback((next: typeof agenda) => {
    setAgenda(next);
    sendOnChannel("agenda", next);
  }, [sendOnChannel]);

  // Q&A
  const askQuestion = useCallback((text: string) => {
    const q: Question = { id: uuidv4(), from: identity.name, text, ts: Date.now(), upvotes: [], answered: false };
    setQuestions((prev) => [...prev, q]);
    sendOnChannel("qna", { kind: "ask", question: q });
  }, [identity.name, sendOnChannel]);

  const upvoteQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.id !== id) return q;
      const has = q.upvotes.includes(rtc.selfId);
      return { ...q, upvotes: has ? q.upvotes.filter((u) => u !== rtc.selfId) : [...q.upvotes, rtc.selfId] };
    }));
    sendOnChannel("qna", { kind: "upvote", id, by: rtc.selfId });
  }, [sendOnChannel, rtc.selfId]);

  const markAnswered = useCallback((id: string) => {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answered: true } : q));
    sendOnChannel("qna", { kind: "answered", id });
  }, [sendOnChannel]);

  const answerQuestionTyped = useCallback((id: string, answer: string) => {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answered: true, hostAnswer: answer } : q));
    sendOnChannel("qna", { kind: "answer-typed", id, answer });
  }, [sendOnChannel]);

  const answerQuestionVerbal = useCallback((id: string) => {
    const q = questions.find(x => x.id === id);
    setQuestions((prev) => prev.map((item) => item.id === id ? { ...item, answered: true } : item));
    sendOnChannel("qna", { kind: "answer-verbal", id, from: q?.from || "User" });
  }, [sendOnChannel, questions]);

  // Notes
  const shareNote = useCallback((draft: Omit<SharedNote, "id" | "ts" | "fromHost">) => {
    const n: SharedNote = { ...draft, id: uuidv4(), ts: Date.now(), fromHost: identity.name };
    setNotes((prev) => [n, ...prev]);
    sendOnChannel("note", n);
  }, [identity.name, sendOnChannel]);

  // Whiteboard
  const handleDraw = useCallback((event: DrawEvent) => {
    setWhiteboardEvents(prev => [...prev, event]);
    sendOnChannel("whiteboard", { type: "draw", event });
  }, [sendOnChannel]);

  const handleWhiteboardClear = useCallback(() => {
    setWhiteboardClearTrigger(prev => prev + 1);
    setWhiteboardEvents([]);
    sendOnChannel("whiteboard", { type: "clear" });
  }, [sendOnChannel]);

  // Polls
  const createPoll = useCallback((question: string, options: string[]) => {
    const poll: Poll = {
      id: uuidv4(),
      question,
      options: options.map(o => ({ id: uuidv4(), text: o, votes: [] })),
      active: true,
    };
    setPolls(prev => [poll, ...prev]);
    sendOnChannel("poll", { kind: "create", poll });
    toast.success("Poll launched");
  }, [sendOnChannel]);

  const votePoll = useCallback((pollId: string, optionId: string) => {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        options: p.options.map(o => {
          if (o.id === optionId) return { ...o, votes: [...o.votes, rtc.selfId] };
          return { ...o, votes: o.votes.filter(v => v !== rtc.selfId) };
        }),
      };
    }));
    sendOnChannel("poll", { kind: "vote", pollId, optionId, by: rtc.selfId });
  }, [sendOnChannel, rtc.selfId]);

  const endPoll = useCallback((pollId: string) => {
    setPolls(prev => prev.map(p => p.id === pollId ? { ...p, active: false } : p));
    sendOnChannel("poll", { kind: "end", pollId });
    toast("Poll ended");
  }, [sendOnChannel]);

  // ---- Analytics ----
  useEffect(() => {
    if (rtc.status === "joined") {
      trackMeetingJoin(meetingId, rtc.isHost ? "host" : "participant");
    }
  }, [rtc.status, rtc.isHost, meetingId]);

  // Subscribe to all realtime broadcast events on the channel.
  // IMPORTANT: `side` is read via sideRef so this effect only runs once
  // per channel connection — preventing duplicate listener accumulation.
  useEffect(() => {
    const ch = rtc.channel.current;
    if (!ch) return;

    ch.on("broadcast", { event: "reaction" }, ({ payload }: { payload: Reaction }) => {
      setReactions((prev) => [...prev.slice(-30), payload]);
    });

    ch.on("broadcast", { event: "hand" }, ({ payload }: { payload: { from: string; name: string; raised: boolean } }) => {
      setRaisedHands((prev) => ({ ...prev, [payload.from]: payload.raised }));
      if (payload.raised) {
        toast(`✋ ${payload.name} raised their hand`);
        if (payload.from !== rtc.selfId) playNotificationSound("hand");
      }
    });

    ch.on("broadcast", { event: "screenshare-request" }, ({ payload }: { payload: { from: string; name: string } }) => {
      if (!rtc.isHost) return;
      toast(`🖥️ ${payload.name} wants to share their screen`, {
        action: {
          label: "Allow",
          onClick: () => {
            sendOnChannel("screenshare-response", { to: payload.from, allowed: true });
          }
        },
        cancel: {
          label: "Deny",
          onClick: () => {
            sendOnChannel("screenshare-response", { to: payload.from, allowed: false });
          }
        },
        duration: 10000
      });
    });

    ch.on("broadcast", { event: "screenshare-response" }, ({ payload }: { payload: { to: string; allowed: boolean } }) => {
      if (payload.to !== rtc.selfId) return;
      if (payload.allowed) {
        toast.success("Host allowed screen sharing");
        rtc.startScreenShare();
      } else {
        toast.error("Host denied screen sharing permission");
      }
    });

    ch.on("broadcast", { event: "qna" }, ({ payload }: { payload: { kind: "ask"; question: Question } | { kind: "upvote"; id: string; by: string } | { kind: "answered"; id: string } | { kind: "answer-typed"; id: string; answer: string } | { kind: "answer-verbal"; id: string; from: string } }) => {
      if (payload.kind === "ask") {
        setQuestions((prev) => prev.some((q) => q.id === payload.question.id) ? prev : [...prev, payload.question]);
        if (sideRef.current !== "qna") setUnreadQna((u) => u + 1);
      } else if (payload.kind === "upvote") {
        setQuestions((prev) => prev.map((q) => {
          if (q.id !== payload.id) return q;
          const has = q.upvotes.includes(payload.by);
          return { ...q, upvotes: has ? q.upvotes.filter((u) => u !== payload.by) : [...q.upvotes, payload.by] };
        }));
      } else if (payload.kind === "answered") {
        setQuestions((prev) => prev.map((q) => q.id === payload.id ? { ...q, answered: true } : q));
      } else if (payload.kind === "answer-typed") {
        setQuestions((prev) => prev.map((q) => q.id === payload.id ? { ...q, answered: true, hostAnswer: payload.answer } : q));
        toast.info("Host answered a question in Q&A");
      } else if (payload.kind === "answer-verbal") {
        setQuestions((prev) => prev.map((q) => q.id === payload.id ? { ...q, answered: true } : q));
        toast(`🎙️ Host is answering "${payload.from}'s" question verbally.`);
      }
    });

    ch.on("broadcast", { event: "note" }, ({ payload }: { payload: SharedNote }) => {
      setNotes((prev) => prev.some((n) => n.id === payload.id) ? prev : [payload, ...prev]);
      if (sideRef.current !== "notes") setUnreadNotes((u) => u + 1);
      toast.success(`📄 ${payload.fromHost} shared a note: ${payload.title}`);
    });

    ch.on("broadcast", { event: "whiteboard" }, ({ payload }: { payload: { type: "draw", event: DrawEvent } | { type: "clear" } }) => {
      if (payload.type === "draw") {
        setWhiteboardEvents(prev => [...prev, payload.event]);
      } else if (payload.type === "clear") {
        setWhiteboardClearTrigger(prev => prev + 1);
        setWhiteboardEvents([]);
      }
    });

    ch.on("broadcast", { event: "poll" }, ({ payload }: { payload: any }) => {
      if (payload.kind === "create") {
        setPolls(prev => [payload.poll, ...prev]);
        if (sideRef.current !== "polls") setUnreadPolls(u => u + 1);
        toast("📊 New poll: " + payload.poll.question);
      } else if (payload.kind === "vote") {
        setPolls(prev => prev.map(p => {
          if (p.id !== payload.pollId) return p;
          return {
            ...p,
            options: p.options.map(o => {
              if (o.id === payload.optionId) return { ...o, votes: [...o.votes, payload.by] };
              return { ...o, votes: o.votes.filter(v => v !== payload.by) };
            })
          };
        }));
      } else if (payload.kind === "end") {
        setPolls(prev => prev.map(p => p.id === payload.pollId ? { ...p, active: false } : p));
      }
    });

    ch.on("broadcast", { event: "rec" }, ({ payload }: { payload: { from: string; name: string; recording: boolean } }) => {
      setRecordingPeers((prev) => ({ ...prev, [payload.from]: payload.recording }));
      toast(payload.recording
        ? `⏺ ${payload.name} started recording the meeting`
        : `⏹ ${payload.name} stopped recording`);
    });

    return () => {
      // Supabase channel listeners are cleaned up when the channel itself is removed
      // by useWebRTC on unmount — no need to call ch.off() here.
      // This prevents the "ch.off is not a function" error.
    };
    // Intentionally NOT including `side` — we read it via sideRef to avoid
    // re-registering listeners on every panel switch (that's what caused tripling).
  }, [rtc.channel.current]);

  // ---- Join / leave toasts ----
  useEffect(() => {
    if (rtc.status !== "joined") return;
    const current = new Set(rtc.peers.map((p) => p.id));
    const prev = prevPeerIdsRef.current;
    rtc.peers.forEach((p) => {
      if (!prev.has(p.id)) toast(`👋 ${p.name} joined the meeting`);
    });
    prev.forEach((id) => {
      if (!current.has(id)) {
        // We don't have the name anymore — generic message is fine.
        toast("Someone left the meeting");
      }
    });
    prevPeerIdsRef.current = current;
  }, [rtc.peers, rtc.status]);

  // ---- Denial toast ----
  useEffect(() => {
    if (rtc.status === "denied") toast.error("The host did not admit you to this meeting.");
    if (rtc.status === "ended") onLeave("ended");
  }, [rtc.status, onLeave]);

  // ---- Recording toggle (host only) ----
  const toggleRecording = useCallback(async () => {
    if (!rtc.isHost) return;
    if (recording.recording) {
      await recording.stop();
      sendOnChannel("rec", { from: rtc.selfId, name: identity.name, recording: false });
      toast.success("Recording saved to your downloads");
    } else {
      const ok = recording.start();
      if (ok) {
        sendOnChannel("rec", { from: rtc.selfId, name: identity.name, recording: true });
        toast.success("Recording started — only you can stop it");
      }
    }
  }, [recording, rtc.isHost, rtc.selfId, identity.name, sendOnChannel]);

  // ---- Keyboard Shortcuts ----
  useEffect(() => {
    if (rtc.status !== "joined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        if (!rtc.audioOn) {
          rtc.toggleAudio();
          toast("Mic unmuted (Push-to-talk)", { id: "ptt" });
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        rtc.toggleAudio();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        rtc.toggleVideo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (rtc.audioOn) {
          rtc.toggleAudio();
          toast("Mic muted", { id: "ptt" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [rtc.status, rtc.audioOn, rtc.toggleAudio, rtc.toggleVideo]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/${meetingId}`)
      .then(() => toast.success("Meeting link copied — share it with anyone"));
  };

  const leave = useCallback(async () => {
    captions.stop();
    if (recording.recording) await recording.stop();
    // Save duration to analytics before leaving
    const durationMs = timer.display;
    if (durationMs > 0) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        const durationSecs = Math.floor(durationMs / 1000);
        await supabase
          .from("meeting_history" as any)
          .update({ duration_seconds: durationSecs })
          .eq("user_id", u.id)
          .eq("meeting_id", meetingId);
      }
    }
    rtc.cleanup?.();
    onLeave("left");
  }, [captions, recording, timer.display, meetingId, rtc, onLeave]);

  // ---- Pre-join screens ----
  if (rtc.status === "connecting") {
    return (
      <FullScreen>
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Setting up your camera & mic…</p>
      </FullScreen>
    );
  }
  if (rtc.status === "error") {
    return (
      <FullScreen>
        <ShieldAlert className="h-7 w-7 text-destructive" />
        <p className="text-sm text-destructive">{rtc.error ?? "Could not start the call."}</p>
        <Button variant="secondary" onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
      </FullScreen>
    );
  }
  if (rtc.status === "lobby" || rtc.status === "waiting") {
    return (
      <WaitingLobby
        meetingId={meetingId}
        userName={identity.name}
        userAvatar={identity.avatarUrl}
        userColor={identity.color}
        privacy={rtc.privacy}
        isWaiting={rtc.status === "waiting"}
        onJoin={(audioOn, videoOn) => rtc.joinRoom(audioOn, videoOn)}
        onCancel={() => navigate({ to: "/dashboard" })}
        videoStream={rtc.localStream}
        videoOn={rtc.videoOn}
        audioOn={rtc.audioOn}
        onToggleAudio={() => rtc.toggleAudio()}
        onToggleVideo={() => rtc.toggleVideo()}
        onSelectAudioDevice={rtc.selectAudioDevice}
        onSelectVideoDevice={rtc.selectVideoDevice}
      />
    );
  }
  if (rtc.status === "denied") {
    return (
      <FullScreen>
        <ShieldAlert className="h-7 w-7 text-destructive" />
        <h1 className="font-display text-2xl font-semibold">Not admitted</h1>
        <p className="text-sm text-muted-foreground">The host didn't admit you to this meeting.</p>
        <Button onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
      </FullScreen>
    );
  }
  if (rtc.status === "ended") {
    return (
      <FullScreen>
        <h1 className="font-display text-2xl font-semibold">Meeting ended</h1>
        <p className="text-sm text-muted-foreground">The host ended the call for everyone.</p>
        <Button onClick={() => navigate({ to: "/dashboard" })}>Back to dashboard</Button>
      </FullScreen>
    );
  }

  // ---- Joined ----
  const tileCount = rtc.peers.length + 1;
  const peopleCount = tileCount;

  // Auto-clear pin if the pinned peer left
  const pinnedPeer = pinned && pinned !== "self" ? rtc.peers.find((p) => p.id === pinned) ?? null : null;
  const effectivePinned = pinned === "self" ? "self" : (pinnedPeer ? pinned : null);
  const otherPeers = rtc.peers.filter((p) => p.id !== effectivePinned);
  const showSelfTile = !selfMinimized && effectivePinned !== "self";
  const stripCount = (effectivePinned === "self" ? rtc.peers.length : otherPeers.length) + (showSelfTile && effectivePinned ? 1 : 0);
  // Effective grid count when in normal grid mode
  const gridTiles = (selfMinimized ? 0 : 1) + rtc.peers.length || 1;

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-glass-border">
        <div className="flex items-center gap-3 min-w-0">
          <Logo />
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            · {meetingId}
          </span>
          {expiresAt && <ExpiryBadge expiresAt={expiresAt} />}
          <MeetingTimer timer={timer} isHost={rtc.isHost} />
          {recording.recording && (
            <span className="inline-flex items-center gap-1 text-[11px] glass rounded-md px-2 py-1 text-destructive">
              <Circle className="h-2.5 w-2.5 fill-destructive animate-pulse" /> Recording
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <MeetingInfoBtn session={session} peopleCount={peopleCount} />
          <NetworkDiagnosticsBtn rtc={rtc} />
          {rtc.locked && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] glass rounded-md px-2 py-1 text-warning">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={copyLink} className="gap-1.5 hidden sm:inline-flex">
            <Copy className="h-4 w-4" /> Invite
          </Button>
          <Button variant="ghost" size="icon" onClick={copyLink} className="sm:hidden h-9 w-9" title="Invite">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-hidden relative">
          {rtc.peers.length === 0 && rtc.status === "joined" && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 text-center">
              <div className="glass rounded-[2rem] px-8 py-6 border-glass-border shadow-glow flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-700">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">You're the only one here</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Share the meeting link with others to start collaborating.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyLink}
                  className="rounded-xl gap-2 font-bold pointer-events-auto border-primary/30 hover:bg-primary/5"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </Button>
              </div>
            </div>
          )}
          {effectivePinned ? (
            // Spotlight layout: one large tile + scrollable strip
            <div className="h-full flex flex-col md:flex-row gap-2 sm:gap-4">
              <div className="flex-1 min-h-0">
                {effectivePinned === "self" ? (
                  <VideoTile
                    stream={rtc.localStream}
                    name={identity.name}
                    avatarUrl={identity.avatarUrl}
                    color={identity.color}
                    isLocal
                    audioOn={rtc.audioOn}
                    videoOn={rtc.videoOn}
                    isHost={rtc.isHost}
                    pinned
                    onTogglePin={() => setPinned(null)}
                    spotlight
                    handRaised={!!raisedHands["self"]}
                    recording={recording.recording}
                    softFocus={softFocus}
                  />
                ) : pinnedPeer && (
                  <VideoTile
                    stream={pinnedPeer.stream}
                    name={pinnedPeer.name}
                    avatarUrl={pinnedPeer.avatarUrl}
                    color={pinnedPeer.color}
                    audioOn={pinnedPeer.audioOn}
                    videoOn={pinnedPeer.videoOn}
                    isHost={pinnedPeer.isHost || pinnedPeer.id === rtc.hostPeerId}
                    amHost={rtc.isHost}
                    onMakeHost={() => rtc.transferHost(pinnedPeer.id)}
                    onKick={() => rtc.kick(pinnedPeer.id)}
                    pinned
                    onTogglePin={() => setPinned(null)}
                    spotlight
                    handRaised={!!raisedHands[pinnedPeer.id]}
                    recording={!!recordingPeers[pinnedPeer.id]}
                  />
                )}
              </div>
              {stripCount > 0 && (
                <div className="md:w-48 lg:w-56 md:h-full overflow-auto no-scrollbar flex md:flex-col gap-2">
                  {effectivePinned !== "self" && showSelfTile && (
                    <div className="aspect-video shrink-0 md:w-full w-40">
                      <VideoTile
                        stream={rtc.localStream}
                        name={identity.name}
                        avatarUrl={identity.avatarUrl}
                        color={identity.color}
                        isLocal
                        audioOn={rtc.audioOn}
                        videoOn={rtc.videoOn}
                        isHost={rtc.isHost}
                        onTogglePin={() => setPinned("self")}
                        handRaised={!!raisedHands["self"]}
                        recording={recording.recording}
                        softFocus={softFocus}
                      />
                    </div>
                  )}
                  {(effectivePinned === "self" ? rtc.peers : otherPeers).map((p) => (
                    <div key={p.id} className="aspect-video shrink-0 md:w-full w-40">
                      <VideoTile
                        stream={p.stream}
                        name={p.name}
                        avatarUrl={p.avatarUrl}
                        color={p.color}
                        audioOn={p.audioOn}
                        videoOn={p.videoOn}
                        isHost={p.isHost || p.id === rtc.hostPeerId}
                        amHost={rtc.isHost}
                        onMakeHost={() => rtc.transferHost(p.id)}
                        onKick={() => rtc.kick(p.id)}
                        onTogglePin={() => setPinned(p.id)}
                        handRaised={!!raisedHands[p.id]}
                        recording={!!recordingPeers[p.id]}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Smart auto-grid
            <div className="grid gap-2 sm:gap-3 h-full" style={gridStyle(gridTiles, false, isMobile)}>
              {!selfMinimized && (
                <VideoTile
                  stream={rtc.localStream}
                  name={identity.name}
                  avatarUrl={identity.avatarUrl}
                  color={identity.color}
                  isLocal
                  audioOn={rtc.audioOn}
                  videoOn={rtc.videoOn}
                  isHost={rtc.isHost}
                  onTogglePin={() => setPinned("self")}
                  handRaised={!!raisedHands["self"]}
                  recording={recording.recording}
                  softFocus={softFocus}
                />
              )}
              {rtc.peers.map((p) => (
                <VideoTile
                  key={p.id}
                  stream={p.stream}
                  name={p.name}
                  avatarUrl={p.avatarUrl}
                  color={p.color}
                  audioOn={p.audioOn}
                  videoOn={p.videoOn}
                  isHost={p.isHost || p.id === rtc.hostPeerId}
                  amHost={rtc.isHost}
                  onMakeHost={() => rtc.transferHost(p.id)}
                  onKick={() => rtc.kick(p.id)}
                  onTogglePin={() => setPinned(p.id)}
                  handRaised={!!raisedHands[p.id]}
                  recording={!!recordingPeers[p.id]}
                />
              ))}
            </div>
          )}

          {/* Floating reactions overlay */}
          <ReactionsLayer reactions={reactions} />

          {/* Caption overlay */}
          {captions.enabled && (captions.interim || captions.lines.length > 0) && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-3xl w-[92%] z-10">
              <div className="glass rounded-2xl px-4 py-2.5 text-center">
                {captions.lines.slice(-1).map((l) => (
                  <p key={l.id} className="text-sm text-foreground/90">
                    <span className="text-primary font-medium">{l.speaker}:</span> {l.text}
                  </p>
                ))}
                {captions.interim && (
                  <p className="text-sm text-muted-foreground italic mt-1">{captions.interim}…</p>
                )}
              </div>
            </div>
          )}

          {/* Host: waiting room toast */}
          {rtc.isHost && rtc.waiting.length > 0 && side !== "people" && (
            <button
              onClick={() => setSide("people")}
              className="absolute top-3 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 text-xs sm:text-sm font-medium shadow-glow inline-flex items-center gap-2 animate-pulse-ring"
            >
              <Users className="h-4 w-4 text-primary" />
              {rtc.waiting.length} waiting · review
            </button>
          )}

          {/* Self-view minimize toggle (when not pinning self) */}
          {effectivePinned !== "self" && (
            <button
              onClick={() => setSelfMinimized((s) => !s)}
              className="absolute bottom-3 right-3 glass rounded-md p-1.5 text-[11px] inline-flex items-center gap-1 hover:bg-card/80"
              title={selfMinimized ? "Show self view" : "Hide self view"}
            >
              {selfMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{selfMinimized ? "Show me" : "Hide me"}</span>
            </button>
          )}
        </main>

        {/* Side panel */}
        {side && (
          <aside className="absolute md:static inset-0 md:inset-auto md:w-full md:max-w-sm md:border-l border-glass-border bg-card/80 backdrop-blur-2xl md:bg-card/40 flex flex-col z-20">
            <div className="flex items-center justify-between p-3 border-b border-glass-border">
              <h3 className="text-sm font-semibold capitalize">{side}</h3>
              <Button variant="ghost" size="icon" onClick={() => setSide(null)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {side === "chat" && (
              <div className="flex-1 overflow-hidden">
                <ChatPanel
                  messages={chat}
                  onSend={sendChat}
                  onSendFile={sendFile}
                  dataChannels={rtc.getAllDataChannels()}
                />
              </div>
            )}
            {side === "captions" && <CaptionsPanel captions={captions} />}
            {side === "people" && <PeoplePanel rtc={rtc} self={identity} />}
            {side === "qna" && (
              <div className="flex-1 overflow-hidden">
                <QnAPanel
                  questions={questions}
                  selfId={rtc.selfId}
                  isHost={rtc.isHost}
                  onAsk={askQuestion}
                  onUpvote={upvoteQuestion}
                  onMarkAnswered={markAnswered}
                  onAnswerTyped={answerQuestionTyped}
                  onAnswerVerbal={answerQuestionVerbal}
                />
              </div>
            )}
            {side === "notes" && (
              <div className="flex-1 overflow-hidden relative">
                <NotesPanel
                  notes={notes}
                  isHost={rtc.isHost}
                  hostName={rtc.peers.find((p) => p.id === rtc.hostPeerId)?.name ?? identity.name}
                  onShare={shareNote}
                />
              </div>
            )}
            {side === "whiteboard" && (
              <div className="flex-1 overflow-hidden">
                <WhiteboardPanel
                  onDraw={handleDraw}
                  incomingEvents={whiteboardEvents}
                  onClear={handleWhiteboardClear}
                  clearTrigger={whiteboardClearTrigger}
                />
              </div>
            )}
            {side === "agenda" && (
              <AgendaPanel
                items={agenda}
                onUpdate={(items) => { setAgenda(items); sendOnChannel("agenda-update", items); }}
                isHost={rtc.isHost}
              />
            )}
            {side === "breakout" && (
              <BreakoutPanel
                rooms={breakoutRooms}
                onUpdate={(rooms) => { setBreakoutRooms(rooms); sendOnChannel("breakout-config", rooms); }}
                isHost={rtc.isHost}
              />
            )}
            {side === "polls" && (
              <div className="flex-1 overflow-hidden relative">
                <PollPanel
                  polls={polls}
                  isHost={rtc.isHost}
                  selfId={rtc.selfId}
                  onCreatePoll={createPoll}
                  onVote={votePoll}
                  onEndPoll={endPoll}
                />
              </div>
            )}
            {side === "settings" && (
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <SettingsPanel 
                  rtc={rtc} 
                  softFocus={softFocus} 
                  onToggleSoftFocus={() => setSoftFocus(!softFocus)} 
                />
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Controls */}
      <footer className="px-2 sm:px-4 py-3 border-t border-glass-border safe-bottom">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <Ctl on={rtc.audioOn} onClick={rtc.toggleAudio} label={rtc.audioOn ? "Mute" : "Unmute"}
            icon={rtc.audioOn ? <Mic className="h-4 w-4 sm:h-5 sm:w-5" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />}
            onClass="bg-green-600 text-white shadow-lg shadow-green-500/20"
            offClass="bg-red-600 text-white shadow-lg shadow-red-500/20"
          />
          <Ctl on={rtc.videoOn} onClick={rtc.toggleVideo} label={rtc.videoOn ? "Camera off" : "Camera on"}
            icon={rtc.videoOn ? <VideoIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />}
            onClass="bg-green-600 text-white shadow-lg shadow-green-500/20"
            offClass="bg-red-600 text-white shadow-lg shadow-red-500/20"
          />
          <Ctl on={rtc.isScreenSharing} 
            onClick={() => {
              if (rtc.isScreenSharing) {
                rtc.stopScreenShare();
              } else {
                if (rtc.privacy === "private" && !rtc.isHost) {
                  toast.info("Requesting permission to share screen...");
                  sendOnChannel("screenshare-request", { from: rtc.selfId, name: identity.name });
                } else {
                  rtc.startScreenShare();
                }
              }
            }}
            label={rtc.isScreenSharing ? "Stop sharing" : "Share screen"}
            icon={rtc.isScreenSharing ? <MonitorX className="h-4 w-4 sm:h-5 sm:w-5" /> : <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />}
            onClass="bg-blue-600 text-white shadow-lg shadow-blue-500/20"
            offClass="glass"
          />

          <div className="w-px h-6 bg-glass-border mx-1 hidden sm:block" />

          {/* Reactions */}
          <Popover>
            <PopoverTrigger asChild>
              <button title="Reactions" className="h-9 w-9 sm:h-12 sm:w-12 grid place-items-center rounded-xl sm:rounded-2xl glass hover:bg-card/80">
                <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="glass border-glass-border w-auto p-2 mb-2">
              <div className="flex gap-1">
                {REACTION_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => sendReaction(e)}
                    className="h-10 w-10 grid place-items-center rounded-lg text-2xl hover:bg-primary/15 transition-smooth"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Ctl
            on={myHand}
            onClick={toggleHand}
            label={myHand ? "Lower hand" : "Raise hand"}
            icon={<Hand className={`h-4 w-4 sm:h-5 sm:w-5 ${myHand ? "fill-current" : ""}`} />}
            onClass="bg-blue-600 text-white shadow-lg shadow-blue-500/20"
            offClass="glass"
          />

          <div className="w-px h-6 bg-glass-border mx-1 hidden sm:block" />

          <Ctl on={side === "chat"} onClick={() => { setSide(side === "chat" ? null : "chat"); setUnreadChat(0); }} label="Chat"
            icon={<MessagesSquare className="h-4 w-4 sm:h-5 sm:w-5" />} badge={unreadChat > 0 ? unreadChat : undefined}
            onClass="bg-blue-600 text-white" offClass="glass" />
          <Ctl on={side === "people"} onClick={() => setSide(side === "people" ? null : "people")} label="People"
            icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} badge={peopleCount > 1 ? peopleCount : undefined}
            onClass="bg-blue-600 text-white" offClass="glass" />

          {/* More Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl glass hover:bg-card/80">
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-glass-border w-64 p-2 space-y-1">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-2 py-1.5">Collaboration tools</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSide("agenda")} className="rounded-xl gap-3">
                <LayoutGrid className="h-4 w-4" /> Agenda {unreadAgenda > 0 && <span className="ml-auto bg-primary text-white text-[10px] px-1.5 rounded-full">{unreadAgenda}</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSide("whiteboard")} className="rounded-xl gap-3">
                <Presentation className="h-4 w-4" /> Interactive whiteboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSide("notes")} className="rounded-xl gap-3">
                <FileText className="h-4 w-4" /> Shared notes {unreadNotes > 0 && <span className="ml-auto bg-primary text-white text-[10px] px-1.5 rounded-full">{unreadNotes}</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSide("polls")} className="rounded-xl gap-3">
                <BarChart3 className="h-4 w-4" /> Polls {unreadPolls > 0 && <span className="ml-auto bg-primary text-white text-[10px] px-1.5 rounded-full">{unreadPolls}</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSide("qna")} className="rounded-xl gap-3">
                <MessageCircleQuestion className="h-4 w-4" /> Q&A {unreadQna > 0 && <span className="ml-auto bg-primary text-white text-[10px] px-1.5 rounded-full">{unreadQna}</span>}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-glass-border mx-[-8px]" />
              
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-2 py-1.5">Settings & tools</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSide("breakout")} className="rounded-xl gap-3">
                <Building2 className="h-4 w-4" /> Breakout rooms
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => captions.toggle()} className="rounded-xl gap-3">
                <Captions className="h-4 w-4" /> {captions.enabled ? "Disable captions" : "Enable captions"}
              </DropdownMenuItem>
              {rtc.isHost && (
                <>
                  <DropdownMenuItem onClick={recording.recording ? recording.stop : recording.start} disabled={recording.uploading} className="rounded-xl gap-3">
                    {recording.uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      recording.recording ? <StopCircle className="h-4 w-4 text-destructive" /> : <Circle className="h-4 w-4 text-primary" />
                    )}
                    {recording.uploading ? "Saving..." : recording.recording ? "Stop recording" : "Record meeting"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-glass-border mx-[-8px]" />
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-2 py-1.5">Host controls</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => rtc.setLocked(!rtc.locked)} className="rounded-xl gap-3">
                    {rtc.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {rtc.locked ? "Unlock meeting" : "Lock meeting"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={rtc.muteEveryone} className="rounded-xl gap-3">
                    <MicOffIcon className="h-4 w-4" /> Mute everyone
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive rounded-xl gap-3" onClick={rtc.endForAll}>
                    <PhoneOff className="h-4 w-4" /> End for everyone
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator className="bg-glass-border mx-[-8px]" />
              <DropdownMenuItem onClick={() => setSide("settings")} className="rounded-xl gap-3">
                <SettingsIcon className="h-4 w-4" /> Device settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-glass-border mx-1 hidden sm:block" />

          <Button onClick={leave} variant="destructive" size="lg" className="rounded-xl sm:rounded-2xl px-3 sm:px-6 h-9 sm:h-12 shadow-brand flex items-center gap-2 font-bold">
            <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}



function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="glass rounded-3xl p-8 max-w-md w-full shadow-elegant flex flex-col items-center gap-4 text-center">
        {children}
      </div>
    </div>
  );
}

function ExpiryBadge({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const ms = expiresAt - now;
  if (ms <= 0) return (
    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] glass rounded-md px-2 py-1 text-destructive">
      Expired
    </span>
  );
  const mins = Math.floor(ms / 60_000);
  const hrs = Math.floor(mins / 60);
  const label = hrs > 0 ? `${hrs}h ${mins % 60}m left` : `${mins}m left`;
  const danger = ms < 5 * 60_000;
  return (
    <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] glass rounded-md px-2 py-1 ${danger ? "text-warning" : "text-muted-foreground"}`}>
      ⏳ {label}
    </span>
  );
}

function Ctl({ on, onClick, label, icon, onClass, offClass, badge }: {
  on: boolean; onClick: () => void; label: string; icon: React.ReactNode;
  onClass?: string; offClass?: string; badge?: number;
}) {
  const colorClass = on
    ? (onClass ?? "bg-green-600 text-white")
    : (offClass ?? "bg-red-600/20 text-red-400");
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative h-9 w-9 sm:h-12 sm:w-12 grid place-items-center rounded-xl sm:rounded-2xl transition-all duration-200 hover:opacity-90 ${colorClass}`}
    >
      {icon}
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full font-bold">{badge}</span>
      )}
    </button>
  );
}

function QualityIndicator({ quality, lowBw, onToggleLowBw }: {
  quality: ConnectionQuality; lowBw: boolean; onToggleLowBw: () => void;
}) {
  const map: Record<ConnectionQuality, { label: string; color: string; icon: React.ReactNode }> = {
    excellent: { label: "Excellent", color: "text-success", icon: <Wifi className="h-3.5 w-3.5" /> },
    good:      { label: "Good",      color: "text-success", icon: <Wifi className="h-3.5 w-3.5" /> },
    fair:      { label: "Fair",      color: "text-warning", icon: <Activity className="h-3.5 w-3.5" /> },
    poor:      { label: "Poor",      color: "text-destructive", icon: <WifiOff className="h-3.5 w-3.5" /> },
    unknown:   { label: "—",         color: "text-muted-foreground", icon: <Wifi className="h-3.5 w-3.5" /> },
  };
  const m = map[quality];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button title="Connection quality" className={`glass rounded-md px-2 py-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium ${m.color}`}>
          {m.icon} <span className="hidden sm:inline">{m.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-glass-border w-60">
        <DropdownMenuLabel className="font-normal">
          <p className={`text-sm font-medium ${m.color}`}>Network: {m.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Switch to low bandwidth if your video lags.</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleLowBw}>
          {lowBw ? "Disable low-bandwidth mode" : "Enable low-bandwidth mode"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CaptionsPanel({ captions }: { captions: ReturnType<typeof useCaptions> }) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-5 py-3 border-b border-glass-border">
        <p className="text-xs text-muted-foreground">
          {captions.enabled ? "Listening — captions appear in real time." : "Enable captions in the toolbar."}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {captions.lines.length === 0 && !captions.interim && (
          <p className="text-sm text-muted-foreground text-center pt-10">No transcript yet.</p>
        )}
        {captions.lines.map((l) => (
          <div key={l.id} className="text-sm">
            <span className="text-primary font-medium">{l.speaker}</span>
            <p className="text-foreground/90">{l.text}</p>
          </div>
        ))}
        {captions.interim && (
          <div className="text-sm">
            <span className="text-primary font-medium">…</span>
            <p className="text-muted-foreground italic">{captions.interim}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PeoplePanel({ rtc, self }: {
  rtc: ReturnType<typeof useWebRTC>;
  self: { name: string; avatarUrl: string | null; color: string | null };
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-5 py-3 border-b border-glass-border flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">In meeting · {rtc.peers.length + 1}</p>
        </div>
        {rtc.isHost && (
          <Button size="sm" variant={rtc.locked ? "secondary" : "ghost"} onClick={() => rtc.setLocked(!rtc.locked)} className="h-7 gap-1">
            {rtc.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {rtc.locked ? "Unlock" : "Lock"}
          </Button>
        )}
      </div>

      {rtc.isHost && rtc.waiting.length > 0 && (
        <div className="border-b border-glass-border">
          <p className="px-5 pt-3 text-xs uppercase tracking-wider text-warning font-semibold">Waiting room</p>
          <ul className="px-3 py-2 space-y-1">
            {rtc.waiting.map((w) => (
              <li key={w.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-card/40">
                <Avatar name={w.name} src={w.avatarUrl} color={w.color} size="sm" />
                <p className="flex-1 text-sm truncate">{w.name}</p>
                <Button size="sm" variant="ghost" onClick={() => rtc.deny(w.id)} className="h-7 px-2 text-xs">Deny</Button>
                <Button size="sm" onClick={() => rtc.admit(w.id)} className="h-7 px-2 text-xs bg-gradient-primary text-primary-foreground border-0">Admit</Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <PersonRow name={`${self.name} (you)`} avatarUrl={self.avatarUrl} color={self.color} isHost={rtc.isHost} />
        {rtc.peers.map((p) => (
          <PersonRow
            key={p.id}
            name={p.name}
            avatarUrl={p.avatarUrl}
            color={p.color}
            isHost={p.isHost || p.id === rtc.hostPeerId}
            audioOn={p.audioOn}
            videoOn={p.videoOn}
            actions={rtc.isHost ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">Manage</button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-glass-border">
                  <DropdownMenuItem onClick={() => rtc.transferHost(p.id)}>Make host</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => rtc.kick(p.id)}>Remove</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          />
        ))}
      </div>
    </div>
  );
}

function PersonRow({ name, avatarUrl, color, isHost, audioOn, videoOn, actions }: {
  name: string; avatarUrl: string | null; color?: string | null; isHost?: boolean; audioOn?: boolean; videoOn?: boolean; actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-card/40">
      <Avatar name={name} src={avatarUrl} color={color} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{name}{isHost && <span className="ml-1 text-[10px] text-primary uppercase tracking-wider">· Host</span>}</p>
      </div>
      {audioOn === false && <MicOff className="h-3.5 w-3.5 text-destructive" />}
      {videoOn === false && <VideoOff className="h-3.5 w-3.5 text-muted-foreground" />}
      {actions}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Meeting Timer                                                       */
/* ────────────────────────────────────────────────────────────────── */
function MeetingTimer({ timer, isHost }: { timer: ReturnType<typeof useMeetingTimer>; isHost: boolean }) {
  const { state, display, startStop, reset, setMode, setCountdownMinutes } = timer;
  const isCountdown = state.mode === "countdown";
  const nearEnd = isCountdown && display < 60_000; // < 1 min remaining

  // Don't render if never started
  if (!state.running && state.elapsed === 0) {
    if (!isHost) return null;
    return (
      <button
        onClick={startStop}
        title="Start timer"
        className="hidden sm:inline-flex items-center gap-1.5 glass rounded-md px-2 py-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground"
      >
        <Timer className="h-3 w-3" /> 00:00
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 glass rounded-md px-2 py-1.5 text-[11px] font-mono font-semibold ${
        nearEnd ? "text-destructive animate-pulse" : state.running ? "text-success" : "text-muted-foreground"
      }`}
      title={isCountdown ? "Countdown timer" : "Meeting stopwatch"}
    >
      <Timer className="h-3 w-3" />
      {formatTimer(display)}
      {isHost && (
        <button onClick={startStop} className="ml-1 opacity-60 hover:opacity-100">
          {state.running ? <StopCircle className="h-3 w-3" /> : <Circle className="h-3 w-3 fill-success text-success" />}
        </button>
      )}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Network Diagnostics Button                                          */
/* ────────────────────────────────────────────────────────────────── */
function NetworkDiagnosticsBtn({ rtc }: { rtc: ReturnType<typeof useWebRTC> }) {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof rtc.getNetworkStats>>>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await rtc.getNetworkStats();
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [rtc]);

  useEffect(() => {
    if (!open) return;
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [open, refresh]);

  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    excellent: { label: "Excellent", color: "text-success", icon: <Wifi className="h-3.5 w-3.5" /> },
    good:      { label: "Good",      color: "text-success", icon: <Wifi className="h-3.5 w-3.5" /> },
    fair:      { label: "Fair",      color: "text-warning", icon: <Activity className="h-3.5 w-3.5" /> },
    poor:      { label: "Poor",      color: "text-destructive", icon: <WifiOff className="h-3.5 w-3.5" /> },
    unknown:   { label: "—",         color: "text-muted-foreground", icon: <Wifi className="h-3.5 w-3.5" /> },
  };
  const m = map[rtc.quality];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          title="Connection quality & diagnostics"
          className={`glass rounded-md px-2 py-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium ${m.color}`}
        >
          {m.icon} <span className="hidden sm:inline">{m.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-glass-border w-72">
        <DropdownMenuLabel className="font-normal">
          <p className={`text-sm font-medium ${m.color}`}>Network: {m.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Live connection diagnostics (auto-refreshes every 3s)</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Security</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/10 text-success text-[10px] font-bold">
            <ShieldCheck className="h-3 w-3" /> E2EE
          </span>
        </div>
        <p className="px-3 pb-2 text-[10px] text-muted-foreground leading-tight">
          Your media is encrypted end-to-end via DTLS-SRTP. No one outside this call can listen or watch.
        </p>
        <DropdownMenuSeparator />

        {loading && stats.length === 0 && (
          <div className="px-3 py-4 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
          </div>
        )}

        {stats.length === 0 && !loading && (
          <p className="px-3 py-2 text-xs text-muted-foreground">No peers connected yet.</p>
        )}

        {stats.map((s, i) => (
          <div key={i} className="px-3 py-2 space-y-1.5">
            <p className="text-xs font-semibold text-foreground/70 truncate">Peer {s.peerId.slice(0, 8)}…</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <StatRow label="Packet Loss" value={`${s.packetLoss}%`} danger={s.packetLoss > 5} />
              <StatRow label="Jitter" value={`${s.jitter} ms`} danger={s.jitter > 50} />
              <StatRow label="Bitrate" value={`${s.bitrate} KB`} />
              <StatRow label="Round-trip" value={s.rtt > 0 ? `${s.rtt} ms` : "—"} danger={s.rtt > 200} />
            </div>
          </div>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => rtc.setLowBandwidth(!rtc.lowBandwidth)}>
          {rtc.lowBandwidth ? "Disable low-bandwidth mode" : "Enable low-bandwidth mode"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={`text-[10px] font-mono font-semibold ${danger ? "text-destructive" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Settings Panel                                                     */
/* ────────────────────────────────────────────────────────────────── */
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

function SettingsPanel({ rtc, softFocus, onToggleSoftFocus }: { 
  rtc: ReturnType<typeof useWebRTC>; 
  softFocus: boolean; 
  onToggleSoftFocus: () => void;
}) {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setAudioDevices(devices.filter(d => d.kind === "audioinput"));
      setVideoDevices(devices.filter(d => d.kind === "videoinput"));
    });
  }, []);

  return (
    <div className="flex flex-col h-full p-4 space-y-6 overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold mb-1">Visual Effects</h3>
        <p className="text-xs text-muted-foreground mb-4">Enhance your video presence.</p>
        
        <div className="flex items-center justify-between p-3 rounded-xl glass border-glass-border">
          <div className="flex flex-col gap-0.5">
            <Label className="text-sm font-medium">Soft Focus Blur</Label>
            <p className="text-[10px] text-muted-foreground">Apply a cinematic background blur effect.</p>
          </div>
          <Switch checked={softFocus} onCheckedChange={onToggleSoftFocus} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-1">Advanced Audio</h3>
        <p className="text-xs text-muted-foreground mb-4">Professional noise and echo management.</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl glass border-glass-border">
            <Label className="text-sm">Noise Suppression</Label>
            <Switch checked={true} disabled />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl glass border-glass-border">
            <Label className="text-sm">Echo Cancellation</Label>
            <Switch checked={true} disabled />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-1">Connection</h3>
        <p className="text-xs text-muted-foreground mb-4">Network and bandwidth management.</p>
        
        <div className="flex items-center justify-between p-3 rounded-xl glass border-glass-border">
          <div className="flex flex-col gap-0.5">
            <Label className="text-sm font-medium">Low Bandwidth Mode</Label>
            <p className="text-[10px] text-muted-foreground">Reduce video quality to save data.</p>
          </div>
          <Switch 
            checked={rtc.lowBandwidth} 
            onCheckedChange={() => rtc.setLowBandwidth(!rtc.lowBandwidth)} 
          />
        </div>
      </div>

      <div className="pt-4 mt-auto border-t border-glass-border text-center">
        <p className="text-[10px] text-muted-foreground italic">Velora Meet v2.4 Enterprise Edition</p>
      </div>
    </div>
  );
}
