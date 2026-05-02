import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, Star, Building2, Crown, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/upgrade")({
  head: () => ({ meta: [{ title: "Upgrade — Velora Meet" }] }),
  component: () => (
    <RequireAuth>
      <UpgradePage />
    </RequireAuth>
  ),
});

function UpgradePage() {
  const handleUpgrade = (plan: string) => {
    toast.success(`Redirecting to ${plan} checkout...`, {
      description: "You're one step away from Velora Pro.",
      style: {
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        border: "1px solid rgba(34, 197, 94, 0.2)",
        color: "#22c55e"
      }
    });
  };

  return (
    <DashboardShell title="Upgrade your account">
      <div className="px-4 sm:px-6 py-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green font-bold text-xs uppercase tracking-widest mb-4 border border-brand-green/20">
            <Sparkles className="h-3 w-3" /> Velora Pro Beta
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Choose your <span className="text-gradient">Power</span></h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Scale your meetings from small huddles to global town halls with Enterprise-grade security.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="dash-card p-8 flex flex-col border-transparent opacity-80">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">$0</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 font-medium">Perfect for quick peer-to-peer syncs.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <Feature item="Up to 100 participants" />
              <Feature item="Unlimited meetings" />
              <Feature item="Standard encryption" />
              <Feature item="Mobile access" />
            </ul>
            <Button variant="outline" disabled className="w-full h-12 rounded-xl">Current Plan</Button>
          </div>

          {/* Pro Plan */}
          <div className="dash-card p-8 flex flex-col border-brand-green/30 relative scale-105 shadow-2xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-green text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-glow">
              Recommended
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                Pro <Star className="h-4 w-4 fill-brand-green text-brand-green" />
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-brand-green">$12</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 font-medium">For professional hosts and creators.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <Feature item="Up to 500 participants" active />
              <Feature item="High-bitrate recordings" active />
              <Feature item="Live captions & transcripts" active />
              <Feature item="Custom meeting previews" active />
              <Feature item="No time limits" active />
            </ul>
            <Button 
              onClick={() => handleUpgrade("Pro")}
              className="w-full h-12 bg-brand-green hover:bg-brand-green/90 text-white border-0 shadow-brand rounded-xl font-bold"
            >
              Go Pro <Zap className="h-4 w-4 ml-2 fill-current" />
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="dash-card p-8 flex flex-col border-transparent">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                Business <Building2 className="h-4 w-4 text-primary" />
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">$25</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 font-medium">For growing teams and corporations.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <Feature item="Up to 1,000 participants" />
              <Feature item="Centralized Org management" />
              <Feature item="SAML/SSO Single Sign-On" />
              <Feature item="Custom branding & domains" />
              <Feature item="Audit-ready logs" />
            </ul>
            <Button 
              onClick={() => handleUpgrade("Business")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white border-0 shadow-glow rounded-xl font-bold"
            >
              Talk to Sales <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        <div className="mt-20 glass rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-brand-green/5 to-transparent border-brand-green/20">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">Need a custom solution?</h2>
              <p className="text-muted-foreground text-sm max-w-xl">
                We offer tailor-made plans for large universities, healthcare networks, and non-profits. 
                Get in touch for volume discounting and dedicated support.
              </p>
            </div>
            <Button variant="outline" className="h-12 px-8 rounded-xl border-brand-green/30 hover:bg-brand-green/5 hover:text-brand-green font-bold">
              Contact Enterprise Sales
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function Feature({ item, active = false }: { item: string; active?: boolean }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <CheckCircle2 className={`h-5 w-5 shrink-0 ${active ? "text-brand-green" : "text-muted-foreground/40"}`} />
      <span className={active ? "font-medium" : "text-muted-foreground"}>{item}</span>
    </li>
  );
}
