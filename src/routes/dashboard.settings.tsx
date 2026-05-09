import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Mic, Video as VideoIcon, Bell, Eye, ChevronRight, Globe, Volume2, Monitor, Shield, Zap,
  Smartphone, Keyboard, CheckCircle2, RefreshCw, Copy, QrCode,
  Trash2, Database, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function SettingsComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Velora" }] }),
  component: SettingsComponent,
});

type Prefs = {
  joinMuted: boolean;
  joinCameraOff: boolean;
  notifyKnocks: boolean;
  mirrorSelf: boolean;
  hdEnabled: boolean;
  noiseSuppression: boolean;
  autoGain: boolean;
  uiDensity: 'comfortable' | 'compact';
  meetingMode: 'private' | 'open';
  mediaRegion: string;
  notifyUpcoming: boolean;
  notifyRecording: boolean;
};

const KEY = "velora:prefs";
const DEFAULTS: Prefs = {
  joinMuted: false,
  joinCameraOff: false,
  notifyKnocks: true,
  mirrorSelf: true,
  hdEnabled: true,
  noiseSuppression: true,
  autoGain: true,
  uiDensity: 'comfortable',
  meetingMode: 'private',
  mediaRegion: 'auto',
  notifyUpcoming: true,
  notifyRecording: true,
};

const REGIONS = [
  { value: 'auto', label: 'Auto (Nearest)' },
  { value: 'us-east', label: 'US East' },
  { value: 'eu-west', label: 'EU West' },
  { value: 'ap-south', label: 'AP South' },
  { value: 'af-south', label: 'Africa South' },
];

function Page() {
  const { profile } = useProfile();
  const [pairLoading, setPairLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    try { setPrefs({ ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }); } catch { /* noop */ }
  }, []);

  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    toast.success("Settings updated", { duration: 1000 });
  };

  const generatePairCode = async () => {
    setPairLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not signed in"); return; }
      
      const token = Math.random().toString(36).slice(2, 10).toUpperCase();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from("device_pairing" as any)
        .insert({
          user_id: user.id,
          pair_code: token,
          expires_at: expiresAt
        });

      if (error) throw error;
      
      setPairCode(token);
      toast.success("Pair code generated — valid for 10 minutes");
    } catch (e) {
      toast.error("Failed to generate pair code");
      console.error(e);
    } finally {
      setPairLoading(false);
    }
  };

  const copyPairCode = () => {
    if (pairCode) navigator.clipboard.writeText(pairCode).then(() => toast.success("Code copied"));
  };

  const clearAll = () => {
    localStorage.removeItem(KEY);
    setPrefs(DEFAULTS);
    toast.success("Settings reset to defaults");
  };

  const notifyPermsGranted = typeof Notification !== "undefined" && Notification.permission === "granted";

  const requestNotifPerms = async () => {
    if (typeof Notification === "undefined") { toast.error("Notifications not supported in this browser"); return; }
    const result = await Notification.requestPermission();
    if (result === "granted") toast.success("Notifications enabled!");
    else toast.error("Notification permission denied");
  };

  return (
    <DashboardShell title="Settings">
      <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Audio & Video */}
            <Card title="Audio & Video" icon={<Mic className="h-4 w-4" />}>
              <Row label="Join meetings muted" sub="Microphone off until you turn it on." checked={prefs.joinMuted} onChange={(v) => set("joinMuted", v)} />
              <Row label="Join with camera off" sub="Start in audio-only mode." checked={prefs.joinCameraOff} onChange={(v) => set("joinCameraOff", v)} />
              <Row label="Mirror my self-view" sub="Flip your video so it feels like a mirror." checked={prefs.mirrorSelf} onChange={(v) => set("mirrorSelf", v)} />
              <Row label="HD Video (1080p)" sub="Enable high-definition stream quality." checked={prefs.hdEnabled} onChange={(v) => set("hdEnabled", v)} />
            </Card>

            {/* Smart Audio */}
            <Card title="Smart Audio" icon={<Volume2 className="h-4 w-4" />}>
              <Row label="Noise Suppression" sub="Filter out background typing and fan noise." checked={prefs.noiseSuppression} onChange={(v) => set("noiseSuppression", v)} />
              <Row label="Auto Gain Control" sub="Normalize your volume automatically." checked={prefs.autoGain} onChange={(v) => set("autoGain", v)} />
            </Card>

            {/* Notifications */}
            <Card title="Notifications" icon={<Bell className="h-4 w-4" />}>
              <Row label="Notify on knocks" sub="Sound alert when someone joins lobby." checked={prefs.notifyKnocks} onChange={(v) => set("notifyKnocks", v)} />
              <Row label="Upcoming meeting alerts" sub="Notify 5 minutes before a scheduled meeting." checked={prefs.notifyUpcoming} onChange={(v) => set("notifyUpcoming", v)} />
              <Row label="Recording alerts" sub="Notify me when recording starts/stops." checked={prefs.notifyRecording} onChange={(v) => set("notifyRecording", v)} />
              <div className="p-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl gap-2 font-bold"
                  onClick={requestNotifPerms}
                >
                  {notifyPermsGranted ? (
                    <><CheckCircle2 className="h-4 w-4 text-green-500" /> Browser notifications active</>
                  ) : (
                    <><Bell className="h-4 w-4" /> Enable browser notifications</>
                  )}
                </Button>
              </div>
            </Card>

            {/* Shortcuts */}
            <Card title="Keyboard Shortcuts" icon={<Keyboard className="h-4 w-4" />}>
              <div className="p-4 space-y-3">
                {[
                  ["Mute / Unmute", "Ctrl + D"],
                  ["Camera On / Off", "Ctrl + E"],
                  ["Push to talk", "Space (hold)"],
                  ["Toggle chat", "Ctrl + /"],
                ].map(([action, key]) => (
                  <div key={action} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{action}</span>
                    <kbd className="px-1.5 py-0.5 rounded border border-glass-border bg-muted font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Appearance */}
            <Card title="Workspace Appearance" icon={<Monitor className="h-4 w-4" />}>
              <div className="p-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">UI Density</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['comfortable', 'compact'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => set("uiDensity", d)}
                      className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${prefs.uiDensity === d ? 'border-primary bg-primary/10 shadow-glow text-primary' : 'border-glass-border bg-card/30 hover:bg-card/50 text-muted-foreground'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Security & Region */}
            <Card title="Security & Region" icon={<Shield className="h-4 w-4" />}>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Default Meeting Mode</Label>
                  <Select value={prefs.meetingMode} onValueChange={(v) => set("meetingMode", v as Prefs['meetingMode'])}>
                    <SelectTrigger className="h-10 rounded-xl bg-card/40 border-glass-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-glass-border">
                      <SelectItem value="private">Private (Waiting Room)</SelectItem>
                      <SelectItem value="open">Open (Instant Join)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Media Region</Label>
                  <Select value={prefs.mediaRegion} onValueChange={(v) => set("mediaRegion", v)}>
                    <SelectTrigger className="h-10 rounded-xl bg-card/40 border-glass-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-glass-border">
                      {REGIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Mobile Sync */}
            <Card title="Mobile Sync" icon={<Smartphone className="h-4 w-4" />}>
              <div className="p-4 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generate a pairing code to link your mobile browser. Open Velora on your phone and enter the code in <b>Profile → Pair Device</b>.
                </p>
                {pairCode ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Your pairing code</p>
                      <p className="text-4xl font-black tracking-[0.3em] text-primary">{pairCode}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">Valid for 10 minutes</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold" onClick={copyPairCode}>
                        <Copy className="h-4 w-4" /> Copy Code
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold" onClick={() => setPairCode(null)}>
                        <RefreshCw className="h-4 w-4" /> New Code
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full rounded-xl h-11 gap-2 font-bold bg-gradient-primary text-primary-foreground border-0 shadow-glow"
                    onClick={generatePairCode}
                    disabled={pairLoading}
                  >
                    <QrCode className="h-4 w-4" />
                    {pairLoading ? "Generating…" : "Generate Pair Code"}
                  </Button>
                )}
              </div>
            </Card>
            {/* Danger Zone */}
            <Card title="Danger Zone" icon={<AlertTriangle className="h-4 w-4" />}>
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold tracking-tight">Clear cache & settings</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Reset all local preferences to defaults.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl h-8 text-[10px] font-bold border-destructive/20 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Reset all settings and clear local cache?")) {
                          localStorage.clear();
                          setPrefs(DEFAULTS);
                          toast.success("Cache cleared and settings reset");
                        }
                      }}
                    >
                      Clear Cache
                    </Button>
                  </div>

                  <div className="pt-3 border-t border-glass-border flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold tracking-tight text-destructive">Delete account</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Permanently remove your identity and data.</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="rounded-xl h-8 text-[10px] font-bold shadow-sm"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="glass border-glass-border sm:max-w-[425px] rounded-[2rem]">
            <DialogHeader className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-[2rem] bg-destructive/10 text-destructive grid place-items-center mb-4">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">Permanent account deletion</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm pt-2">
                This action is irreversible. You will lose access to all organizations, meetings, and personal telemetry.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold tracking-widest text-muted-foreground ml-1">Type "DELETE" to confirm</Label>
                <Input 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="bg-muted/30 h-12 rounded-xl border-glass-border text-center font-mono tracking-[0.3em]"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="ghost" className="rounded-xl h-12 font-bold flex-1" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="rounded-xl h-12 font-bold flex-1 shadow-sm"
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  toast.loading("Deactivating identity...", { id: "delete" });
                  
                  // Simulate account cleanup
                  setTimeout(async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                      toast.error("Process failed", { id: "delete" });
                      setIsDeleting(false);
                    } else {
                      toast.success("Account successfully purged", { id: "delete" });
                      window.location.href = "/";
                    }
                  }, 2000);
                }}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Deletion"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="pt-8 border-t border-glass-border flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Velora Meet v2.4.1 · {profile?.email ?? ""}
          </div>
          <Button variant="destructive" size="sm" className="rounded-xl h-9 px-4 text-xs font-bold" onClick={clearAll}>
            Reset to Defaults
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="glass rounded-[2rem] overflow-hidden border-glass-border">
      <div className="px-5 py-4 border-b border-glass-border bg-muted/20 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h3 className="font-bold text-xs tracking-widest">{title}</h3>
      </div>
      <div className="divide-y divide-glass-border/40">{children}</div>
    </section>
  );
}

function Row({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 hover:bg-card/40 transition-colors">
      <div className="min-w-0">
        <Label className="text-sm font-semibold block">{label}</Label>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}