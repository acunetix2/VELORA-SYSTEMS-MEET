import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Mail, Users2, ChevronDown, User, ExternalLink, Video, Phone, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { generateMeetingId } from "@/lib/meeting";

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
};
const KEY = "velora:contacts";

import { supabase } from "@/integrations/supabase/client";

function Page() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [notes, setNotes] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

      setItems(data || []);
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
        notes: notes.trim()
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add contact");
      return;
    }

    setItems([data, ...items]);
    setName(""); setEmail(""); setPhone(""); setCompany(""); setJobRole(""); setNotes("");
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
    toast.success("Contact removed");
  };

  const startCall = (contactName: string) => {
    const mid = generateMeetingId();
    toast.success(`Starting call with ${contactName}...`, {
      description: "Redirecting you to a private meeting room."
    });
    navigate({ to: "/meet/$meetingId", params: { meetingId: mid }, search: { mode: "private" } });
  };

  return (
    <DashboardShell title="Contacts">
      <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto grid lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Left column: Add Contact */}
        <div className="dash-card sticky top-8">
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
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Email Address</Label>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="jane@example.com" 
                  className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Phone</Label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="+254..." 
                    className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Company</Label>
                  <Input 
                    value={company} 
                    onChange={(e) => setCompany(e.target.value)} 
                    placeholder="Acme Inc" 
                    className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Job Role</Label>
                <Input 
                  value={jobRole} 
                  onChange={(e) => setJobRole(e.target.value)} 
                  placeholder="Senior Lead" 
                  className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Private Notes</Label>
                <Input 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Met at tech conference..." 
                  className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-green-500/20" 
                />
              </div>
              <Button 
                onClick={add} 
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white border-0 shadow-glow rounded-xl font-bold mt-2"
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
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-card/60 px-3 py-1 rounded-full border border-glass-border">
              {items.length} Contacts
            </span>
          </div>

          {items.length === 0 ? (
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
                  <div key={c.id} className={`dash-card ${isExpanded ? 'ring-2 ring-green-500/20' : ''}`}>
                    <div className="dash-card-accent accent-green" />
                    <div 
                      className="dash-card-header"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar name={c.name} size="lg" className="ring-2 ring-glass-border ring-offset-2 ring-offset-background" />
                        <div className="min-w-0">
                          <h3 className="font-bold text-base truncate">{c.name}</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground truncate">{c.email || "No email"}</p>
                            {c.company && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <p className="text-xs text-primary font-medium truncate">{c.company}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className={`h-8 w-8 rounded-lg grid place-items-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-green-500/10 text-green-500' : 'text-muted-foreground'}`}>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="dash-card-content border-t border-glass-border/50 pt-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Information</h4>
                            <div className="space-y-2">
                              {c.email && (
                                <div className="flex items-center gap-3 text-sm text-foreground/80">
                                  <Mail className="h-4 w-4 text-green-500" /> {c.email}
                                </div>
                              )}
                              {c.phone && (
                                <div className="flex items-center gap-3 text-sm text-foreground/80">
                                  <Phone className="h-4 w-4 text-green-500" /> {c.phone}
                                </div>
                              )}
                              {c.job_role && (
                                <div className="flex items-center gap-3 text-sm text-foreground/80">
                                  <Briefcase className="h-4 w-4 text-green-500" /> {c.job_role}
                                </div>
                              )}
                            </div>
                            {c.notes && (
                              <div className="mt-4 p-3 rounded-xl bg-muted/20 border border-glass-border text-xs text-muted-foreground italic">
                                "{c.notes}"
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Actions</h4>
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={(e) => { e.stopPropagation(); startCall(c.name); }}
                                className="rounded-xl border-glass-border hover:bg-green-500/5 hover:text-green-500 h-9"
                              >
                                <Video className="h-3.5 w-3.5 mr-2" /> Start Call
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={(e) => { e.stopPropagation(); remove(c.id); }} 
                                className="rounded-xl text-destructive hover:bg-destructive/10 h-9"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                              </Button>
                            </div>
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
    </DashboardShell>
  );
}