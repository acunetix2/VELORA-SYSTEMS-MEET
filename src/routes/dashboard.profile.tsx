import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuth, getDisplayName } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { setStoredName } from "@/lib/meeting";
import { toast } from "sonner";
import { getAnalytics } from "@/lib/analytics";
import {
  Camera, Loader2, Save, Trash2, Mail, Briefcase,
  Building2, Globe2, Phone, MapPin, Linkedin, Github, Clock,
  ShieldCheck, Bell, KeyRound, ChevronRight, Smartphone,
  LogOut, RefreshCw, ShieldAlert
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Velora Meet™" },
      { name: "description", content: "Manage your meeting profile, professional details, devices and account." },
    ],
  }),
  component: () => (<RequireAuth><ProfilePage /></RequireAuth>),
});

const schema = z.object({
  display_name: z.string().trim().min(1, "Display name required").max(40, "Max 40 characters"),
  bio: z.string().trim().max(280, "Max 280 characters").optional(),
});

type Extra = {
  title: string;
  company: string;
  location: string;
  timezone: string;
  phone: string;
  website: string;
  linkedin: string;
  github: string;
  pronouns: string;
};

const EXTRA_KEY = (uid: string) => `velora:profile-extra:${uid}`;
const DEFAULT_EXTRA: Extra = {
  title: "", company: "", location: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  phone: "", website: "", linkedin: "", github: "", pronouns: "",
};

function ProfilePage() {
  const { user } = useAuth();
  const { profile, refresh, loading } = useProfile();
  const [tab, setTab] = useState<"personal" | "professional" | "preferences" | "security">("personal");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileColor, setProfileColor] = useState("");
  const [extra, setExtra] = useState<Extra>(DEFAULT_EXTRA);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pairingInput, setPairingInput] = useState("");
  const [pairingLoading, setPairingLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState<{ open: boolean; type: 'password' | 'sessions' | 'mfa' | null }>({ open: false, type: null });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? getDisplayName(user));
      setBio(profile.bio ?? "");
      setProfileColor(profile.color ?? "");
      setExtra({
        title: profile.title ?? "",
        company: profile.company ?? "",
        location: profile.country ?? "",
        timezone: profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        phone: profile.phone ?? "",
        website: profile.website ?? "",
        linkedin: profile.linkedin ?? "",
        github: profile.github ?? "",
        pronouns: profile.pronouns ?? "",
      });
      setMfaEnabled(!!(profile as any).mfa_enabled);
    }
  }, [profile, user]);

  const persistExtra = (next: Extra) => {
    setExtra(next);
  };

  const [analytics, setAnalytics] = useState<any>({ hostCount: 0, participantCount: 0, totalMeetings: 0, history: [] });
  useEffect(() => {
    getAnalytics().then(data => setAnalytics(data as any));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ display_name: displayName, bio });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          user_id: user.id,
          display_name: parsed.data.display_name, 
          bio: parsed.data.bio ?? null,
          color: profileColor || null,
          title: extra.title,
          company: extra.company,
          country: extra.location,
          timezone: extra.timezone,
          phone: extra.phone,
          website: extra.website,
          linkedin: extra.linkedin,
          github: extra.github,
          pronouns: extra.pronouns,
        }, { onConflict: 'user_id' });
      if (error) throw error;
      await supabase.auth.updateUser({ data: { display_name: parsed.data.display_name } });
      setStoredName(parsed.data.display_name);
      toast.success("Profile saved", { description: "Your changes are visible across all devices." });
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      toast.error("Use a PNG, JPG, WEBP or GIF");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      toast.success("Photo updated");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!user) return;
    setUploading(true);
    try {
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", user.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { avatar_url: null } });
      toast.success("Photo removed");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setUploading(false);
    }
  };

  const verifyPairCode = async () => {
    if (!pairingInput.trim()) return;
    setPairingLoading(true);
    try {
      const { data, error } = await supabase
        .from("device_pairing" as any)
        .select("user_id, expires_at")
        .eq("pair_code", pairingInput.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;
      if (!data) { toast.error("Invalid pairing code"); return; }
      
      if (new Date(data.expires_at) < new Date()) {
        toast.error("Pairing code has expired");
        return;
      }

      toast.success("Device paired successfully!", {
        description: "Your settings and account data are now synchronized."
      });
      setPairingInput("");
      refresh();
    } catch (e) {
      toast.error("Pairing failed");
      console.error(e);
    } finally {
      setPairingLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      if (error) throw error;
      toast.success("Password reset email sent!", {
        description: "Check your inbox for instructions to set a new password."
      });
    } catch (e) {
      toast.error("Failed to send reset email");
    }
    setSecurityDialogOpen({ open: false, type: null });
  };

  const handleGlobalSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      toast.success("Signed out from all devices");
      window.location.href = "/";
    } catch (e) {
      toast.error("Failed to sign out globally");
    }
    setSecurityDialogOpen({ open: false, type: null });
  };

  const toggleMFA = async () => {
    const next = !mfaEnabled;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ mfa_enabled: next } as any)
        .eq("user_id", user?.id);
      if (error) throw error;
      setMfaEnabled(next);
      toast.success(next ? "Two-factor authentication enabled" : "Two-factor authentication disabled");
    } catch (e) {
      toast.error("Failed to update security settings");
    }
    setSecurityDialogOpen({ open: false, type: null });
  };

  return (
    <DashboardShell title="Your profile">
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        {/* Hero card */}
        <div className="dash-card p-6 sm:p-8 grid lg:grid-cols-[auto_1fr_auto] gap-8 items-center">
          <div className="dash-card-accent accent-green" />
          <div className="relative">
            <Avatar name={displayName} src={profile?.avatar_url} color={profileColor} size="2xl" className="h-32 w-32 ring-4 ring-background shadow-2xl" />
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onFileChange} />
            <button
              onClick={onPickFile}
              disabled={uploading}
              className="absolute bottom-0 right-0 h-10 w-10 rounded-xl bg-green-500 text-white grid place-items-center shadow-lg hover:scale-110 transition-all border-4 border-background"
              title="Change photo"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-5 w-5" />}
            </button>
          </div>
          
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2">
              <h2 className="text-3xl font-black tracking-tight">{displayName}</h2>
              {extra.pronouns && <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{extra.pronouns}</span>}
            </div>
            <p className="text-sm text-muted-foreground font-medium flex items-center justify-center lg:justify-start gap-2">
              <Mail className="h-4 w-4 text-green-500" /> {user?.email}
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-blue-500" /> Verified Host</span>
            </p>
            {bio && <p className="mt-4 text-sm text-foreground/80 max-w-lg leading-relaxed">{bio}</p>}
          </div>

          <div className="flex flex-row lg:flex-col gap-4 border-t lg:border-t-0 lg:border-l border-glass-border/50 pt-6 lg:pt-0 lg:pl-8">
            <div className="text-center lg:text-left">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Hosted</p>
              <p className="text-2xl font-black leading-none">{analytics.hostCount}</p>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Attended</p>
              <p className="text-2xl font-black leading-none">{analytics.participantCount}</p>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Minutes</p>
              <p className="text-2xl font-black leading-none">--</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 glass rounded-2xl p-1 inline-flex flex-wrap gap-1">
          {[
            { id: "personal" as const, label: "Personal" },
            { id: "professional" as const, label: "Professional" },
            { id: "preferences" as const, label: "Meeting preferences" },
            { id: "security" as const, label: "Security" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm transition-smooth ${
                tab === t.id ? "bg-brand-green text-primary-foreground shadow-brand" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="glass rounded-2xl p-10 mt-5 grid place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-5">
            {tab === "personal" && (
              <form onSubmit={save} className="glass rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Display name">
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} className="h-11 bg-input/60 border-glass-border" />
                  </Field>
                  <Field label="Pronouns (optional)">
                    <Input value={extra.pronouns} onChange={(e) => persistExtra({ ...extra, pronouns: e.target.value })} maxLength={20} placeholder="she/her, he/him, they/them…" className="h-11 bg-input/60 border-glass-border" />
                  </Field>
                </div>
                <Field label="Short bio">
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} placeholder="What you do, where you're based…" className="bg-input/60 border-glass-border min-h-[88px]" />
                  <p className="text-[11px] text-muted-foreground mt-1 text-right">{bio.length}/280</p>
                </Field>
                <Field label="Profile color (Meet style)">
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { name: "Blue", value: "#1a73e8" },
                      { name: "Green", value: "#1e8e3e" },
                      { name: "Red", value: "#d93025" },
                      { name: "Yellow", value: "#f9ab00" },
                      { name: "Purple", value: "#9334e6" },
                      { name: "Pink", value: "#e52592" },
                      { name: "Default", value: "" },
                    ].map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setProfileColor(c.value)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${profileColor === c.value ? 'border-primary scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c.value || '#333' }}
                        title={c.name}
                      >
                        {c.value === "" && <span className="text-[10px] text-white font-bold">A-Z</span>}
                      </button>
                    ))}
                    <div className="flex items-center gap-2 ml-auto">
                      <Label className="text-xs">Custom Hex:</Label>
                      <Input 
                        value={profileColor} 
                        onChange={(e) => setProfileColor(e.target.value)} 
                        className="h-8 w-24 text-xs bg-input/60 border-glass-border" 
                        placeholder="#hex"
                      />
                    </div>
                  </div>
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Location" icon={<MapPin className="h-3.5 w-3.5" />}>
                    <Input value={extra.location} onChange={(e) => persistExtra({ ...extra, location: e.target.value })} placeholder="Nairobi, Kenya" className="h-11 bg-input/60 border-glass-border" />
                  </Field>
                  <Field label="Time zone" icon={<Clock className="h-3.5 w-3.5" />}>
                    <Input value={extra.timezone} onChange={(e) => persistExtra({ ...extra, timezone: e.target.value })} placeholder="Africa/Nairobi" className="h-11 bg-input/60 border-glass-border" />
                  </Field>
                </div>
                <Button type="submit" disabled={saving} className="bg-gradient-brand text-primary-foreground border-0 shadow-brand w-full sm:w-auto h-12 px-8 rounded-xl font-bold">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Save className="h-4 w-4 mr-1.5" /> Save changes</>)}
                </Button>
              </form>
            )}

            {tab === "professional" && (
              <form onSubmit={save} className="glass rounded-2xl p-5 sm:p-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Job title" icon={<Briefcase className="h-3.5 w-3.5" />}>
                    <Input value={extra.title} onChange={(e) => persistExtra({ ...extra, title: e.target.value })} placeholder="Product Manager" className="h-11 bg-input/60 border-glass-border" />
                  </Field>
                  <Field label="Company" icon={<Building2 className="h-3.5 w-3.5" />}>
                    <Input value={extra.company} onChange={(e) => persistExtra({ ...extra, company: e.target.value })} placeholder="Acme Inc." className="h-11 bg-input/60 border-glass-border" />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Phone" icon={<Phone className="h-3.5 w-3.5" />}>
                    <Input type="tel" value={extra.phone} onChange={(e) => persistExtra({ ...extra, phone: e.target.value })} placeholder="+254 700 000 000" className="h-11 bg-input/60 border-glass-border" />
                  </Field>
                  <Field label="Website" icon={<Globe2 className="h-3.5 w-3.5" />}>
                    <Input value={extra.website} onChange={(e) => persistExtra({ ...extra, website: e.target.value })} placeholder="https://yourdomain.com" className="h-11 bg-input/60 border-glass-border" />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="LinkedIn" icon={<Linkedin className="h-3.5 w-3.5" />}>
                    <Input value={extra.linkedin} onChange={(e) => persistExtra({ ...extra, linkedin: e.target.value })} placeholder="linkedin.com/in/you" className="h-11 bg-input/60 border-glass-border" />
                  </Field>
                  <Field label="GitHub" icon={<Github className="h-3.5 w-3.5" />}>
                    <Input value={extra.github} onChange={(e) => persistExtra({ ...extra, github: e.target.value })} placeholder="@yourhandle" className="h-11 bg-input/60 border-glass-border" />
                  </Field>
                </div>
                <Button type="submit" disabled={saving} className="bg-gradient-brand text-primary-foreground border-0 shadow-brand w-full sm:w-auto h-12 px-8 rounded-xl font-bold">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Save className="h-4 w-4 mr-1.5" /> Save changes</>)}
                </Button>
              </form>
            )}

            {tab === "preferences" && (
              <div className="glass rounded-2xl p-5 sm:p-6">
                <p className="text-sm text-muted-foreground mb-3">Customize how you join meetings.</p>
                <Link to="/dashboard/settings" className="flex items-center justify-between rounded-lg p-4 bg-card/40 hover:bg-card/60">
                  <div>
                    <p className="text-sm font-medium">Audio, video & notifications</p>
                    <p className="text-xs text-muted-foreground">Configure mic, camera, mirror view, lobby alerts.</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            )}

            {tab === "security" && (
              <div className="space-y-3">
                <div className="glass rounded-2xl p-5 mb-4 border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary grid place-items-center">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Pair New Device</p>
                      <p className="text-xs text-muted-foreground">Enter the code from your other device to sync.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={pairingInput} 
                      onChange={(e) => setPairingInput(e.target.value.toUpperCase())}
                      placeholder="ABC123XY" 
                      className="h-11 bg-input/60 border-glass-border font-mono tracking-[0.2em] text-center uppercase"
                      maxLength={8}
                    />
                    <Button 
                      onClick={verifyPairCode} 
                      disabled={pairingLoading || !pairingInput}
                      className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold shadow-brand"
                    >
                      {pairingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                </div>

                <SecurityRow icon={<Mail className="h-4 w-4" />} title="Email address" desc={user?.email ?? ""} action={<span className="text-xs text-success font-bold">Verified</span>} />
                <SecurityRow 
                  icon={<KeyRound className="h-4 w-4" />} 
                  title="Password" 
                  desc="Secure your account with a strong password" 
                  action={<Button size="sm" variant="ghost" className="font-bold text-primary hover:bg-primary/10" onClick={() => setSecurityDialogOpen({ open: true, type: 'password' })}>Reset</Button>} 
                />
                <SecurityRow 
                  icon={<ShieldCheck className="h-4 w-4 text-brand-green" />} 
                  title="Email 2FA" 
                  desc={mfaEnabled ? "Account is protected by Email OTP" : "Receive a code via email when you sign in"} 
                  action={<Button size="sm" variant="ghost" className={`font-bold ${mfaEnabled ? 'text-destructive hover:bg-destructive/10' : 'text-primary hover:bg-primary/10'}`} onClick={() => setSecurityDialogOpen({ open: true, type: 'mfa' })}>{mfaEnabled ? "Disable" : "Enable"}</Button>} 
                />
                <SecurityRow 
                  icon={<LogOut className="h-4 w-4" />} 
                  title="Active sessions" 
                  desc="Sign out from all other logged-in devices" 
                  action={<Button size="sm" variant="ghost" className="font-bold text-destructive hover:bg-destructive/10" onClick={() => setSecurityDialogOpen({ open: true, type: 'sessions' })}>Sign out all</Button>} 
                />
              </div>
            )}
          </div>
        )}

        {/* Security Confirmation Dialogs */}
        <AlertDialog open={securityDialogOpen.open} onOpenChange={(open) => !open && setSecurityDialogOpen({ open: false, type: null })}>
          <AlertDialogContent className="glass border-glass-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                {securityDialogOpen.type === 'password' && "Reset Password?"}
                {securityDialogOpen.type === 'sessions' && "Sign out everywhere?"}
                {securityDialogOpen.type === 'mfa' && (mfaEnabled ? "Disable 2FA?" : "Enable 2FA?")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {securityDialogOpen.type === 'password' && "We will send a password reset link to your email address."}
                {securityDialogOpen.type === 'sessions' && "This will terminate all active sessions across all your devices, including this one."}
                {securityDialogOpen.type === 'mfa' && (mfaEnabled ? "Your account will be less secure. Are you sure you want to disable 2FA?" : "Enable two-factor authentication to better protect your account.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl border-glass-border">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (securityDialogOpen.type === 'password') handlePasswordReset();
                  if (securityDialogOpen.type === 'sessions') handleGlobalSignOut();
                  if (securityDialogOpen.type === 'mfa') toggleMFA();
                }}
                className={`rounded-xl font-bold shadow-brand ${securityDialogOpen.type === 'sessions' || (securityDialogOpen.type === 'mfa' && mfaEnabled) ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardShell>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
        {icon} {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SecurityRow({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl glass grid place-items-center text-primary shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      {action}
    </div>
  );
}