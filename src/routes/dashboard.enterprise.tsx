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
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    setIsUnlocked(false);
    setUnlockPasscode("");
  }, [activeOrgId]);

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
      toast.error("Failed to create organization");
      setLoading(false);
      return;
    }

    // Add user as admin
    const { error: memberErr } = await supabase
      .from("organization_members")
      .insert({ org_id: orgData.id, user_id: user.id, role: "admin" });

    if (memberErr) {
      console.error(memberErr);
      toast.error("Failed to add user to organization");
      setLoading(false);
      return;
    }

    toast.success("Organization created successfully!");
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

  if (!activeOrgId) {
    return (
      <DashboardShell title="Enterprise Management">
        <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
          {orgs.length === 0 ? (
            <div className="dash-card p-12 text-center flex flex-col items-center">
              <div className="h-20 w-20 rounded-3xl bg-primary/10 grid place-items-center mb-6">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Build your Organization</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Unlock centralized billing, domain security, and team-wide analytics by creating an organization.
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-primary border-0 shadow-glow rounded-2xl h-14 px-10 font-bold text-lg"
                onClick={() => setIsCreatingOrg(true)}
              >
                <Plus className="h-5 w-5 mr-2" /> Create Organization
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Your Organizations</h2>
                  <p className="text-muted-foreground">Select an organization to manage or create a new one.</p>
                </div>
                <Button onClick={() => setIsCreatingOrg(true)} className="rounded-xl shadow-glow">
                  <Plus className="h-4 w-4 mr-2" /> New Organization
                </Button>
              </div>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {orgs.map((o) => (
                  <div key={o.id} className="dash-card p-6 flex flex-col items-start hover:-translate-y-1 transition-transform cursor-pointer border-transparent hover:border-primary/30 group" onClick={() => setActiveTab("overview") || setActiveOrgId(o.id)}>
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-black mb-1">{o.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{o.settings?.domain || "No domain specified"}</p>
                    <div className="mt-auto pt-4 border-t border-glass-border w-full flex justify-between items-center text-sm font-bold text-primary">
                      Manage <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isCreatingOrg && (
          <div className="fixed inset-0 z-50 grid place-items-center px-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass rounded-3xl p-8 max-w-md w-full shadow-elegant border-primary/20">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" /> Create Organization
              </h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pb-2">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">Organization Name</Label>
                  <Input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="e.g. Acme Corp" className="bg-card/40 h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">Domain (Optional)</Label>
                  <Input value={newOrgDomain} onChange={(e) => setNewOrgDomain(e.target.value)} placeholder="acme.com" className="bg-card/40 h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">Billing Email (Optional)</Label>
                  <Input value={newOrgBillingEmail} onChange={(e) => setNewOrgBillingEmail(e.target.value)} placeholder="finance@acme.com" type="email" className="bg-card/40 h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">Industry (Optional)</Label>
                  <Input value={newOrgIndustry} onChange={(e) => setNewOrgIndustry(e.target.value)} placeholder="e.g. Education, Tech" className="bg-card/40 h-12 rounded-xl" />
                </div>
                
                <p className="text-[10px] text-muted-foreground italic px-1 pt-2">
                  You will be set as the initial Organization Administrator.
                </p>
                <div className="flex gap-3 mt-4 pt-2 border-t border-glass-border">
                  <Button variant="ghost" onClick={() => setIsCreatingOrg(false)} className="flex-1 rounded-xl h-12">Cancel</Button>
                  <Button onClick={createOrg} disabled={!newOrgName} className="flex-1 bg-primary text-white rounded-xl h-12 shadow-glow">Create</Button>
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
          <div className="space-y-6">
            <div className="relative rounded-[2rem] bg-gradient-brand p-8 text-primary-foreground overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 text-white grid place-items-center">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] uppercase tracking-widest font-bold">Enterprise Hub</span>
                </div>
                <h2 className="text-3xl font-black mb-2">{org.name}</h2>
                <p className="text-primary-foreground/80 max-w-xl">
                  Manage your team, settings, and billing across Velora.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                    <Globe className="h-4 w-4" /> {org.settings?.domain || "No domain set"}
                  </div>
                  <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                    <Users className="h-4 w-4" /> {members.length} Member{members.length !== 1 && "s"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="dash-card p-6 flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => setActiveTab("members")}>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-bold mb-1">Team Members</h3>
                <p className="text-sm text-muted-foreground">Manage roles and invitations.</p>
              </div>
              <div className="dash-card p-6 flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => setActiveTab("security")}>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-bold mb-1">Security & SSO</h3>
                <p className="text-sm text-muted-foreground">Configure SAML & access.</p>
              </div>
              <div className="dash-card p-6 flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => setActiveTab("billing")}>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="font-bold mb-1">Billing</h3>
                <p className="text-sm text-muted-foreground">Manage subscription and invoices.</p>
              </div>
            </div>
          </div>
        );
      case "members":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Team Members</h2>
                <p className="text-muted-foreground text-sm">Manage who has access to {org.name}.</p>
              </div>
              <Button 
                className="rounded-xl font-bold" 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/join/${org.id}`);
                  toast.success("Invite link copied to clipboard!");
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Copy Invite Link
              </Button>
            </div>
            <div className="dash-card p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Member</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Role</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} className="border-b border-glass-border last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-sm">{m.user?.display_name || m.user?.email || "Unknown User"}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold ${
                          m.role === "admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>{m.role}</span>
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs font-medium text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (m.user_id === user?.id) {
                              toast.error("You cannot remove yourself.");
                              return;
                            }
                            if (confirm("Are you sure you want to remove this member?")) {
                              const { error } = await supabase.from("organization_members").delete().eq("id", m.id);
                              if (error) toast.error("Failed to remove member.");
                              else { toast.success("Member removed."); fetchMembersForActiveOrg(); }
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "security":
        return (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">Security & SSO</h2>
            <div className="dash-card p-6 border-warning/20">
              <h3 className="font-bold flex items-center gap-2 mb-2"><ShieldCheck className="h-5 w-5 text-warning" /> Enforce 2FA</h3>
              <p className="text-sm text-muted-foreground mb-4">Require all members to enable Two-Factor Authentication.</p>
              <Switch />
            </div>
            <div className="dash-card p-6">
              <h3 className="font-bold flex items-center gap-2 mb-2"><KeyRound className="h-5 w-5 text-primary" /> Join Passcode</h3>
              <p className="text-sm text-muted-foreground mb-4">Set a mandatory passcode for new members joining {org.name}.</p>
              <div className="flex gap-2 max-w-sm">
                <Input 
                  id="org-passcode"
                  type="password"
                  placeholder="New passcode" 
                  className="bg-card/40 h-11 rounded-xl" 
                />
                <Button 
                  onClick={async () => {
                    const pass = (document.getElementById("org-passcode") as HTMLInputElement)?.value;
                    if (!pass) return;
                    toast.loading("Updating passcode...", { id: "passcode" });
                    const { error } = await supabase
                      .from("organizations")
                      .update({ admin_passcode_hash: pass }) // Using admin_passcode_hash as the general org passcode for now
                      .eq("id", org.id);
                    if (error) toast.error("Failed to update", { id: "passcode" });
                    else {
                      toast.success("Passcode updated", { id: "passcode" });
                      (document.getElementById("org-passcode") as HTMLInputElement).value = "";
                    }
                  }}
                  className="rounded-xl font-bold bg-primary text-white h-11"
                >
                  Update
                </Button>
              </div>
            </div>

            <div className="dash-card p-6">
              <h3 className="font-bold flex items-center gap-2 mb-2"><KeyRound className="h-5 w-5 text-primary" /> SAML Single Sign-On</h3>
              <p className="text-sm text-muted-foreground mb-4">Configure Okta, Azure AD, or Google Workspace SSO.</p>
              <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/10">Configure SSO</Button>
            </div>
          </div>
        );
      case "billing":
        return (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">Billing & Usage</h2>
            <div className="dash-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold mb-1">Enterprise Plan</h3>
                <p className="text-sm text-muted-foreground">Billed annually at $15/user/month.</p>
              </div>
              <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/10">Manage Subscription</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="dash-card p-6">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">Active Seats</p>
                <p className="text-3xl font-black">{members.length}</p>
              </div>
              <div className="dash-card p-6">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">Next Invoice</p>
                <p className="text-3xl font-black">--</p>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">Organization Settings</h2>
            <div className="dash-card p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">Organization Name</Label>
                <Input 
                  defaultValue={org.name} 
                  onChange={(e) => {
                    const el = e.target as HTMLInputElement;
                    el.dataset.val = el.value;
                  }}
                  id="edit-org-name"
                  className="bg-card/40 h-12 rounded-xl max-w-md" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">Verified Domain</Label>
                <Input 
                  defaultValue={org.settings?.domain || ""} 
                  onChange={(e) => {
                    const el = e.target as HTMLInputElement;
                    el.dataset.val = el.value;
                  }}
                  id="edit-org-domain"
                  className="bg-card/40 h-12 rounded-xl max-w-md" 
                />
              </div>
              <Button 
                onClick={async () => {
                  const newName = (document.getElementById("edit-org-name") as HTMLInputElement)?.dataset.val || org.name;
                  const newDomain = (document.getElementById("edit-org-domain") as HTMLInputElement)?.dataset.val || org.settings?.domain || "";
                  
                  toast.loading("Saving changes...", { id: "save-org" });
                  const { error } = await supabase
                    .from("organizations")
                    .update({ 
                      name: newName, 
                      settings: { ...org.settings, domain: newDomain } 
                    })
                    .eq("id", org.id);
                  
                  if (error) {
                    toast.error("Failed to update organization", { id: "save-org" });
                  } else {
                    toast.success("Organization updated!", { id: "save-org" });
                    fetchOrgs();
                  }
                }}
                className="rounded-xl font-bold bg-primary text-white"
              >
                Save Changes
              </Button>
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
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onBackToOrgs={() => setActiveOrgId(null)}
    >
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        {!isUnlocked && org?.admin_passcode_hash ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-8 animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 rounded-[2.5rem] bg-primary/10 text-primary grid place-items-center shadow-glow">
              <KeyRound className="h-10 w-10" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black">Unlock {org.name}</h2>
              <p className="text-muted-foreground text-sm">Enter the organization passcode to continue management.</p>
            </div>
            <div className="w-full max-w-xs space-y-4">
              <Input 
                type="password"
                value={unlockPasscode}
                onChange={(e) => setUnlockPasscode(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && unlockPasscode === org.admin_passcode_hash && setIsUnlocked(true)}
                className="bg-card/40 h-14 rounded-2xl text-center text-xl tracking-[0.3em] font-mono border-glass-border focus:ring-primary/20"
              />
            <Button 
                onClick={() => {
                  if (unlockPasscode === org?.admin_passcode_hash) {
                    setShowUnlockSuccess(true);
                    toast.success("Access granted", { icon: "🔐" });
                    setTimeout(() => {
                      setIsUnlocked(true);
                      setShowUnlockSuccess(false);
                    }, 1500);
                  } else {
                    toast.error("Invalid passcode");
                  }
                }}
                disabled={showUnlockSuccess}
                className="w-full h-14 bg-gradient-primary text-primary-foreground hover:opacity-90 border-0 shadow-glow rounded-2xl font-bold text-lg"
              >
                {showUnlockSuccess ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Unlock <ChevronRight className="h-5 w-5 ml-2" /></>}
              </Button>
              <Button variant="ghost" onClick={() => setActiveOrgId(null)} disabled={showUnlockSuccess} className="w-full rounded-xl text-muted-foreground">
                Switch Organization
              </Button>
            </div>
            
            {showUnlockSuccess && (
              <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-md grid place-items-center animate-in fade-in duration-300">
                <div className="text-center animate-in zoom-in-95 duration-500">
                  <div className="h-20 w-20 rounded-full bg-brand-green/20 text-brand-green grid place-items-center mx-auto mb-6">
                    <ShieldCheck className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-black text-brand-green">Access Granted</h3>
                  <p className="text-muted-foreground text-sm mt-2 font-medium">Entering management hub...</p>
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
            
            <h2 className="text-2xl font-black mb-3">Secure your Organization</h2>
            <p className="text-muted-foreground text-sm mb-8">
              To ensure the security of {org?.name}, please set a mandatory join passcode for all new members.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">New Join Passcode</Label>
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
                Set Passcode & Continue
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
    <section className={`bg-card rounded-3xl border border-glass-border overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-glass-border flex items-center gap-2 bg-muted/30">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="divide-y divide-glass-border">{children}</div>
    </section>
  );
}

function Row({ title, sub, action }: { title: string; sub: string; action: React.ReactNode }) {
  return (
    <div className="px-6 py-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      {action}
    </div>
  );
}