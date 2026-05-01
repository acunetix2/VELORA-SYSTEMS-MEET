import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Mic, Video as VideoIcon, Bell, Eye, ChevronRight,
  Globe, Volume2, Monitor, Shield, Zap,
  Smartphone, Keyboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  uiDensity: 'comfortable'
};

function Page() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [devices, setDevices] = useState<{ audio: string; video: string }>({ audio: 'Default', video: 'Default' });

  useEffect(() => {
    try { setPrefs({ ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }); } catch { /* noop */ }
  }, []);

  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    toast.success("Settings updated", { duration: 1000 });
  };

  return (
    <DashboardShell title="Settings">
      <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Audio & Video */}
          <div className="space-y-6">
            <Card title="Audio & Video" icon={<Mic className="h-4 w-4" />}>
              <Row label="Join meetings muted" sub="Microphone off until you turn it on." checked={prefs.joinMuted} onChange={(v) => set("joinMuted", v)} />
              <Row label="Join with camera off" sub="Start in audio-only mode." checked={prefs.joinCameraOff} onChange={(v) => set("joinCameraOff", v)} />
              <Row label="Mirror my self-view" sub="Flip your video so it feels like a mirror." checked={prefs.mirrorSelf} onChange={(v) => set("mirrorSelf", v)} />
              <Row label="HD Video (1080p)" sub="Enable high-definition stream quality." checked={prefs.hdEnabled} onChange={(v) => set("hdEnabled", v)} />
            </Card>

            <Card title="Smart Audio" icon={<Volume2 className="h-4 w-4" />}>
              <Row label="Noise Suppression" sub="Filter out background typing and fan noise." checked={prefs.noiseSuppression} onChange={(v) => set("noiseSuppression", v)} />
              <Row label="Auto Gain Control" sub="Normalize your volume automatically." checked={prefs.autoGain} onChange={(v) => set("autoGain", v)} />
            </Card>

            <Card title="Shortcuts" icon={<Keyboard className="h-4 w-4" />}>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Mute / Unmute</span>
                  <kbd className="px-1.5 py-0.5 rounded border border-glass-border bg-muted font-mono">Ctrl + D</kbd>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Camera On / Off</span>
                  <kbd className="px-1.5 py-0.5 rounded border border-glass-border bg-muted font-mono">Ctrl + E</kbd>
                </div>
              </div>
            </Card>
          </div>

          {/* Appearance & Workspace */}
          <div className="space-y-6">
            <Card title="Workspace Appearance" icon={<Monitor className="h-4 w-4" />}>
              <div className="p-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">UI Density</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => set("uiDensity", 'comfortable')}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${prefs.uiDensity === 'comfortable' ? 'border-primary bg-primary/10 shadow-glow text-primary' : 'border-glass-border bg-card/30 hover:bg-card/50 text-muted-foreground'}`}
                  >
                    Comfortable
                  </button>
                  <button
                    onClick={() => set("uiDensity", 'compact')}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${prefs.uiDensity === 'compact' ? 'border-primary bg-primary/10 shadow-glow text-primary' : 'border-glass-border bg-card/30 hover:bg-card/50 text-muted-foreground'}`}
                  >
                    Compact
                  </button>
                </div>
              </div>
              <Row label="Notify me of knocks" sub="Sound alert when someone joins lobby." checked={prefs.notifyKnocks} onChange={(v) => set("notifyKnocks", v)} />
            </Card>

            <Card title="Security & Region" icon={<Shield className="h-4 w-4" />}>
              <div className="p-3 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Default Meeting Mode</p>
                    <p className="text-xs text-muted-foreground">Current: <b>Private (Waiting Room)</b></p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg h-8 px-2 text-primary">Change</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Media Region</p>
                    <p className="text-xs text-muted-foreground">Current: <b>Auto (US East)</b></p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg h-8 px-2 text-primary">Change</Button>
                </div>
              </div>
            </Card>

            <Card title="Mobile Sync" icon={<Smartphone className="h-4 w-4" />}>
              <div className="p-3 text-center">
                <div className="h-24 w-24 bg-muted/30 rounded-2xl mx-auto mb-4 border border-dashed border-glass-border grid place-items-center">
                  <Zap className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-xs text-muted-foreground">Scan QR to pair your mobile device for remote control and second screen.</p>
                <Button variant="outline" className="mt-4 w-full rounded-xl h-10 text-xs font-bold">Generate Pair Code</Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="pt-8 border-t border-glass-border flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Velora Meet Client v2.4.1 (Stable Build)
          </div>
          <Button variant="destructive" size="sm" className="rounded-xl h-9 px-4 text-xs font-bold" onClick={() => toast.error("Reset initiated", { description: "Factory reset will clear all local storage preferences." })}>
            Factory Reset
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
        <h3 className="font-bold text-xs uppercase tracking-widest">{title}</h3>
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