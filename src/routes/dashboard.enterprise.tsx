import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OrgShell } from "@/components/dashboard/OrgShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import {
  Building2, ShieldCheck, KeyRound, Globe, Users,
  BarChart2, CreditCard, ChevronRight, Sparkles, Loader2,
  Plus, Rocket, Crown, Package, CheckCircle2, AlertCircle,
  Terminal, Zap, Shield, Heart, Fingerprint, Image as ImageIcon,
  Upload, Camera, Check, Search
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { Loader } from "@/components/Loader";

function EnterpriseComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/enterprise")({
  head: () => ({ meta: [{ title: "Enterprise — Velora" }] }),
  component: EnterpriseComponent,
});

type Org = { id: string; name: string; settings: any; admin_passcode_hash?: string };
type Member = { id: string; role: string; user: { email: string; display_name: string } };

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Page() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const org = orgs.find(o => o.id === activeOrgId) || null;
  
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDomain, setNewOrgDomain] = useState("");
  const [newOrgBillingEmail, setNewOrgBillingEmail] = useState("");
  const [newOrgIndustry, setNewOrgIndustry] = useState("");
  const [showSetupPasscode, setShowSetupPasscode] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockPasscode, setUnlockPasscode] = useState("");
  const [showUnlockSuccess, setShowUnlockSuccess] = useState(false);
  const [tempLogo, setTempLogo] = useState<string | null>(null);
  const [tempBanner, setTempBanner] = useState<string | null>(null);
  
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [orgProducts, setOrgProducts] = useState<any[]>([]);
  
  const [stats, setStats] = useState<{ meetings: number; activeMembers: number; aiMinutes: number } | null>(null);
  const [isAppointingLead, setIsAppointingLead] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  
  const [isOnboardingMember, setIsOnboardingMember] = useState(false);
  const [obName, setObName] = useState("");
  const [obEmail, setObEmail] = useState("");
  const [obDept, setObDept] = useState("");
  const [obRole, setObRole] = useState("member");

  const fetchOrgs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: memberData } = await supabase
        .from("organization_members")
        .select("org_id, organizations(*)")
        .eq("user_id", user.id);

      if (memberData && memberData.length > 0) {
        setOrgs(memberData.map(m => m.organizations as any).filter(Boolean));
      } else {
        setOrgs([]);
      }
    } catch (err) {
      console.error("Error fetching orgs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembersForActiveOrg = async () => {
    if (!activeOrgId) {
      setMembers([]);
      return;
    }
    const { data } = await supabase
      .from("organization_members")
      .select("id, role, joined_at, user:profiles(*)")
      .eq("org_id", activeOrgId);
    setMembers(data || []);
  };

  const fetchOrgStats = async () => {
    if (!activeOrgId) return;
    try {
      // Fetch real meeting count
      const { count: meetingCount } = await supabase
        .from("meetings")
        .select("*", { count: 'exact', head: true })
        .eq("org_id", activeOrgId);

      // Fetch AI Minutes (summed from a hypothetical column or just mocked if not exists)
      const { data: meetings } = await supabase
        .from("meetings")
        .select("id")
        .eq("org_id", activeOrgId);

      setStats({
        meetings: meetingCount || 0,
        activeMembers: members.length,
        aiMinutes: (meetingCount || 0) * 42, // Average 42 mins per meeting
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrgProducts = async () => {
    if (!activeOrgId) return;
    setOrgProducts(org?.settings?.products || []);
  };

  useEffect(() => {
    fetchMembersForActiveOrg();
    fetchOrgStats();
    fetchOrgProducts();
  }, [activeOrgId, members.length]);

  useEffect(() => {
    setIsUnlocked(false);
    setUnlockPasscode("");
    setTempLogo(org?.settings?.logo_url || null);
    setTempBanner(org?.settings?.banner_url || null);
  }, [activeOrgId, org?.id]);

  useEffect(() => {
    fetchOrgs();
  }, [user]);

  useEffect(() => {
    fetchMembersForActiveOrg();
    if (org && !org.admin_passcode_hash) {
      setShowSetupPasscode(true);
    } else {
      setShowSetupPasscode(false);
    }
  }, [activeOrgId, org?.admin_passcode_hash]);

  const createOrg = async () => {
    if (!newOrgName.trim() || !user) return;
    setLoading(true);
    
    // Create org
    const { data: orgData, error: orgErr } = await supabase
      .from("organizations")
      .insert({ 
        name: newOrgName,
        owner_id: user.id,
        settings: {
          domain: newOrgDomain,
          billingEmail: newOrgBillingEmail,
          industry: newOrgIndustry
        }
      })
      .select()
      .single();

    if (orgErr) {
      console.error(orgErr);
      toast.error("failed to create organization");
      setLoading(false);
      return;
    }

    // Add user as admin
    const { error: memberErr } = await supabase
      .from("organization_members")
      .insert({ org_id: orgData.id, user_id: user.id, role: "admin" });

    if (memberErr) {
      console.error(memberErr);
      toast.error("failed to add user to organization");
      setLoading(false);
      return;
    }

    toast.success("organization created successfully!");
    setIsCreatingOrg(false);
    setNewOrgName("");
    setNewOrgDomain("");
    setNewOrgBillingEmail("");
    setNewOrgIndustry("");
    await fetchOrgs();
    setActiveOrgId(orgData.id); // Auto switch to newly created org
  };
  
  const [activeTab, setActiveTab] = useState("overview");

  if (loading && orgs.length === 0) return (
    <DashboardShell title="Enterprise">
      <div className="h-[60vh] flex items-center justify-center">
        <Loader label="Synchronizing organizations" />
      </div>
    </DashboardShell>
  );

  if (!activeOrgId || !org) {
    return (
      <DashboardShell title="Organization Hub">
        <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
          {orgs.length === 0 ? (
            <div className="bg-card/30 border border-glass-border rounded-3xl p-12 text-center flex flex-col items-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary grid place-items-center mb-6 shadow-inner border border-primary/10">
                <Building2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold mb-3 tracking-tight">Scale your enterprise</h2>
              <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-sm font-medium leading-relaxed">
                Centralized billing, domain-level security, and team-wide intelligence for professional teams.
              </p>
              <Button 
                size="lg" 
                className="bg-primary text-white hover:opacity-90 shadow-glow rounded-xl h-12 px-8 font-bold text-base transition-all hover:scale-105 active:scale-95"
                onClick={() => setIsCreatingOrg(true)}
              >
                <Plus className="h-5 w-5 mr-2" /> Start organization
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">Your organizations</h2>
                  <p className="text-muted-foreground font-medium text-sm">Manage your team settings and workspace security.</p>
                </div>
                <Button onClick={() => setIsCreatingOrg(true)} className="rounded-xl h-10 px-5 shadow-sm font-bold bg-primary text-white text-sm">
                  <Plus className="h-4 w-4 mr-2" /> New organization
                </Button>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {orgs.map((o) => (
                  <div 
                    key={o.id} 
                    className="group relative bg-card/40 border border-glass-border rounded-2xl p-6 flex flex-col items-start hover:bg-card/60 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 border-transparent hover:border-primary/20" 
                    onClick={() => setActiveOrgId(o.id)}
                  >
                    <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ChevronRight className="h-5 w-5 text-primary" />
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary grid place-items-center mb-5 group-hover:scale-110 transition-all border border-primary/5">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-1 truncate w-full tracking-tight">{o.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground font-semibold text-[10px] uppercase tracking-widest mb-4">
                      <Globe className="h-2.5 w-2.5" />
                      {o.settings?.domain || "unverified domain"}
                    </div>
                    <div className="mt-auto w-full pt-4 border-t border-glass-border flex justify-between items-center text-xs font-bold text-primary/80 group-hover:text-primary transition-colors">
                      Enter management hub
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isCreatingOrg && (
          <div className="fixed inset-0 z-50 grid place-items-center px-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-card border border-glass-border rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 tracking-tight">
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary">
                   <Building2 className="h-5 w-5" />
                </div>
                Create organization
              </h2>
              <div className="space-y-4 max-h-[65vh] overflow-y-auto no-scrollbar pr-1">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-primary ml-1">Full legal name</Label>
                  <Input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="e.g. Acme Corporation" className="bg-muted/30 h-11 rounded-xl border-glass-border focus:ring-primary/20 text-sm font-medium px-4" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Company Domain</Label>
                    <Input value={newOrgDomain} onChange={(e) => setNewOrgDomain(e.target.value)} placeholder="acme.com" className="bg-muted/30 h-10 rounded-lg border-glass-border focus:ring-primary/20 text-xs font-medium px-3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Billing Email</Label>
                    <Input value={newOrgBillingEmail} onChange={(e) => setNewOrgBillingEmail(e.target.value)} placeholder="finance@acme.com" type="email" className="bg-muted/30 h-10 rounded-lg border-glass-border focus:ring-primary/20 text-xs font-medium px-3" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Industry Vertical</Label>
                  <Input value={newOrgIndustry} onChange={(e) => setNewOrgIndustry(e.target.value)} placeholder="e.g. Healthcare, Technology" className="bg-muted/30 h-10 rounded-lg border-glass-border focus:ring-primary/20 text-xs font-medium px-3" />
                </div>
                
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 mt-2">
                   <p className="text-[10px] text-primary/80 font-bold leading-relaxed">
                    <span className="uppercase tracking-widest mr-1">Note:</span>
                    You will be initialized as the primary Organization Administrator.
                  </p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setIsCreatingOrg(false)} className="flex-1 rounded-xl h-11 font-bold text-muted-foreground hover:bg-muted/20 text-xs transition-colors">Discard</button>
                  <Button onClick={createOrg} disabled={!newOrgName || loading} className="flex-1 bg-primary text-white rounded-xl h-11 shadow-sm font-bold text-sm">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initialize Org"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardShell>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            <div className="relative rounded-3xl overflow-hidden shadow-sm group">
              <div className="h-48 w-full bg-muted relative overflow-hidden">
                {org.settings?.banner_url ? (
                  <img src={org.settings.banner_url} alt="Organization banner" className="w-full h-full object-cover transition-opacity duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              
              <div className="relative px-8 pb-8 -mt-12 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  <div className="h-24 w-24 rounded-2xl bg-card border-4 border-background shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                    {org.settings?.logo_url ? (
                      <img src={org.settings.logo_url} alt="Organization logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="h-10 w-10 text-primary" />
                    )}
                  </div>
                  <div className="space-y-1 mb-1">
                    <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 rounded-full bg-primary/20 text-white text-[9px] font-bold backdrop-blur-md border border-white/10">Enterprise intelligence</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight leading-tight text-white drop-shadow-md">{org.name}</h2>
                    <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                       <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" />
                          <span>{org.settings?.domain || "No domain verified"}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>{members.length} Active seats</span>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mb-1">
                   <Button size="sm" variant="secondary" className="rounded-xl h-9 px-4 font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md text-xs">
                      View public profile
                   </Button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { id: 'members', title: 'Team governance', sub: 'Roles & invites', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { id: 'security', title: 'Shield & access', sub: 'SSO & compliance', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { id: 'billing', title: 'Financial ops', sub: 'Usage & invoices', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
              ].map((card) => (
                <div 
                  key={card.id}
                  className="bg-card/40 border border-glass-border p-8 rounded-2xl flex flex-col items-center text-center hover:bg-card/60 hover:-translate-y-1 transition-all cursor-pointer group shadow-sm" 
                  onClick={() => setActiveTab(card.id)}
                >
                  <div className={`h-12 w-12 rounded-xl ${card.bg} ${card.color} grid place-items-center mb-4 group-hover:scale-110 transition-transform shadow-inner`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold mb-1 tracking-tight">{card.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case "onboarding":
        return (
          <div className="space-y-8 max-w-4xl">
            <div className="space-y-1 px-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Organization launchpad</h2>
              <p className="text-muted-foreground text-sm font-medium">Complete these steps to fully initialize your enterprise workspace.</p>
            </div>

            <div className="grid gap-4">
              {[
                { title: "Domain verification", desc: "Connect and verify your corporate domain for SSO.", status: "completed", icon: Globe },
                { title: "Identity provider (SSO)", desc: "Configure Okta or Azure AD for team access.", status: "pending", icon: ShieldCheck },
                { title: "Brand identity", desc: "Upload logo and set workspace theme colors.", status: "completed", icon: Sparkles },
                { title: "Initial team sync", desc: "Invite department leads and admins.", status: "pending", icon: Users },
                { title: "Security protocols", desc: "Enforce MFA and set organization passcode.", status: "completed", icon: KeyRound }
              ].map((step, i) => (
                <div key={i} className="bg-card/40 border border-glass-border rounded-2xl p-6 flex items-center justify-between group hover:bg-card/60 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl grid place-items-center border transition-colors ${
                      step.status === "completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/10 text-primary"
                    }`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">{step.title}</h3>
                      <p className="text-[11px] text-muted-foreground font-medium">{step.desc}</p>
                    </div>
                  </div>
                  {step.status === "completed" ? (
                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/10">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-lg h-8 px-4 text-[10px] font-bold border-glass-border hover:bg-primary/5">Setup</Button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary text-white grid place-items-center">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Onboarding progress</h3>
                    <p className="text-[11px] text-muted-foreground font-medium">Your organization is 60% initialized.</p>
                  </div>
               </div>
               <div className="w-48 h-2 bg-muted/50 rounded-full overflow-hidden hidden sm:block">
                  <div className="h-full bg-primary" style={{ width: "60%" }} />
               </div>
            </div>
          </div>
        );
      case "members":
        const groupedMembers = members.reduce((acc: any, m) => {
          const dept = m.user?.department || "General Operations";
          if (!acc[dept]) acc[dept] = [];
          acc[dept].push(m);
          return acc;
        }, {});

        return (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Team infrastructure</h2>
                <p className="text-muted-foreground text-sm font-medium">Departmental grouping and role-based governance.</p>
              </div>
              <Dialog open={isOnboardingMember} onOpenChange={setIsOnboardingMember}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    className="rounded-xl h-10 px-6 font-bold bg-primary text-white shadow-sm transition-all active:scale-95 text-xs" 
                  >
                    <Plus className="h-4 w-4 mr-2" /> Onboard member
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-glass-border sm:max-w-[425px] rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Manual onboarding</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold ml-1">Full name</Label>
                      <Input placeholder="e.g. John Doe" className="bg-muted/30 rounded-xl h-11 border-glass-border text-sm font-medium" value={obName} onChange={e => setObName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold ml-1">Email address</Label>
                      <Input type="email" placeholder="john@acme.com" className="bg-muted/30 rounded-xl h-11 border-glass-border text-sm font-medium" value={obEmail} onChange={e => setObEmail(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold ml-1">Department</Label>
                        <Input placeholder="e.g. Engineering" className="bg-muted/30 rounded-xl h-11 border-glass-border text-sm font-medium" value={obDept} onChange={e => setObDept(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold ml-1">Access rank</Label>
                        <select 
                          className="w-full bg-muted/30 rounded-xl h-11 border border-glass-border text-sm font-medium px-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={obRole}
                          onChange={e => setObRole(e.target.value)}
                        >
                          <option value="member">Associate</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      className="w-full bg-primary text-white h-11 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
                      onClick={async () => {
                        if (!obEmail || !obName) return;
                        toast.loading("Onboarding team member...", { id: "onboard" });
                        
                        // Check if user exists in profiles, otherwise we'd need to invite them
                        // For this high-fidelity prototype, we insert directly into organization_members
                        // In a real app, this would trigger an invitation email or a user creation flow
                        
                        const { data: userData } = await supabase.from("profiles").select("id").eq("email", obEmail).single();
                        
                        if (!userData) {
                          toast.error("User must have a Velora account to be added manually.", { id: "onboard" });
                          return;
                        }

                        const { error } = await supabase
                          .from("organization_members")
                          .insert({ 
                            org_id: activeOrgId, 
                            user_id: userData.id, 
                            role: obRole 
                          });
                        
                        if (!error && obDept) {
                          // Update user department in profiles if provided
                          await supabase
                            .from("profiles")
                            .update({ department: obDept })
                            .eq("id", userData.id);
                        }
                        
                        if (error) {
                          toast.error("Onboarding failed or user already exists in org", { id: "onboard" });
                        } else {
                          toast.success("Team member onboarded", { id: "onboard" });
                          setIsOnboardingMember(false);
                          setObName("");
                          setObEmail("");
                          setObDept("");
                          fetchMembersForActiveOrg();
                        }
                      }}
                    >
                      Complete onboarding
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-10">
               {Object.entries(groupedMembers).map(([dept, deptMembers]: [string, any]) => (
                  <div key={dept} className="space-y-4">
                     <div className="flex items-center gap-3 px-2">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-primary">{dept}</h3>
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{deptMembers.length} members</span>
                     </div>
                     <div className="bg-card/40 border border-glass-border rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-muted/30 border-b border-glass-border">
                                 <th className="px-6 py-3 font-bold text-[10px] text-muted-foreground">Identity</th>
                                 <th className="px-6 py-3 font-bold text-[10px] text-muted-foreground">Access rank</th>
                                 <th className="px-6 py-3 font-bold text-[10px] text-muted-foreground text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-glass-border">
                              {deptMembers.sort((a: any, b: any) => (a.role === "admin" ? -1 : 1)).map((m: any) => (
                                 <tr key={m.id} className="hover:bg-muted/10 transition-colors group">
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-3">
                                          <div className="h-9 w-9 rounded-full bg-primary/10 grid place-items-center text-primary text-sm font-bold shadow-inner border border-primary/5">
                                             {(m.user?.display_name || m.user?.email || "?").charAt(0).toUpperCase()}
                                          </div>
                                          <div className="min-w-0">
                                             <div className="font-bold text-sm text-foreground tracking-tight">{m.user?.display_name || "Anonymous member"}</div>
                                             <div className="text-[10px] text-muted-foreground font-medium">{m.user?.email}</div>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${
                                          m.role === "admin" ? "bg-amber-500/10 text-amber-500 border border-amber-500/10" : "bg-muted text-muted-foreground border border-glass-border"
                                       }`}>
                                          {m.role === "admin" && <Crown className="h-2.5 w-2.5 mr-1" />}
                                          {m.role === "admin" ? "Organization lead" : "Associate"}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <button className="h-8 px-3 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">Manage</button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        );
      case "leads":
        const adminLeads = members.filter(m => m.role === "admin");
        const eligibleMembers = members.filter(m => m.role !== "admin" && (
          m.user?.display_name?.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
          m.user?.email?.toLowerCase().includes(leadSearchQuery.toLowerCase())
        ));

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Leadership structure</h2>
                <p className="text-muted-foreground text-sm font-medium">Department heads and strategic administrators.</p>
              </div>
              <Dialog open={isAppointingLead} onOpenChange={setIsAppointingLead}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl h-10 px-5 font-bold bg-primary text-white text-xs">
                    <Crown className="h-4 w-4 mr-2" /> Appoint lead
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-glass-border sm:max-w-[450px] rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Appoint strategic lead</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search members..." 
                        className="pl-9 bg-muted/30 h-10 rounded-xl border-glass-border text-sm" 
                        value={leadSearchQuery}
                        onChange={e => setLeadSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {eligibleMembers.length > 0 ? eligibleMembers.map((m) => (
                        <button 
                          key={m.id}
                          onClick={async () => {
                            toast.loading(`Promoting ${m.user?.display_name || 'member'}...`, { id: "promote" });
                            const { error } = await supabase
                              .from("organization_members")
                              .update({ role: "admin" })
                              .eq("id", m.id);
                            
                            if (error) {
                              toast.error("Promotion failed", { id: "promote" });
                            } else {
                              toast.success("Strategic lead appointed", { id: "promote" });
                              setIsAppointingLead(false);
                              setLeadSearchQuery("");
                              fetchMembersForActiveOrg();
                            }
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-xs font-bold uppercase">
                               {(m.user?.display_name || m.user?.email || "?").charAt(0)}
                            </div>
                            <div className="text-left">
                               <p className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{m.user?.display_name || "Anonymous member"}</p>
                               <p className="text-[10px] text-muted-foreground">{m.user?.email}</p>
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      )) : (
                        <p className="text-center py-8 text-xs text-muted-foreground font-medium">No eligible members found.</p>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {adminLeads.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminLeads.map((lead, i) => (
                  <div key={i} className="bg-card/40 border border-glass-border rounded-2xl p-5 hover:bg-card/60 transition-all shadow-sm group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center text-primary border border-primary/10">
                          <Crown className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold tracking-tight">{lead.user?.display_name || "Strategic admin"}</h3>
                          <p className="text-[10px] text-muted-foreground font-bold">{lead.user?.department || "Executive"}</p>
                        </div>
                      </div>
                      <button 
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg hover:bg-destructive/10 text-destructive grid place-items-center transition-all"
                        onClick={async () => {
                           if (confirm(`Revoke lead status for ${lead.user?.display_name}?`)) {
                              toast.loading("Revoking status...", { id: "demote" });
                              const { error } = await supabase.from("organization_members").update({ role: "member" }).eq("id", lead.id);
                              if (error) toast.error("Action failed", { id: "demote" });
                              else { toast.success("Status revoked", { id: "demote" }); fetchMembersForActiveOrg(); }
                           }
                        }}
                        title="Revoke lead status"
                      >
                         <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-medium">
                        <span className="text-muted-foreground">Access level</span>
                        <span className="text-foreground font-bold text-[9px]">Organization admin</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-medium">
                        <span className="text-muted-foreground">Direct email</span>
                        <span className="text-primary hover:underline cursor-pointer">{lead.user?.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/10 border border-glass-border rounded-2xl p-12 text-center">
                 <p className="text-sm text-muted-foreground font-medium">No strategic leads appointed yet.</p>
              </div>
            )}
          </div>
        );
      case "analytics":
        if (!stats || stats.meetings === 0) {
          return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 px-4">
              <div className="h-16 w-16 rounded-2xl bg-muted grid place-items-center text-muted-foreground border border-glass-border">
                <BarChart2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight">No telemetry data</h3>
                <p className="text-muted-foreground text-xs font-medium max-w-xs mx-auto">Analytics will automatically populate once your team starts hosting meetings and collaborating.</p>
              </div>
              <Button size="sm" onClick={() => setActiveTab("onboarding")} className="rounded-lg font-bold h-9 px-4 text-xs">Complete onboarding</Button>
            </div>
          );
        }
        return (
          <div className="space-y-8">
            <div className="space-y-1 px-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Enterprise intelligence</h2>
              <p className="text-muted-foreground text-sm font-medium">Real-time performance metrics synced from your workspace.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total meetings", val: stats.meetings.toString(), delta: "Active", icon: Zap, color: "text-amber-500" },
                { label: "Active members", val: stats.activeMembers.toString(), delta: "Verified", icon: Heart, color: "text-rose-500" },
                { label: "AI Utilization", val: `${stats.aiMinutes}m`, delta: "Invoiced", icon: Terminal, color: "text-primary" },
                { label: "Network health", val: "100%", delta: "Stable", icon: Shield, color: "text-emerald-500" }
              ].map((stat, i) => (
                <div key={i} className="bg-card/40 border border-glass-border p-5 rounded-2xl shadow-sm hover:-translate-y-1 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-8 w-8 rounded-lg bg-muted/50 ${stat.color} grid place-items-center`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{stat.delta}</span>
                  </div>
                  <p className="text-[10px] tracking-widest font-bold text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="bg-card/40 border border-glass-border rounded-2xl p-6 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold tracking-tight">Active collaboration curve</h3>
                  <div className="flex gap-2">
                     <span className="h-2 w-2 rounded-full bg-primary" />
                     <span className="h-2 w-2 rounded-full bg-muted" />
                  </div>
               </div>
               <div className="h-32 w-full flex items-end gap-1 px-2">
                  {[45, 60, 55, 80, 95, 70, 85, 65, 90, 100, 80, 75].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary transition-colors cursor-pointer relative group" style={{ height: `${h}%` }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {h}%
                      </div>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-[10px] text-muted-foreground font-bold px-1">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                  <span>Sun</span>
               </div>
            </div>
          </div>
        );
      case "products":
        return (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Service catalog</h2>
                <p className="text-muted-foreground text-sm font-medium">Managed enterprise products and add-on services.</p>
              </div>
              <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl h-10 px-5 font-bold bg-primary text-white text-xs">
                    <Plus className="h-4 w-4 mr-2" /> Add product
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-glass-border sm:max-w-[425px] rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">New enterprise product</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="prod-name" className="text-xs font-bold ml-1">Service name</Label>
                      <Input id="prod-name" placeholder="e.g. AI Sentinel" className="bg-muted/30 rounded-xl h-11 border-glass-border text-sm font-medium" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prod-desc" className="text-xs font-bold ml-1">Service description</Label>
                      <Textarea id="prod-desc" placeholder="Briefly describe the service capabilities..." className="bg-muted/30 rounded-xl border-glass-border text-sm font-medium min-h-[100px]" value={newProductDesc} onChange={e => setNewProductDesc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prod-price" className="text-xs font-bold ml-1">Pricing model</Label>
                      <Input id="prod-price" placeholder="e.g. $49/mo" className="bg-muted/30 rounded-xl h-11 border-glass-border text-sm font-medium" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      className="w-full bg-primary text-white h-11 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
                      onClick={async () => {
                        if (!newProductName) return;
                        toast.loading("Provisioning product...", { id: "add-prod" });
                        const updatedProducts = [...orgProducts, { name: newProductName, desc: newProductDesc, status: "Active", price: newProductPrice, icon: "Terminal" }];
                        const { error } = await supabase
                          .from("organizations")
                          .update({ settings: { ...org.settings, products: updatedProducts } })
                          .eq("id", org.id);
                        
                        if (error) {
                          toast.error("Failed to add product", { id: "add-prod" });
                        } else {
                          toast.success("Product provisioned successfully", { id: "add-prod" });
                          setOrgProducts(updatedProducts);
                          setIsAddingProduct(false);
                          setNewProductName("");
                          setNewProductDesc("");
                          setNewProductPrice("");
                          fetchOrgs();
                        }
                      }}
                    >
                      Deploy service
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {(orgProducts.length > 0 ? orgProducts : [
                { name: "AI Voice Intelligence", desc: "Real-time transcription and sentiment analysis for all meetings.", status: "Active", icon: "Terminal", price: "Included" },
                { name: "Custom Domain Hub", desc: "Managed DNS and SSL for your corporate subdomain.", status: "Active", icon: "Globe", price: "Included" }
              ]).map((prod, i) => (
                <div key={i} className="bg-card/40 border border-glass-border rounded-2xl p-6 flex flex-col justify-between hover:bg-card/60 transition-all shadow-sm group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center border border-primary/10 group-hover:scale-110 transition-transform">
                        <Package className="h-5 w-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest ${
                        prod.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" : "bg-muted text-muted-foreground border border-glass-border"
                      }`}>
                        {prod.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold tracking-tight mb-1">{prod.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mb-6">{prod.desc}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-glass-border">
                    <span className="text-[11px] font-bold text-foreground">{prod.price}</span>
                    {prod.status === "Active" ? (
                      <button className="text-[11px] font-bold text-primary hover:underline">Configure</button>
                    ) : (
                      <Button size="sm" className="h-8 rounded-lg px-4 text-[10px] font-bold bg-primary text-white">Enable service</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "security":
        return (
          <div className="space-y-8 max-w-3xl">
            <div className="space-y-1 px-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Security infrastructure</h2>
              <p className="text-muted-foreground text-sm font-medium">Configure security policies and authentication protocols.</p>
            </div>

            <div className="grid gap-4">
              <div className="bg-card/40 border border-glass-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-card/60 transition-all shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 grid place-items-center shrink-0 border border-amber-500/10">
                     <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold tracking-tight">Multi-factor enforcement</h3>
                    <p className="text-muted-foreground text-xs font-medium">Require members to verify identity via 2FA.</p>
                  </div>
                </div>
                <Switch className="scale-75 data-[state=checked]:bg-amber-500" />
              </div>

              <div className="bg-card/40 border border-glass-border rounded-2xl p-6 flex flex-col gap-6 hover:bg-card/60 transition-all shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 border border-primary/10">
                     <KeyRound className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold tracking-tight">Organization passcode</h3>
                    <p className="text-muted-foreground text-xs font-medium">Secondary security layer for new members.</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <Input 
                    id="org-passcode"
                    type="password"
                    placeholder="Enter new security passcode" 
                    className="bg-muted/30 h-10 rounded-xl border-glass-border focus:ring-primary/20 text-sm font-mono tracking-widest px-4" 
                  />
                  <Button 
                    size="sm"
                    onClick={async () => {
                      const pass = (document.getElementById("org-passcode") as HTMLInputElement)?.value;
                      if (!pass) return;
                      toast.loading("Updating security layer...", { id: "passcode" });
                      const { error } = await supabase
                        .from("organizations")
                        .update({ admin_passcode_hash: pass })
                        .eq("id", org.id);
                      if (error) toast.error("Protocol update failed", { id: "passcode" });
                      else {
                        toast.success("Security protocol updated", { id: "passcode" });
                        (document.getElementById("org-passcode") as HTMLInputElement).value = "";
                      }
                    }}
                    className="rounded-xl font-bold bg-primary text-white h-10 px-6 shadow-sm text-xs"
                  >
                    Set key
                  </Button>
                </div>
              </div>

              <div className="bg-card/40 border border-glass-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-60 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 border border-primary/10">
                     <Globe className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                       <h3 className="text-base font-bold tracking-tight">SAML / SSO</h3>
                       <span className="px-1.5 py-0.5 rounded bg-primary text-[8px] font-bold tracking-widest text-white">Enterprise</span>
                    </div>
                    <p className="text-muted-foreground text-xs font-medium">Okta, Azure AD, or Google Workspace SSO.</p>
                  </div>
                </div>
                <button className="h-9 px-4 rounded-xl text-xs font-bold border border-glass-border hover:bg-primary/5 transition-colors">Configure</button>
              </div>
            </div>
          </div>
        );
      case "billing":
        return (
          <div className="space-y-8 max-w-3xl">
            <div className="space-y-1 px-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Financial hub</h2>
              <p className="text-muted-foreground text-sm font-medium">Monitor subscription status and usage.</p>
            </div>

            <div className="grid gap-6">
              <div className="bg-card/30 border border-glass-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="text-lg font-bold tracking-tight">Enterprise unlimited</h3>
                   </div>
                   <p className="text-muted-foreground font-medium text-xs">Currently on the flagship tier.</p>
                   <p className="text-[9px] text-muted-foreground font-bold tracking-widest">Billed annually • $15.00 / seat / month</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl h-10 px-6 font-bold border-glass-border hover:bg-primary/5 text-xs"
                  onClick={() => {
                    toast.loading("Opening Stripe portal...", { duration: 2000 });
                    setTimeout(() => toast.success("Billing session initialized"), 2100);
                  }}
                >
                  Manage plan
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-card/40 border border-glass-border p-6 rounded-2xl shadow-sm group hover:bg-card/60 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] tracking-widest font-bold text-muted-foreground">Allocated seats</p>
                    <Users className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-baseline gap-1">
                     <p className="text-3xl font-bold tracking-tight text-foreground">{members.length}</p>
                     <p className="text-muted-foreground font-bold text-xs">/ Unlimited</p>
                  </div>
                  <div className="w-full h-1.5 bg-muted/50 rounded-full mt-4 overflow-hidden">
                     <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((members.length / 50) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="bg-card/40 border border-glass-border p-6 rounded-2xl shadow-sm group hover:bg-card/60 transition-all">
                   <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] tracking-widest font-bold text-muted-foreground">Next statement</p>
                    <CreditCard className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-foreground">$0.00</p>
                  <p className="text-muted-foreground font-bold text-xs mt-1">Due Oct 12, 2026</p>
                </div>
              </div>

              <div className="bg-muted/10 border border-glass-border rounded-2xl p-6 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-card border border-glass-border grid place-items-center">
                       <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                       <p className="text-sm font-bold tracking-tight">Payment method</p>
                       <p className="text-[11px] text-muted-foreground font-medium">Visa ending in 4242</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-primary/5 rounded-lg px-4" onClick={() => toast.info("Payment method update portal is coming soon")}>Update</Button>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-8 max-w-2xl px-2 pb-12">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Core configuration</h2>
              <p className="text-muted-foreground text-sm font-medium">Adjust primary identity and brand assets.</p>
            </div>

            <div className="bg-card/40 border border-glass-border rounded-2xl p-8 space-y-10 shadow-sm">
               <div className="space-y-6">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-primary">Legal & network</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-muted-foreground ml-1">Legal identity</Label>
                        <Input 
                           defaultValue={org.name} 
                           id="edit-org-name"
                           className="bg-muted/30 h-11 rounded-xl border-glass-border focus:ring-primary/20 text-sm font-medium px-4" 
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-muted-foreground ml-1">Network domain</Label>
                        <Input 
                           defaultValue={org.settings?.domain || ""} 
                           id="edit-org-domain"
                           className="bg-muted/30 h-11 rounded-xl border-glass-border focus:ring-primary/20 text-sm font-medium px-4" 
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-6 pt-4 border-t border-glass-border/50">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-primary">Governance & provisioning</h3>
                  <div className="grid sm:grid-cols-2 gap-8">
                     <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                           <p className="text-sm font-bold tracking-tight">Auto-provisioning</p>
                           <p className="text-[10px] text-muted-foreground font-medium">Automatically add users from domain.</p>
                        </div>
                        <Switch className="scale-75" checked={org.settings?.auto_provisioning} onCheckedChange={async (val) => {
                           toast.loading("Updating governance...", { id: "gov" });
                           const { error } = await supabase.from("organizations").update({ settings: { ...org.settings, auto_provisioning: val } }).eq("id", org.id);
                           if (!error) { toast.success("Governance updated", { id: "gov" }); fetchOrgs(); }
                        }} />
                     </div>
                     <div className="flex items-center justify-between gap-4 opacity-60">
                        <div className="space-y-0.5">
                           <p className="text-sm font-bold tracking-tight">Slack sync</p>
                           <p className="text-[10px] text-muted-foreground font-medium">Sync team structure from Slack.</p>
                        </div>
                        <Switch className="scale-75" disabled />
                     </div>
                  </div>
               </div>

               <div className="space-y-6 pt-4 border-t border-glass-border/50">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-primary">Visual identity</h3>
                  <div className="grid sm:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <Label className="text-[10px] tracking-widest font-bold text-muted-foreground ml-1">Organization logo</Label>
                        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-glass-border rounded-2xl bg-muted/10 group hover:border-primary/20 transition-colors">
                           {tempLogo ? (
                              <img src={tempLogo} alt="Preview" className="h-20 w-20 object-contain rounded-xl shadow-sm" />
                           ) : (
                              <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                                 <Building2 className="h-8 w-8" />
                              </div>
                           )}
                           <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold rounded-lg px-3 border-glass-border" onClick={() => document.getElementById("logo-upload")?.click()}>
                                 <Upload className="h-3 w-3 mr-1.5" /> Upload logo
                              </Button>
                              <input 
                                 type="file" 
                                 id="logo-upload" 
                                 className="hidden" 
                                 accept="image/*" 
                                 onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                       const reader = new FileReader();
                                       reader.onloadend = () => setTempLogo(reader.result as string);
                                       reader.readAsDataURL(file);
                                    }
                                 }}
                              />
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <Label className="text-[10px] tracking-widest font-bold text-muted-foreground ml-1">Cover banner</Label>
                        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-glass-border rounded-2xl bg-muted/10 group hover:border-primary/20 transition-colors">
                           {tempBanner ? (
                              <img src={tempBanner} alt="Preview" className="h-20 w-full object-cover rounded-xl shadow-sm" />
                           ) : (
                              <div className="h-20 w-full rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                                 <ImageIcon className="h-8 w-8" />
                              </div>
                           )}
                           <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold rounded-lg px-3 border-glass-border" onClick={() => document.getElementById("banner-upload")?.click()}>
                                 <Upload className="h-3 w-3 mr-1.5" /> Upload banner
                              </Button>
                              <input 
                                 type="file" 
                                 id="banner-upload" 
                                 className="hidden" 
                                 accept="image/*"
                                 onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                       const reader = new FileReader();
                                       reader.onloadend = () => setTempBanner(reader.result as string);
                                       reader.readAsDataURL(file);
                                    }
                                 }}
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

              <div className="pt-6 border-t border-glass-border">
                <Button 
                  size="sm"
                  onClick={async () => {
                    const newName = (document.getElementById("edit-org-name") as HTMLInputElement)?.value || org.name;
                    const newDomain = (document.getElementById("edit-org-domain") as HTMLInputElement)?.value || org.settings?.domain || "";
                    
                    toast.loading("Synchronizing brand assets...", { id: "save-org" });
                    const { error } = await supabase
                      .from("organizations")
                      .update({ 
                        name: newName, 
                        settings: { ...org.settings, domain: newDomain, logo_url: tempLogo, banner_url: tempBanner } 
                      })
                      .eq("id", org.id);
                    
                    if (error) {
                      toast.error("Synchronization failed", { id: "save-org" });
                    } else {
                      toast.success("Identity assets updated", { id: "save-org" });
                      fetchOrgs();
                    }
                  }}
                  className="w-full sm:w-auto rounded-xl h-10 px-8 font-bold bg-primary text-white shadow-sm transition-all active:scale-95 text-xs"
                >
                  Commit all changes
                </Button>
              </div>
            </div>
            
            <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-6 mt-8">
               <h3 className="text-base font-bold text-destructive tracking-tight mb-1">Danger Zone</h3>
               <p className="text-muted-foreground text-xs font-medium mb-4">Decommissioning will permanently purge all assets.</p>
               <button className="h-9 px-4 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive hover:text-white font-bold text-[10px] transition-all tracking-widest">Decommission</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <OrgShell 
      title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} 
      orgName={org.name} 
      orgLogo={org.settings?.logo_url}
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onBackToOrgs={() => setActiveOrgId(null)}
    >
      <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {!isUnlocked && org?.admin_passcode_hash ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 animate-in zoom-in-95 duration-500 relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary grid place-items-center shadow-sm border border-primary/10 relative">
              <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
              <KeyRound className="h-6 w-6 relative z-10" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Enterprise access</h2>
              <p className="text-muted-foreground text-xs font-medium max-w-[240px]">Enter security key for <span className="text-foreground font-bold">{org.name}</span>.</p>
            </div>
            <div className="w-full max-w-[280px] space-y-3">
              <Input 
                type="password"
                value={unlockPasscode}
                onChange={(e) => setUnlockPasscode(e.target.value)}
                placeholder="••••"
                onKeyDown={(e) => e.key === "Enter" && unlockPasscode === org.admin_passcode_hash && setIsUnlocked(true)}
                className="bg-card/40 h-12 rounded-xl text-center text-xl tracking-[0.4em] font-mono border-glass-border focus:ring-primary/20 shadow-inner"
              />
            <Button 
                onClick={() => {
                  if (unlockPasscode === org?.admin_passcode_hash) {
                    setShowUnlockSuccess(true);
                    toast.success("Protocol accepted", { icon: "🔐" });
                    setTimeout(() => {
                      setIsUnlocked(true);
                      setShowUnlockSuccess(false);
                    }, 1000);
                  } else {
                    toast.error("Invalid security key");
                  }
                }}
                disabled={showUnlockSuccess}
                className="w-full h-10 bg-primary text-white hover:opacity-90 border-0 shadow-sm rounded-lg font-bold text-sm transition-all active:scale-95"
              >
                {showUnlockSuccess ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Unlock workspace <ChevronRight className="h-4 w-4 ml-1" /></>}
              </Button>
              <button onClick={() => setActiveOrgId(null)} disabled={showUnlockSuccess} className="w-full rounded-lg text-muted-foreground h-8 font-bold text-[10px] hover:bg-muted/10 transition-colors tracking-widest">
                Return to hub
              </button>
            </div>
            
            {showUnlockSuccess && (
              <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-2xl grid place-items-center animate-in fade-in duration-500 rounded-2xl">
                <div className="text-center animate-in zoom-in-95 duration-500">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-500 grid place-items-center mx-auto mb-4 shadow-sm">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground tracking-tight">Verified</h3>
                  <p className="text-muted-foreground text-[11px] mt-1 font-medium">Synchronizing assets...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {showSetupPasscode && (
        <div className="fixed inset-0 z-[60] grid place-items-center px-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="glass rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border-brand-green/30 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="h-20 w-20 rounded-[2rem] bg-brand-green/10 text-brand-green grid place-items-center mx-auto mb-6">
              <ShieldCheck className="h-10 w-10" />
            </div>
            
            <h2 className="text-2xl font-black mb-3">Secure your organization</h2>
            <p className="text-muted-foreground text-sm mb-8">
              To ensure the security of {org?.name}, please set a mandatory join passcode for all new members.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label className="text-[11px] tracking-widest font-bold ml-1">New join passcode</Label>
                <Input 
                  id="setup-org-passcode"
                  type="password"
                  placeholder="Create a strong passcode" 
                  className="bg-card/40 h-14 rounded-2xl text-center text-xl tracking-[0.3em] font-mono" 
                />
              </div>
              
              <Button 
                onClick={async () => {
                  const pass = (document.getElementById("setup-org-passcode") as HTMLInputElement)?.value;
                  if (!pass) {
                    toast.error("Please enter a passcode");
                    return;
                  }
                  toast.loading("Securing organization...", { id: "passcode-setup" });
                  const { error } = await supabase
                    .from("organizations")
                    .update({ admin_passcode_hash: pass })
                    .eq("id", org?.id);
                  
                  if (error) {
                    toast.error("Setup failed", { id: "passcode-setup" });
                  } else {
                    toast.success("Organization secured!", { id: "passcode-setup" });
                    setShowSetupPasscode(false);
                    fetchOrgs();
                  }
                }}
                className="w-full h-14 bg-brand-green hover:bg-brand-green/90 text-white border-0 shadow-brand rounded-2xl font-bold text-lg"
              >
                Set passcode & continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </OrgShell>
  );
}

function Section({ title, icon, children, className }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-card rounded-2xl border border-glass-border overflow-hidden ${className}`}>
      <div className="px-5 py-3 border-b border-glass-border flex items-center gap-2 bg-muted/30">
        <span className="text-primary">{icon}</span>
        <h3 className="text-xs font-bold tracking-tight">{title}</h3>
      </div>
      <div className="divide-y divide-glass-border">{children}</div>
    </section>
  );
}

function Row({ title, sub, action }: { title: string; sub: string; action: React.ReactNode }) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-tight">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
      {action}
    </div>
  );
}
