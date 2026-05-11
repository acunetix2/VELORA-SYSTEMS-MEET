import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Mail, Users2, ChevronDown, User, Video, Phone,
  Briefcase, Building2, X, ExternalLink, Loader2, MapPin, Globe,
  Shield, GraduationCap
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { generateMeetingId } from "@/lib/meeting";
import { supabase } from "@/integrations/supabase/client";

function ContactsComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Velora" }] }),
  component: ContactsComponent,
});

type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  job_role?: string;
  notes?: string;
  avatar_url?: string | null;
};

type VeloraProfile = {
  id: string;
  display_name: string;
  email?: string;
  avatar_url?: string | null;
  job_role?: string | null;
  bio?: string | null;
  color?: string | null;
};

function Page() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [notes, setNotes] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile dialog state
  const [profileContact, setProfileContact] = useState<Contact | null>(null);
  const [veloraProfile, setVeloraProfile] = useState<VeloraProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (email.includes("@") && email.length > 5) {
      const lookup = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, job_role")
          .eq("email", email.trim())
          .maybeSingle();
        if (data) {
          if (!name) setName((data as any).display_name || "");
          if (!jobRole) setJobRole((data as any).job_role || "");
          setAvatarUrl((data as any).avatar_url || null);
          toast.success("Velora profile found!");
        }
      };
      const t = setTimeout(lookup, 500);
      return () => clearTimeout(t);
    }
  }, [email]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("contacts" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load contacts");
        setLoading(false);
        return;
      }
      setItems((data as Contact[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const add = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("contacts" as any)
      .insert({
        user_id: user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        job_role: jobRole.trim(),
        notes: notes.trim(),
        avatar_url: avatarUrl
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add contact");
      return;
    }
    setItems([(data as Contact), ...items]);
    setName(""); setEmail(""); setPhone(""); setCompany(""); setJobRole(""); setNotes(""); setAvatarUrl(null);
    toast.success("Contact added");
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from("contacts" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove contact");
      return;
    }
    setItems(items.filter((c) => c.id !== id));
    if (expandedId === id) setExpandedId(null);
    toast.success("Contact removed");
  };

  // Start a real Velora Meet call — opens a new private meeting room
  const startCall = (contact: Contact) => {
    const mid = generateMeetingId();
    toast.success(`Starting call with ${contact.name}…`, {
      description: "Opening private meeting room."
    });
    // Open in same tab so the user stays in the app
    navigate({ to: "/meet/$meetingId", params: { meetingId: mid } });
  };

  // View Velora profile — looks up the contact's profile by email
  const viewProfile = async (contact: Contact) => {
    setProfileContact(contact);
    setVeloraProfile(null);
    setProfileLoading(true);

    if (contact.email) {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, email, avatar_url, job_role, bio, color")
        .eq("email", contact.email.trim())
        .maybeSingle();

      if (data) {
        setVeloraProfile(data as VeloraProfile);
      }
    }
    setProfileLoading(false);
  };

  return (
    <DashboardShell title="Contacts">
      <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto grid lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Left column: Add Contact */}
        <div className="dash-card card-lining-left sticky top-8">
          <div className="dash-card-accent accent-green" />
          <div className="p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 grid place-items-center">
                <Plus className="h-4 w-4 text-green-500" />
              </div>
              New Contact
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Display Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-bold ml-1">Email address</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-bold ml-1">Phone number</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254..."
                    className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-bold ml-1">Company</Label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Inc"
                    className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-bold ml-1">Job role</Label>
                <Input
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Senior Lead"
                  className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-bold ml-1">Private notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Met at tech conference..."
                  className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20"
                />
              </div>
              {/* Preview avatar if profile found */}
              {avatarUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                  <img src={avatarUrl} alt="Profile" className="h-10 w-10 rounded-full object-cover ring-2 ring-green-500/30" />
                  <div>
                    <p className="text-[11px] font-bold text-green-600">Velora profile found</p>
                    <p className="text-[10px] text-muted-foreground">Photo will be saved with contact</p>
                  </div>
                </div>
              )}
              <Button
                onClick={add}
                className="w-full h-12 bg-primary text-primary-foreground border-0 shadow-glow rounded-xl font-bold mt-2"
              >
                Add to Directory
              </Button>
            </div>
          </div>
        </div>

        {/* Right column: List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users2 className="h-5 w-5 text-green-500" />
              Your Directory
            </h2>
            <span className="text-xs font-bold text-muted-foreground bg-card/60 px-3 py-1 rounded-full border border-glass-border">
              {items.length} Contacts
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="dash-card p-12 text-center border-dashed">
              <div className="h-16 w-16 rounded-full bg-muted/20 grid place-items-center mx-auto mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-lg">No contacts yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[240px] mx-auto">
                Add people to your directory for quick meeting invites and collaboration.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((c) => {
                const isExpanded = expandedId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`dash-card card-lining-left lining-green shadow-elegant transition-all bg-gradient-to-br from-card to-background ${isExpanded ? 'ring-2 ring-primary/20 border-primary/30' : ''}`}
                  >
                    <div className="dash-card-accent accent-green" />
                    <div
                      className="dash-card-header cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Profile photo from avatar_url */}
                        <div className="relative shrink-0">
                          <Avatar
                            name={c.name}
                            src={c.avatar_url ?? undefined}
                            size="lg"
                            className="ring-2 ring-glass-border ring-offset-2 ring-offset-background"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm break-words leading-tight">{c.name}</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] text-muted-foreground break-words leading-tight mt-0.5">
                              {c.email || "No email"}
                            </p>
                            {c.company && (
                              <p className="text-[10px] text-primary font-bold break-words mt-0.5">{c.company}</p>
                            )}
                          </div>
                          {c.job_role && (
                            <p className="text-[10px] text-amber-500 font-semibold mt-0.5">{c.job_role}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          className={`h-7 w-7 rounded-lg grid place-items-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-green-500/10 text-green-500' : 'text-muted-foreground'}`}
                          onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : c.id); }}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="dash-card-content border-t border-glass-border/50 p-4 bg-muted/5">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2.5">
                            {c.email && (
                              <div className="flex items-center gap-2 text-[11px] text-blue-500 font-bold tracking-tight">
                                <Mail className="h-3.5 w-3.5" /> {c.email}
                              </div>
                            )}
                            {c.phone && (
                              <div className="flex items-center gap-2 text-[11px] text-green-600 font-bold tracking-tight">
                                <Phone className="h-3.5 w-3.5" /> {c.phone}
                              </div>
                            )}
                            {c.job_role && (
                              <div className="flex items-center gap-2 text-[11px] text-amber-600 font-bold tracking-tight">
                                <Briefcase className="h-3.5 w-3.5" /> {c.job_role}
                              </div>
                            )}
                            {c.company && (
                              <div className="flex items-center gap-2 text-[11px] text-purple-600 font-bold tracking-tight">
                                <Building2 className="h-3.5 w-3.5" /> {c.company}
                              </div>
                            )}
                            {c.notes && (
                              <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/10 text-[11px] text-muted-foreground italic break-words relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                                "{c.notes}"
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-glass-border/30">
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); startCall(c); }}
                              className="rounded-lg bg-green-500 hover:bg-green-600 text-white shadow-glow h-9 text-[11px] font-bold px-4 gap-1.5"
                            >
                              <Video className="h-3.5 w-3.5" /> Start Call
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); viewProfile(c); }}
                              className="rounded-lg border-blue-500/30 text-blue-600 hover:bg-blue-500/10 h-9 text-[11px] font-bold px-4 gap-1.5"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> View Profile
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                              className="rounded-lg text-red-500 hover:bg-red-500/10 h-9 text-[11px] font-bold ml-auto gap-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* View Profile Dialog */}
      <Dialog open={!!profileContact} onOpenChange={(v) => { if (!v) { setProfileContact(null); setVeloraProfile(null); } }}>
        <DialogContent className="glass border-glass-border rounded-[2rem] p-0 max-w-sm overflow-hidden shadow-2xl">
          {profileContact && (
            <>
              {/* Header banner */}
              <div className="h-24 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 relative">
                <button
                  onClick={() => { setProfileContact(null); setVeloraProfile(null); }}
                  className="absolute top-3 right-3 h-7 w-7 bg-white/20 hover:bg-white/30 rounded-full grid place-items-center text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Avatar overlapping banner */}
              <div className="px-6 pb-6">
                <div className="-mt-10 mb-4 flex items-end justify-between">
                  <div className="relative">
                    {profileLoading ? (
                      <div className="h-20 w-20 rounded-2xl bg-muted/40 border-4 border-card flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Avatar
                        name={veloraProfile?.display_name || profileContact.name}
                        src={(veloraProfile?.avatar_url || profileContact.avatar_url) ?? undefined}
                        size="xl"
                        className="h-20 w-20 ring-4 ring-card rounded-2xl text-2xl"
                      />
                    )}
                    {veloraProfile && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
                        <Shield className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  {veloraProfile && (
                    <span className="text-[10px] font-black text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full tracking-widest uppercase">
                      Velora Member
                    </span>
                  )}
                </div>

                <DialogHeader>
                  <DialogTitle className="text-xl font-black tracking-tight">
                    {veloraProfile?.display_name || profileContact.name}
                  </DialogTitle>
                  {(veloraProfile?.job_role || profileContact.job_role) && (
                    <p className="text-[12px] text-primary font-bold flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="h-3 w-3" />
                      {veloraProfile?.job_role || profileContact.job_role}
                    </p>
                  )}
                </DialogHeader>

                {profileLoading ? (
                  <div className="py-8 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {!veloraProfile && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                        <GraduationCap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground font-medium">
                          This contact hasn't joined Velora Meet yet. Only locally stored info is shown.
                        </p>
                      </div>
                    )}

                    {(veloraProfile?.bio) && (
                      <p className="text-[13px] text-foreground/80 leading-relaxed font-medium italic">
                        "{veloraProfile.bio}"
                      </p>
                    )}

                    <div className="space-y-2 pt-1">
                      {profileContact.email && (
                        <div className="flex items-center gap-2.5 text-[12px] font-bold text-foreground/80">
                          <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          {profileContact.email}
                        </div>
                      )}
                      {profileContact.phone && (
                        <div className="flex items-center gap-2.5 text-[12px] font-bold text-foreground/80">
                          <Phone className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          {profileContact.phone}
                        </div>
                      )}
                      {profileContact.company && (
                        <div className="flex items-center gap-2.5 text-[12px] font-bold text-foreground/80">
                          <Building2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                          {profileContact.company}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-glass-border flex gap-2">
                      <Button
                        onClick={() => { setProfileContact(null); setVeloraProfile(null); startCall(profileContact); }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl h-10 font-bold text-[12px] shadow-glow gap-2"
                      >
                        <Video className="h-4 w-4" /> Start Call
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setProfileContact(null); setVeloraProfile(null); }}
                        className="flex-1 rounded-xl h-10 font-bold text-[12px] border-glass-border"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}