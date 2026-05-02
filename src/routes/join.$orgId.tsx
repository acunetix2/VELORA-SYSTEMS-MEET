import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Lock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/join/$orgId")({
  head: () => ({ meta: [{ title: "Join Organization — Velora" }] }),
  component: () => (
    <RequireAuth>
      <JoinOrgPage />
    </RequireAuth>
  ),
});

function JoinOrgPage() {
  const { orgId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchOrg = async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();
      
      if (error || !data) {
        toast.error("Organization not found");
        navigate({ to: "/dashboard" });
        return;
      }
      setOrg(data);
      setLoading(false);
    };
    fetchOrg();
  }, [orgId]);

  const handleJoin = async () => {
    if (org.admin_passcode_hash && passcode !== org.admin_passcode_hash) {
      toast.error("Invalid organization passcode");
      return;
    }

    setVerifying(true);
    const { error } = await supabase
      .from("organization_members")
      .insert({
        org_id: orgId,
        user_id: user?.id,
        role: "member"
      });

    if (error) {
      if (error.code === "23505") {
        toast.info("You are already a member of this organization.");
        navigate({ to: "/dashboard/enterprise" });
      } else {
        toast.error("Failed to join organization");
      }
      setVerifying(false);
      return;
    }

    toast.success(`Welcome to ${org.name}!`, {
      description: "You have successfully joined the organization."
    });
    navigate({ to: "/dashboard/enterprise" });
  };

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-[2rem] bg-gradient-brand grid place-items-center mx-auto mb-6 shadow-glow ring-8 ring-primary/5">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Join {org.name}</h1>
          <p className="text-muted-foreground">You've been invited to join this organization on Velora Meet.</p>
        </div>

        <div className="glass rounded-[2.5rem] p-8 border-primary/20 shadow-elegant relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="space-y-6 relative z-10">
            {org.admin_passcode_hash && (
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-widest font-bold ml-1 flex items-center gap-2">
                  <Lock className="h-3 w-3 text-primary" /> Enter Organization Passcode
                </Label>
                <Input 
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••"
                  className="bg-card/40 h-14 rounded-2xl text-center text-xl tracking-[0.3em] font-mono border-glass-border focus:ring-primary/20"
                />
                <p className="text-[10px] text-muted-foreground text-center italic">
                  This organization requires a secure passcode to join.
                </p>
              </div>
            )}

            {!org.admin_passcode_hash && (
              <div className="p-4 rounded-2xl bg-brand-green/5 border border-brand-green/20 flex items-center gap-3 text-brand-green">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <p className="text-xs font-medium">This is a verified organization invite.</p>
              </div>
            )}

            <Button 
              onClick={handleJoin}
              disabled={verifying || (org.admin_passcode_hash && !passcode)}
              className="w-full h-14 bg-gradient-primary text-primary-foreground hover:opacity-90 border-0 shadow-glow rounded-2xl font-bold text-lg"
            >
              {verifying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <><Building2 className="h-5 w-5 mr-2" /> Join Organization</>}
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => navigate({ to: "/dashboard" })}
              className="w-full rounded-xl text-muted-foreground hover:text-foreground"
            >
              Cancel and return to dashboard
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          Velora Enterprise Security™
        </p>
      </div>
    </div>
  );
}
