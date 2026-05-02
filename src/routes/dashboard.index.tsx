import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuth, getDisplayName } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const startMeeting = async () => {
    const id = generateMeetingId();
    setStoredName(displayName);
    const expiresAt = expiry > 0 ? Date.now() + expiry * 60 * 60 * 1000 : null;
    
    // Save to local for legacy support
    saveLocalMeeting({
      id,
      privacy,
      createdAt: Date.now(),
      hostUserId: user?.id ?? null,
      capacity,
      expiresAt,
    });

    // Save to DB for true role-based access
    if (user) {
      await supabase.from("meeting_sessions" as any).insert({
        meeting_id: id,
        host_id: user.id,
        privacy,
        capacity,
      });
    }

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

  const [analytics, setAnalytics] = useState({ hostCount: 0, participantCount: 0, totalMeetings: 0, history: [] as any[] });
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
            Velora <span className="text-primary italic">Meet</span>
          </h2>
          <div className="flex items-center gap-3 mt-1.5 text-muted-foreground">
            <span className="text-lg">Welcome back, <span className="font-bold text-foreground">{displayName.split(" ")[0]}</span></span>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-sm">Ready for your next session?</span>
          </div>
        </section>
        <section className="grid md:grid-cols-2 gap-5 mb-8">
          {/* Enterprise Spotlight */}
          <div className="glass rounded-3xl p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Organization hub</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Manage your organization's security and team collaboration.
            </p>
            <Button asChild className="mt-auto bg-primary hover:bg-primary/90 text-white rounded-xl shadow-glow">
              <Link to="/dashboard/organization">Manage organization <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>

          {/* Academy Spotlight */}
          <div className="glass rounded-3xl p-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 grid place-items-center">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Velora Academy</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Master advanced features and hybrid meeting strategies with Iddy Chesire.
            </p>
            <Button asChild variant="outline" className="mt-auto border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-500 rounded-xl">
              <Link to="/dashboard/classroom">Open classrooms <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>

          {/* Partner Spotlight */}
          <div className="glass rounded-3xl p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Partner Ecosystem</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Share Velora and earn recurring rewards. Join our growing network.
            </p>
            <Button asChild className="mt-auto bg-gradient-primary text-primary-foreground border-0 shadow-glow rounded-xl">
              <Link to="/dashboard/partners">Manage referrals <ArrowRight className="h-4 w-4 ml-2" /></Link>
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
                    className={`text-xs rounded-lg px-3 py-1.5 border transition-smooth ${
                      expiry === opt.hrs
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-glass-border bg-card/30 hover:bg-card/50 text-muted-foreground"
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
                className="w-full h-1.5 bg-glass-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span>2</span>
                <span className="text-primary/60">Free limit: 100</span>
                <span>1000</span>
              </div>
            </div>

            <Button
              onClick={startMeeting}
              className="mt-5 w-full h-12 bg-gradient-primary text-primary-foreground hover:opacity-90 border-0 shadow-glow text-base"
            >
              <Video className="h-5 w-5 mr-2" /> Start meeting
            </Button>
          </div>

          {/* Join */}
          <div className="glass rounded-2xl p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl glass grid place-items-center">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Join with a code</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the link or code shared with you.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <Label
                htmlFor="code"
                className="text-xs font-bold text-muted-foreground"
              >
                Meeting code
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="xrt-deo-nbo"
                onKeyDown={(e) => e.key === "Enter" && join()}
                className="mt-2 bg-input/60 border-glass-border h-12 font-mono text-base"
              />
              <Button onClick={join} variant="secondary" className="mt-3 w-full h-12">
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
    <footer className="mt-12 py-8 border-t border-glass-border/50 text-center">
      <p className="text-xs text-muted-foreground mb-2 italic">"Communication is the foundation of craft."</p>
      <div className="flex items-center justify-center gap-2">
        <span className="text-[10px] tracking-widest font-bold text-foreground/60">Iddy Chesire</span>
        <div className="h-1 w-1 rounded-full bg-primary/30" />
        <span className="text-[10px] tracking-widest text-muted-foreground">CEO & Co-founder</span>
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
      className="glass rounded-2xl p-4 flex items-center gap-3 transition-smooth hover:shadow-glow"
    >
      <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow text-primary-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}



// ---- Capacity & pricing tiers ----------------------------------------------


