import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type RemotePeer = {
  id: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  stream: MediaStream | null;
  audioOn: boolean;
  videoOn: boolean;
  isHost: boolean;
  color: string | null;
};

export type WaitingPerson = {
  id: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  color: string | null;
  ts: number;
};

export type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "unknown";

export type MeetingPrivacy = "open" | "private";

type Identity = {
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  color: string | null;
};

type SignalPayload =
  // discovery
  | { kind: "hello"; from: string; userId: string | null; name: string; avatarUrl: string | null; color: string | null }
  | { kind: "room-state"; from: string; to: string; privacy: MeetingPrivacy; locked: boolean; hostUserId: string | null; hostPeerId: string }
  // waiting room
  | { kind: "knock"; from: string; userId: string | null; name: string; avatarUrl: string | null; color: string | null }
  | { kind: "admit"; from: string; to: string }
  | { kind: "deny"; from: string; to: string }
  // peer connection
  | { kind: "join"; from: string; userId: string | null; name: string; avatarUrl: string | null; color: string | null }
  | { kind: "leave"; from: string }
  | { kind: "offer"; from: string; to: string; userId: string | null; name: string; avatarUrl: string | null; color: string | null; sdp: RTCSessionDescriptionInit }
  | { kind: "answer"; from: string; to: string; userId: string | null; name: string; avatarUrl: string | null; color: string | null; sdp: RTCSessionDescriptionInit }
  | { kind: "ice"; from: string; to: string; candidate: RTCIceCandidateInit }
  | { kind: "media"; from: string; audioOn: boolean; videoOn: boolean }
  // host actions
  | { kind: "lock"; from: string; locked: boolean }
  | { kind: "host-transfer"; from: string; to: string; toUserId: string | null }
  | { kind: "kick"; from: string; to: string }
  | { kind: "end-all"; from: string }
  | { kind: "mute-all"; from: string }
  // live profile sync
  | { kind: "profile-update"; from: string; userId: string | null; name: string; avatarUrl: string | null; color: string | null };

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type Options = {
  meetingId: string;
  identity: Identity;
  /** "private" lobbies + waiting room. "open" admits everyone instantly. */
  privacy: MeetingPrivacy;
  /** True when the local user created this meeting. */
  isCreator: boolean;
};

export type RoomStatus = "connecting" | "lobby" | "waiting" | "joined" | "denied" | "ended" | "error";

export function useWebRTC({ meetingId, identity, privacy: initialPrivacy, isCreator }: Options) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, RemotePeer>>({});
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<RoomStatus>("connecting");

  // Host / privacy
  const [privacy, setPrivacy] = useState<MeetingPrivacy>(initialPrivacy);
  const [locked, setLocked] = useState(false);
  const [hostPeerId, setHostPeerId] = useState<string | null>(isCreator ? "self" : null);
  const [hostUserId, setHostUserId] = useState<string | null>(isCreator ? identity.userId : null);
  const [waiting, setWaiting] = useState<WaitingPerson[]>([]);
  const admittedRef = useRef<Set<string>>(new Set()); // host: peerIds we've admitted

  // Connection quality + low bandwidth
  const [quality, setQuality] = useState<ConnectionQuality>("unknown");
  const [lowBandwidth, setLowBandwidth] = useState(false);

  const selfIdRef = useRef<string>(crypto.randomUUID());
  const isHostRef = useRef<boolean>(isCreator);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const lowBwRef = useRef(false);
  const sentJoinRef = useRef(false);
  // File-transfer data channels: one per peer connection
  const dataChannelsRef = useRef<Record<string, RTCDataChannel>>({});
  const fileChunkHandlerRef = useRef<((data: string, peerId: string) => void) | null>(null);
  // Live refs so callbacks always read the latest values
  const audioOnRef = useRef(true);
  const videoOnRef = useRef(true);
  const identityRef = useRef(identity);
  useEffect(() => { audioOnRef.current = audioOn; }, [audioOn]);
  useEffect(() => { videoOnRef.current = videoOn; }, [videoOn]);
  useEffect(() => { identityRef.current = identity; }, [identity]);

  // Keep a stable reference to current host peer id (used in signal handler closure)
  const hostPeerIdRef = useRef<string | null>(isCreator ? "self" : null);
  useEffect(() => { hostPeerIdRef.current = hostPeerId; }, [hostPeerId]);

  const privacyRef = useRef(initialPrivacy);
  const lockedRef = useRef(false);
  useEffect(() => { privacyRef.current = privacy; }, [privacy]);
  useEffect(() => { lockedRef.current = locked; }, [locked]);

  const send = useCallback((payload: SignalPayload) => {
    channelRef.current?.send({ type: "broadcast", event: "signal", payload });
  }, []);

  const updatePeer = useCallback((id: string, patch: Partial<RemotePeer>) => {
    setPeers((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { id, userId: null, name: "Guest", avatarUrl: null, color: null, stream: null, audioOn: true, videoOn: true, isHost: false }),
        ...patch,
      },
    }));
  }, []);

  const removePeer = useCallback((id: string) => {
    pcsRef.current[id]?.close();
    delete pcsRef.current[id];
    setPeers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setWaiting((prev) => prev.filter((w) => w.id !== id));
  }, []);

  // ---- Apply low-bandwidth mode to all senders ----
  const applyLowBandwidth = useCallback(async (on: boolean) => {
    lowBwRef.current = on;
    setLowBandwidth(on);
    const camera = cameraTrackRef.current;
    if (camera) {
      try {
        if (on) {
          await camera.applyConstraints({ width: 320, height: 180, frameRate: 12 });
        } else {
          await camera.applyConstraints({ width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24 } });
        }
      } catch { /* ignore */ }
    }
    Object.values(pcsRef.current).forEach((pc) => {
      pc.getSenders().forEach((s) => {
        if (s.track?.kind !== "video") return;
        const params = s.getParameters();
        if (!params.encodings) params.encodings = [{}];
        params.encodings[0].maxBitrate = on ? 150_000 : 1_200_000;
        params.encodings[0].scaleResolutionDownBy = on ? 4 : 1;
        s.setParameters(params).catch(() => {});
      });
    });
  }, []);

  const createPC = useCallback(
    (peerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcsRef.current[peerId] = pc;

      const ls = localStreamRef.current;
      if (ls) ls.getTracks().forEach((t) => pc.addTrack(t, ls));

      // ---- File-transfer data channel (offerer creates it) ----
      const dc = pc.createDataChannel("velora-files", { ordered: true });
      dataChannelsRef.current[peerId] = dc;
      dc.onmessage = (e) => {
        fileChunkHandlerRef.current?.(e.data as string, peerId);
      };

      // ---- Answerer receives the data channel ----
      pc.ondatachannel = (e) => {
        const remoteDc = e.channel;
        dataChannelsRef.current[peerId] = remoteDc;
        remoteDc.onmessage = (ev) => {
          fileChunkHandlerRef.current?.(ev.data as string, peerId);
        };
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          send({ kind: "ice", from: selfIdRef.current, to: peerId, candidate: e.candidate.toJSON() });
        }
      };

      pc.ontrack = (e) => {
        const [stream] = e.streams;
        updatePeer(peerId, { stream });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          delete dataChannelsRef.current[peerId];
          removePeer(peerId);
        }
      };

      // Re-apply current bandwidth profile to new senders
      if (lowBwRef.current) {
        setTimeout(() => applyLowBandwidth(true), 100);
      }

      return pc;
    },
    [send, updatePeer, removePeer, applyLowBandwidth]
  );

  // ---- Initialise: get local media + join channel ----
  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    (async () => {
      try {
        // Get camera + mic
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
        setLocalStream(stream);

        channel = supabase.channel(`velora-meet-${meetingId}`, {
          config: { broadcast: { self: false } },
        });
        channelRef.current = channel;

        const me = selfIdRef.current;

        channel.on("broadcast", { event: "signal" }, async ({ payload }) => {
          const msg = payload as SignalPayload;

          // ---- Discovery ----
          if (msg.kind === "hello" && msg.from !== me) {
            // If I'm host, respond with the room state so the newcomer knows whether to knock
            if (isHostRef.current) {
              send({
                kind: "room-state", from: me, to: msg.from,
                privacy, locked,
                hostUserId: identity.userId, hostPeerId: me,
              });
            }
            return;
          }

          if (msg.kind === "room-state" && msg.to === me) {
            setHostPeerId(msg.hostPeerId);
            setHostUserId(msg.hostUserId);
            setPrivacy(msg.privacy);
            setLocked(msg.locked);
            // If this user is the host (matched by userId), upgrade
            if (msg.hostUserId && identity.userId && msg.hostUserId === identity.userId) {
              isHostRef.current = true;
              setHostPeerId(me);
            }
            return;
          }

          // ---- Waiting room ----
          if (msg.kind === "knock" && isHostRef.current) {
            setWaiting((prev) =>
              prev.some((w) => w.id === msg.from)
                ? prev
                : [...prev, { id: msg.from, userId: msg.userId, name: msg.name, avatarUrl: msg.avatarUrl, color: msg.color, ts: Date.now() }]
            );
            return;
          }

          if (msg.kind === "admit" && msg.to === me) {
            if (sentJoinRef.current) return;
            sentJoinRef.current = true;
            setStatus("joined");
            send({ kind: "join", from: me, userId: identity.userId, name: identity.name, avatarUrl: identity.avatarUrl, color: identity.color });
            send({ kind: "media", from: me, audioOn: audioOnRef.current, videoOn: videoOnRef.current });
            return;
          }

          if (msg.kind === "deny" && msg.to === me) {
            setStatus("denied");
            return;
          }

          // ---- Peer connections ----
          if (msg.kind === "join" && msg.from !== me) {
            // Existing peer initiates offer to newcomer
            updatePeer(msg.from, {
              id: msg.from, userId: msg.userId, name: msg.name, avatarUrl: msg.avatarUrl, color: msg.color,
              isHost: hostPeerIdRef.current === msg.from || (!!msg.userId && msg.userId === hostUserId),
            });
            const pc = pcsRef.current[msg.from] ?? createPC(msg.from);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send({
              kind: "offer", from: me, to: msg.from,
              userId: identity.userId, name: identity.name, avatarUrl: identity.avatarUrl, color: identity.color,
              sdp: offer,
            });
            send({ kind: "media", from: me, audioOn, videoOn });
          } else if (msg.kind === "offer" && msg.to === me) {
            updatePeer(msg.from, { id: msg.from, userId: msg.userId, name: msg.name, avatarUrl: msg.avatarUrl, color: msg.color });
            const pc = pcsRef.current[msg.from] ?? createPC(msg.from);
            await pc.setRemoteDescription(msg.sdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            send({
              kind: "answer", from: me, to: msg.from,
              userId: identity.userId, name: identity.name, avatarUrl: identity.avatarUrl, color: identity.color,
              sdp: answer,
            });
            send({ kind: "media", from: me, audioOn, videoOn });
          } else if (msg.kind === "answer" && msg.to === me) {
            const pc = pcsRef.current[msg.from];
            if (pc) await pc.setRemoteDescription(msg.sdp);
            updatePeer(msg.from, { userId: msg.userId, name: msg.name, avatarUrl: msg.avatarUrl, color: msg.color });
          } else if (msg.kind === "ice" && msg.to === me) {
            const pc = pcsRef.current[msg.from];
            if (pc && msg.candidate) {
              try { await pc.addIceCandidate(msg.candidate); } catch (e) { console.warn("ice err", e); }
            }
          } else if (msg.kind === "leave") {
            removePeer(msg.from);
          } else if (msg.kind === "media" && msg.from !== me) {
            updatePeer(msg.from, { audioOn: msg.audioOn, videoOn: msg.videoOn });
          }

          // ---- Host actions (broadcast) ----
          else if (msg.kind === "lock") {
            setLocked(msg.locked);
          } else if (msg.kind === "host-transfer") {
            setHostPeerId(msg.to);
            setHostUserId(msg.toUserId);
            isHostRef.current = msg.to === me;
            setPeers((prev) => {
              const next = { ...prev };
              Object.keys(next).forEach((k) => { next[k] = { ...next[k], isHost: k === msg.to }; });
              return next;
            });
          } else if (msg.kind === "kick" && msg.to === me) {
            setStatus("denied");
          } else if (msg.kind === "end-all" && !isHostRef.current) {
            setStatus("ended");
          } else if (msg.kind === "mute-all" && !isHostRef.current) {
            // Force-mute self when host requests it
            const ls = localStreamRef.current;
            ls?.getAudioTracks().forEach((t) => (t.enabled = false));
            audioOnRef.current = false;
            setAudioOn(false);
            send({ kind: "media", from: me, audioOn: false, videoOn: videoOnRef.current });
          } else if (msg.kind === "profile-update" && msg.from !== me) {
            updatePeer(msg.from, { userId: msg.userId, name: msg.name, avatarUrl: msg.avatarUrl, color: msg.color });
          }
        });

        await channel.subscribe(async (state) => {
          if (state !== "SUBSCRIBED") return;
          setStatus("lobby");
          if (!isHostRef.current) {
            send({ kind: "hello", from: me, userId: identity.userId, name: identity.name, avatarUrl: identity.avatarUrl, color: identity.color });
            setTimeout(() => {
              if (cancelled || hostPeerIdRef.current) return;
              isHostRef.current = true;
              setHostPeerId(me);
              setHostUserId(identity.userId);
            }, 1500);
          }
        });
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Could not access camera/microphone");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      try { send({ kind: "leave", from: selfIdRef.current }); } catch { /* noop */ }
      Object.values(pcsRef.current).forEach((pc) => pc.close());
      pcsRef.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (channel) supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  // ---- Connection quality monitor (samples RTCPeerConnection stats) ----
  useEffect(() => {
    if (status !== "joined") return;
    let stop = false;
    const tick = async () => {
      const pcs = Object.values(pcsRef.current);
      if (pcs.length === 0) {
        setQuality("unknown");
      } else {
        let worstRtt = 0;
        let worstLoss = 0;
        for (const pc of pcs) {
          try {
            const stats = await pc.getStats();
            stats.forEach((r) => {
              if (r.type === "candidate-pair" && (r as RTCIceCandidatePairStats).state === "succeeded") {
                const rtt = (r as RTCIceCandidatePairStats).currentRoundTripTime ?? 0;
                if (rtt > worstRtt) worstRtt = rtt;
              }
              if (r.type === "remote-inbound-rtp") {
                const loss = (r as unknown as { fractionLost?: number }).fractionLost ?? 0;
                if (loss > worstLoss) worstLoss = loss;
              }
            });
          } catch { /* noop */ }
        }
        const rttMs = worstRtt * 1000;
        let q: ConnectionQuality = "excellent";
        if (rttMs > 500 || worstLoss > 0.1) q = "poor";
        else if (rttMs > 250 || worstLoss > 0.05) q = "fair";
        else if (rttMs > 120 || worstLoss > 0.02) q = "good";
        setQuality(q);
      }
      if (!stop) setTimeout(tick, 4000);
    };
    tick();
    return () => { stop = true; };
  }, [status]);

  // ---- Local controls ----
  // Use refs (not state) for the previous value so rapid toggles never see a stale closure.
  const toggleAudio = useCallback(() => {
    const next = !audioOnRef.current;
    audioOnRef.current = next;
    const ls = localStreamRef.current;
    const tracks = ls?.getAudioTracks() ?? [];
    tracks.forEach((t) => { t.enabled = next; });
    setAudioOn(next);
    send({ kind: "media", from: selfIdRef.current, audioOn: next, videoOn: videoOnRef.current });
  }, [send]);

  const toggleVideo = useCallback(() => {
    const next = !videoOnRef.current;
    videoOnRef.current = next;
    const ls = localStreamRef.current;
    ls?.getVideoTracks().forEach((t) => { t.enabled = next; });
    setVideoOn(next);
    send({ kind: "media", from: selfIdRef.current, audioOn: audioOnRef.current, videoOn: next });
  }, [send]);

  const joinRoom = useCallback((initialAudio: boolean, initialVideo: boolean) => {
    setAudioOn(initialAudio);
    setVideoOn(initialVideo);
    audioOnRef.current = initialAudio;
    videoOnRef.current = initialVideo;

    const ls = localStreamRef.current;
    ls?.getAudioTracks().forEach(t => t.enabled = initialAudio);
    ls?.getVideoTracks().forEach(t => t.enabled = initialVideo);

    const me = selfIdRef.current;
    const isMeHost = isHostRef.current;
    const isBlocked = lockedRef.current || privacyRef.current === "private";

    if (isBlocked && !isMeHost) {
      setStatus("waiting");
      send({ kind: "knock", from: me, userId: identityRef.current.userId, name: identityRef.current.name, avatarUrl: identityRef.current.avatarUrl, color: identityRef.current.color });
    } else {
      sentJoinRef.current = true;
      setStatus("joined");
      send({ kind: "join", from: me, userId: identityRef.current.userId, name: identityRef.current.name, avatarUrl: identityRef.current.avatarUrl, color: identityRef.current.color });
      send({ kind: "media", from: me, audioOn: initialAudio, videoOn: initialVideo });
    }
  }, [send]);

  /** Broadcast updated profile info so peer tiles refresh live. */
  const broadcastProfile = useCallback((next: { userId: string | null; name: string; avatarUrl: string | null; color: string | null }) => {
    identityRef.current = next;
    send({
      kind: "profile-update", from: selfIdRef.current,
      userId: next.userId, name: next.name, avatarUrl: next.avatarUrl, color: next.color,
    });
  }, [send]);

  const replaceVideoTrack = useCallback(async (newTrack: MediaStreamTrack) => {
    Object.values(pcsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(newTrack);
    });
    const ls = localStreamRef.current;
    if (ls) {
      const old = ls.getVideoTracks()[0];
      if (old) {
        ls.removeTrack(old);
        if (old !== cameraTrackRef.current) old.stop();
      }
      ls.addTrack(newTrack);
      setLocalStream(new MediaStream(ls.getTracks()));
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      await replaceVideoTrack(screenTrack);
      setIsScreenSharing(true);
      screenTrack.onended = async () => {
        if (cameraTrackRef.current) await replaceVideoTrack(cameraTrackRef.current);
        setIsScreenSharing(false);
      };
    } catch (e) {
      console.warn("screen share cancelled", e);
    }
  }, [replaceVideoTrack]);

  const selectVideoDevice = useCallback(async (deviceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
      const newTrack = stream.getVideoTracks()[0];
      cameraTrackRef.current = newTrack;
      newTrack.enabled = videoOnRef.current;
      await replaceVideoTrack(newTrack);
    } catch (e) {
      console.error("Failed to switch video device", e);
    }
  }, [replaceVideoTrack]);

  const selectAudioDevice = useCallback(async (deviceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
      const newTrack = stream.getAudioTracks()[0];
      newTrack.enabled = audioOnRef.current;
      
      Object.values(pcsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
        if (sender) sender.replaceTrack(newTrack);
      });
      
      const ls = localStreamRef.current;
      if (ls) {
        const old = ls.getAudioTracks()[0];
        if (old) {
          ls.removeTrack(old);
          old.stop();
        }
        ls.addTrack(newTrack);
        setLocalStream(new MediaStream(ls.getTracks()));
      }
    } catch (e) {
      console.error("Failed to switch audio device", e);
    }
  }, []);

  const applyAudioSettings = useCallback(async (settings: { noiseSuppression?: boolean; echoCancellation?: boolean; autoGainControl?: boolean }) => {
    const ls = localStreamRef.current;
    if (!ls) return;
    const track = ls.getAudioTracks()[0];
    if (track) {
      try {
        await track.applyConstraints(settings);
      } catch (e) {
        console.error("Failed to apply audio settings", e);
      }
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (cameraTrackRef.current) await replaceVideoTrack(cameraTrackRef.current);
    setIsScreenSharing(false);
  }, [replaceVideoTrack]);

  // ---- Host controls ----
  const isHost = isHostRef.current || hostPeerId === selfIdRef.current;

  const admit = useCallback((peerId: string) => {
    if (!isHostRef.current) return;
    admittedRef.current.add(peerId);
    setWaiting((prev) => prev.filter((w) => w.id !== peerId));
    send({ kind: "admit", from: selfIdRef.current, to: peerId });
  }, [send]);

  const deny = useCallback((peerId: string) => {
    if (!isHostRef.current) return;
    setWaiting((prev) => prev.filter((w) => w.id !== peerId));
    send({ kind: "deny", from: selfIdRef.current, to: peerId });
  }, [send]);

  const setLockState = useCallback((next: boolean) => {
    if (!isHostRef.current) return;
    setLocked(next);
    send({ kind: "lock", from: selfIdRef.current, locked: next });
  }, [send]);

  const kick = useCallback((peerId: string) => {
    if (!isHostRef.current) return;
    send({ kind: "kick", from: selfIdRef.current, to: peerId });
    removePeer(peerId);
  }, [send, removePeer]);

  const transferHost = useCallback((peerId: string) => {
    if (!isHostRef.current) return;
    const target = peers[peerId];
    if (!target) return;
    isHostRef.current = false;
    setHostPeerId(peerId);
    setHostUserId(target.userId);
    send({ kind: "host-transfer", from: selfIdRef.current, to: peerId, toUserId: target.userId });
  }, [peers, send]);

  const endForAll = useCallback(() => {
    if (!isHostRef.current) return;
    send({ kind: "end-all", from: selfIdRef.current });
    setStatus("ended");
  }, [send]);

  const muteEveryone = useCallback(() => {
    if (!isHostRef.current) return;
    send({ kind: "mute-all", from: selfIdRef.current });
    // Optimistically mark every peer as muted; their own media event will confirm.
    setPeers((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { next[k] = { ...next[k], audioOn: false }; });
      return next;
    });
  }, [send]);

  // ---- Network diagnostics ----
  const getNetworkStats = useCallback(async () => {
    const results: {
      peerId: string;
      packetLoss: number;     // %
      jitter: number;         // ms
      bitrate: number;        // kbps inbound
      rtt: number;            // ms
    }[] = [];
    for (const [peerId, pc] of Object.entries(pcsRef.current)) {
      try {
        const stats = await pc.getStats();
        let packetsReceived = 0, packetsLost = 0, jitter = 0;
        let bytesReceived = 0, rtt = 0;
        stats.forEach((s) => {
          if (s.type === "inbound-rtp" && s.kind === "video") {
            packetsReceived += s.packetsReceived ?? 0;
            packetsLost += s.packetsLost ?? 0;
            jitter = Math.round((s.jitter ?? 0) * 1000);
            bytesReceived += s.bytesReceived ?? 0;
          }
          if (s.type === "candidate-pair" && s.state === "succeeded") {
            rtt = Math.round((s.currentRoundTripTime ?? 0) * 1000);
          }
        });
        const total = packetsReceived + packetsLost;
        const loss = total > 0 ? Math.round((packetsLost / total) * 100) : 0;
        results.push({ peerId, packetLoss: loss, jitter, bitrate: Math.round(bytesReceived / 1024), rtt });
      } catch { /* ignore */ }
    }
    return results;
  }, []);

  return {
    selfId: selfIdRef.current,
    localStream,
    peers: Object.values(peers),
    audioOn,
    videoOn,
    isScreenSharing,
    status,
    error,

    // privacy / host
    privacy, setPrivacy,
    locked, setLocked: setLockState,
    isHost,
    hostPeerId, hostUserId,
    waiting,
    admit, deny, kick, transferHost, endForAll, muteEveryone,
    broadcastProfile,

    // controls
    joinRoom,
    toggleAudio, toggleVideo,
    selectVideoDevice,
    selectAudioDevice,
    applyAudioSettings,
    startScreenShare, stopScreenShare,

    // quality
    quality, lowBandwidth, setLowBandwidth: applyLowBandwidth,

    // diagnostics
    getNetworkStats,

    // file transfer
    getDataChannel: (peerId: string) => dataChannelsRef.current[peerId] ?? null,
    getAllDataChannels: () => Object.values(dataChannelsRef.current).filter(dc => dc.readyState === "open"),
    setFileChunkHandler: (fn: (data: string, peerId: string) => void) => {
      fileChunkHandlerRef.current = fn;
    },

    // legacy export for chat in route component
    channel: channelRef,
  };
}
