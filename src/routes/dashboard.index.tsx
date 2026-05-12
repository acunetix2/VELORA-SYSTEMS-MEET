import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuth, getDisplayName } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { MeetingCard } from "@/components/MeetingCard";
import { useEffect, useState } from "react";
import {
  generateMeetingId,
  isValidMeetingId,
  setStoredName,
  saveLocalMeeting,
  getRecentMeetings,
  type LocalMeeting,
  type MeetingPrivacy,
} from "@/lib/meeting";
import { toast } from "sonner";
import { getAnalytics } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import {
  Video,
  ArrowRight,
  Link2,
  Lock,
  Globe2,
  Sparkles,
  ChevronRight,
  Building2,
  GraduationCap,
  Users,
  Clock,
  Calendar,
  Activity,
  Zap,
  HeartHandshake,
  BrainCircuit,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Velora Meet" },
      { name: "description", content: "Start a meeting in one click or join with a code." },
    ],
  }),
  component: DashboardInner,
});

function DashboardInner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [code, setCode] = useState("");
  const [privacy, setPrivacy] = useState<MeetingPrivacy>("private");
  const [recents, setRecents] = useState<LocalMeeting[]>([]);
  const [expiry, setExpiry] = useState<number>(0); // hours; 0 = never
  const [capacity, setCapacity] = useState<number>(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("velora:capacity") : null;
    const n = raw ? parseInt(raw, 10) : 100;
    return Number.isFinite(n) ? Math.min(1000, Math.max(2, n)) : 100;
  });

  useEffect(() => {
    try {
      localStorage.setItem("velora:capacity", String(capacity));
    } catch {
      /* noop */
    }
  }, [capacity]);

  useEffect(() => {
    setRecents(getRecentMeetings());
  }, []);

  const displayName = profile?.display_name || getDisplayName(user);

  const [setupOpen, setSetupOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDesc, setMeetingDesc] = useState("");
  const [meetingImage, setMeetingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    const path = `${user.id}/instant_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("meeting-previews")
      .upload(path, file);

    if (error) {
      toast.error("Failed to upload image");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("meeting-previews").getPublicUrl(path);
    setMeetingImage(publicUrl);
    setUploading(false);
  };

  const startMeeting = async () => {
    const id = generateMeetingId();
    setStoredName(displayName);
    const expiresAt = expiry > 0 ? Date.now() + expiry * 60 * 60 * 1000 : null;
    
    const meetingData = {
      id,
      privacy,
      createdAt: Date.now(),
      hostUserId: user?.id ?? null,
      capacity,
      expiresAt,
      title: meetingTitle.trim() || "Untitled Meeting",
      description: meetingDesc.trim(),
      imageUrl: meetingImage || undefined,
    };

    // Save to local for legacy support
    saveLocalMeeting(meetingData);

    // Save to DB for true role-based access
    if (user) {
      await supabase.from("meeting_sessions" as any).insert({
        meeting_id: id,
        host_id: user.id,
        privacy,
        capacity,
        title: meetingTitle.trim() || "Untitled Meeting",
        description: meetingDesc.trim(),
        image_url: meetingImage,
      });
    }

    setSetupOpen(false);
    navigate({
      to: "/meet/$meetingId",
      params: { meetingId: id },
      search: { mode: privacy },
    });
  };

  const join = () => {
    const id = code.trim().toLowerCase();
    if (!isValidMeetingId(id)) {
      toast.error("Meeting code looks like xxx-yyyy-zzz");
      return;
    }
    setStoredName(displayName);
    navigate({ to: "/meet/$meetingId", params: { meetingId: id } });
  };

  const copyLink = (id: string) => {
    navigator.clipboard
      .writeText(`${window.location.origin}/meet/${id}`)
      .then(() => toast.success("Meeting link copied"));
  };

  const totalMeetings = recents.length;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const [analytics, setAnalytics] = useState({ hostCount: 0, participantCount: 0, totalMeetings: 0, totalMinutes: 0, history: [] as any[] });
  const [trends, setTrends] = useState<number[]>(new Array(12).fill(0));

  useEffect(() => {
    getAnalytics().then(data => {
      setAnalytics(data);
      const counts = new Array(12).fill(0);
      const now = new Date();
      data.history.forEach((h: any) => {
        const d = new Date(h.timestamp);
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff < 12) counts[11 - diff]++;
      });
      const max = Math.max(...counts, 1);
      setTrends(counts.map(c => (c / max) * 100));
    });
  }, []);

  return (
    <DashboardShell title="Home">
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {/* Hero greeting */}
        <section className="mb-6">
          <p className="text-xs text-muted-foreground font-bold">{today}</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Welcome back, <span className="text-primary">{displayName.split(" ")[0]}</span>
          </h2>
          <div className="mt-4 flex items-center gap-2 text-muted-foreground/60">
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-sm">Ready for your next session?</span>
          </div>
        </section>
        <section className="grid md:grid-cols-2 gap-5 mb-8">
          {/* Enterprise Spotlight */}
          <div className="glass card-lining-bottom lining-blue rounded-xl p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col shadow-elegant">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg text-primary">Organization hub</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Manage your organization's security and team collaboration.
            </p>
            <Button asChild className="mt-auto bg-primary hover:opacity-90 text-primary-foreground rounded-xl shadow-glow border-0 font-bold">
              <Link to="/dashboard/enterprise">Manage organization <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>

          {/* Academy Spotlight */}
          <div className="glass card-lining-bottom lining-amber rounded-xl p-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent flex flex-col shadow-elegant">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 grid place-items-center">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg text-primary">Velora Academy</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Master advanced features and hybrid meeting strategies with the Velora team.
            </p>
            <Button asChild variant="outline" className="mt-auto border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold">
              <Link to="/dashboard/classroom">Open classrooms <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>

          {/* Partner Spotlight */}
          <div className="glass card-lining-bottom lining-green rounded-xl p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col shadow-elegant">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg text-primary">Partner Ecosystem</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Share Velora and earn recurring rewards. Join our growing network.
            </p>
            <Button asChild className="mt-auto bg-primary hover:opacity-90 text-primary-foreground border-0 shadow-glow rounded-xl font-bold">
              <Link to="/dashboard/partners">Manage referrals <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>

          {/* AI Spotlight */}
          <div className="glass card-lining-bottom lining-purple rounded-xl p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col shadow-elegant">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 grid place-items-center">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg text-primary">Velora AI</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              View meeting summaries, sentiment trends, and Velora task extraction.
            </p>
            <Button asChild className="mt-auto bg-primary hover:opacity-90 text-primary-foreground rounded-xl shadow-glow border-0 font-bold">
              <Link to="/dashboard/ai" search={{ conv: undefined } as any}>Open command center <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
        </section>

        {/* Primary actions */}
        <section className="grid lg:grid-cols-[1.1fr_1fr] gap-4 sm:gap-5">
          {/* Start meeting */}
          <div className="glass rounded-2xl p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                <Video className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Start a meeting</h2>
                <p className="text-sm text-muted-foreground">
                  Creates a fresh room and takes you straight in.
                </p>
              </div>
            </div>

            {/* privacy */}
            <div className="mt-5 grid sm:grid-cols-2 gap-2">
              <PrivacyChoice
                active={privacy === "private"}
                onClick={() => setPrivacy("private")}
                icon={<Lock className="h-4 w-4" />}
                title="Private"
                desc="Guests wait until you admit them."
              />
              <PrivacyChoice
                active={privacy === "open"}
                onClick={() => setPrivacy("open")}
                icon={<Globe2 className="h-4 w-4" />}
                title="Open"
                desc="Anyone with the link joins instantly."
              />
            </div>

            {/* Link expiry */}
            <div className="mt-4">
              <p className="text-xs font-bold text-muted-foreground mb-2">
                Link expires
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { hrs: 0, label: "Never" },
                  { hrs: 1, label: "1 hour" },
                  { hrs: 4, label: "4 hours" },
                  { hrs: 24, label: "24 hours" },
                  { hrs: 168, label: "7 days" },
                ].map((opt) => (
                  <button
                    key={opt.hrs}
                    type="button"
                    onClick={() => setExpiry(opt.hrs)}
                    className={`text-xs rounded-lg px-3 py-1.5 border transition-all duration-300 font-bold ${
                      expiry === opt.hrs
                        ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20"
                        : "border-glass-border bg-card/30 hover:bg-blue-500/5 hover:text-blue-600 text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground">Meeting capacity</p>
                <span className="text-xs font-black text-primary">{capacity} guests</span>
              </div>
              <input
                type="range"
                min={2}
                max={1000}
                step={1}
                value={capacity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val > 100) {
                    toast.success("Upgrade to Velora Pro", {
                      description: "Host up to 1,000 participants with advanced security.",
                      action: {
                        label: "View Plans",
                        onClick: () => navigate({ to: "/dashboard/upgrade" })
                      },
                      style: {
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                        color: "#22c55e"
                      }
                    });
                    setCapacity(100);
                  } else {
                    setCapacity(val);
                  }
                }}
                className="w-full h-2.5 bg-blue-500/20 rounded-lg appearance-none cursor-pointer accent-blue-600 border border-blue-500/20 shadow-sm"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span>2</span>
                <span className="text-primary/60">Free limit: 100</span>
                <span>1000</span>
              </div>
            </div>

            <Button
              onClick={() => setSetupOpen(true)}
              className="mt-5 w-full h-10 bg-gradient-primary text-primary-foreground hover:opacity-90 border-0 shadow-glow text-sm font-bold"
            >
              <Video className="h-4 w-4 mr-2" /> Start
            </Button>
          </div>

          <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
            <DialogContent className="glass border-glass-border sm:max-w-[480px] p-0 overflow-hidden rounded-[2rem]">
              <div className="h-2 bg-gradient-to-r from-blue-600 to-cyan-400" />
              <div className="p-8">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl font-black flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 grid place-items-center">
                      <Video className="h-4 w-4 text-blue-500" />
                    </div>
                    Meeting Setup
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-muted-foreground font-medium">
                    Configure your session parameters before starting.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Meeting Title</Label>
                    <Input 
                      placeholder="e.g. Design Review" 
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      className="bg-card/40 border-glass-border h-10 rounded-xl focus:ring-blue-500/20 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Agenda / Description</Label>
                    <Textarea 
                      placeholder="What's this meeting about?" 
                      value={meetingDesc}
                      onChange={(e) => setMeetingDesc(e.target.value)}
                      className="bg-card/40 border-glass-border rounded-xl focus:ring-blue-500/20 min-h-[80px] text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Meeting Preview Image</Label>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          className="bg-card/40 border-glass-border h-10 rounded-xl file:hidden pt-2.5 text-[10px]" 
                        />
                        {uploading && <div className="absolute right-3 top-2.5"><Loader2 className="h-4 w-4 animate-spin text-blue-500" /></div>}
                      </div>
                      {meetingImage && (
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-glass-border shrink-0 shadow-sm">
                          <img src={meetingImage} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button variant="ghost" onClick={() => setSetupOpen(false)} className="flex-1 rounded-xl h-10 font-bold text-xs">
                    Cancel
                  </Button>
                  <Button 
                    onClick={startMeeting} 
                    className="flex-1 bg-gradient-primary text-primary-foreground border-0 shadow-glow rounded-xl h-10 font-black uppercase tracking-widest text-[10px]"
                  >
                    Start <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Join */}
          <div className="glass rounded-2xl p-5 sm:p-7 bg-gradient-to-br from-background via-background to-primary/5 border-primary/20 relative overflow-hidden group/join shadow-elegant">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover/join:bg-primary/10" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center border border-primary/20 group-hover/join:scale-110 transition-transform">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Join with a code</h2>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground/60">
                  Enter the link or code shared with you
                </p>
              </div>
            </div>
            <div className="mt-5 relative z-10">
              <Label
                htmlFor="code"
                className="text-[10px] font-bold text-muted-foreground/60 ml-1"
              >
                Meeting code
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="xrt-deon-nbo"
                onKeyDown={(e) => e.key === "Enter" && join()}
                className="mt-2 bg-background/50 border-glass-border h-12 font-mono text-base focus:ring-primary/20 rounded-xl"
              />
              <Button onClick={join} className="mt-3 w-full h-12 bg-blue-600 hover:bg-blue-500 text-white shadow-glow border-0 rounded-xl font-black uppercase tracking-widest text-[11px]">
                Join meeting <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </section>



        {/* Recent + quick links */}
        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-4 sm:gap-5 mt-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {" "}
                Recent meetings
              </h3>
              {recents.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem("velora:recents");
                    setRecents([]);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>
            {recents.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <Video className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Your recent meetings will appear here
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {recents.map((m) => (
                  <MeetingCard
                    key={m.id}
                    {...m}
                    onDelete={() => {
                      setRecents(recents.filter((r) => r.id !== m.id));
                      const stored = getRecentMeetings().filter(
                        (r) => r.id !== m.id,
                      );
                      localStorage.setItem("velora:recents", JSON.stringify(stored));
                    }}
                    onRejoin={() =>
                      navigate({
                        to: "/meet/$meetingId",
                        params: { meetingId: m.id },
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <QuickCard
              to="/dashboard/schedule"
              icon={<Calendar className="h-5 w-5" />}
              title="Schedule a meeting"
              desc="Pick a time and share an invite."
            />
            <QuickCard
              to="/dashboard/contacts"
              icon={<Users className="h-5 w-5" />}
              title="Your contacts"
              desc="Save people you meet often."
            />
            <QuickCard
              to="/dashboard/recordings"
              icon={<Activity className="h-5 w-5" />}
              title="Recent activity"
              desc="Transcripts & summaries."
            />
            <QuickCard
              to="/dashboard/settings"
              icon={<Zap className="h-5 w-5" />}
              title="Settings"
              desc="Devices, audio, video preferences."
            />
          </div>
        </section>
        <DashboardFooter />
      </div>
    </DashboardShell>
  );
}

function DashboardFooter() {
  return (
    <footer className="mt-12 py-8 border-t border-glass-border/30 text-center space-y-4 relative z-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <p className="text-xs text-muted-foreground font-medium opacity-80 whitespace-nowrap overflow-hidden">
        "Communication is the foundation of craft. We build the tools so you can focus on the vision."
      </p>
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <span className="text-sm font-black text-foreground">Velora HQ</span>
          <span className="text-[11px] text-primary font-bold">Protocol Operations</span>
        </div>
      </div>
    </footer>
  );
}

function PrivacyChoice({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl p-3.5 border transition-smooth ${
        active
          ? "border-primary/60 bg-primary/10 shadow-glow"
          : "border-glass-border bg-card/30 hover:bg-card/50"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <span
          className={active ? "text-primary" : "text-muted-foreground"}
        >
          {icon}
        </span>
        {title}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </button>
  );
}

function QuickCard({
  to,
  icon,
  title,
  desc,
}: {
  to:
    | "/dashboard/schedule"
    | "/dashboard/contacts"
    | "/dashboard/recordings"
    | "/dashboard/settings";
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="glass rounded-xl p-3 flex items-center gap-3 transition-all hover:bg-primary/5 hover:border-primary/30 border border-glass-border group/quick"
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center text-primary group-hover/quick:bg-primary group-hover/quick:text-white transition-all">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-xs leading-tight break-words uppercase tracking-wide">{title}</p>
        <p className="text-[10px] text-muted-foreground/60 break-words mt-0.5">{desc}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover/quick:translate-x-1 transition-transform" />
    </Link>
  );
}



// ---- Capacity & pricing tiers ----------------------------------------------


