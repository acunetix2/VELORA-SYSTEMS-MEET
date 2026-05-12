import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useState, useEffect } from "react";
import { 
  HeartHandshake, Target, Rocket, Globe2, Users, 
  BarChart3, Gift, Headphones, ArrowUpRight,
  Copy, CheckCircle2, TrendingUp, DollarSign,
  Briefcase, MessageSquare, ChevronRight,
  Sparkles, ShieldCheck, Zap, ArrowRight,
  Video, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/partners")({
  head: () => ({ meta: [{ title: "Partner Dashboard — Velora" }] }),
  component: () => (
    <RequireAuth>
      <PartnerDashboard />
    </RequireAuth>
  ),
});

function PartnerDashboard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  const referralLink = partnerData 
    ? `${window.location.origin}/join?ref=${partnerData.referral_code}`
    : "https://velora.app/join?ref=pending";

  useEffect(() => {
    if (!user) return;

    const fetchPartner = async () => {
      try {
        // Try to get existing partner data
        let { data, error } = await supabase
          .from("partners")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code === "PGRST116") {
          // No partner record yet, initialize one
          const { data: newData, error: initError } = await supabase
            .rpc("initialize_partner", { target_user_id: user.id });
          
          if (initError) throw initError;
          data = newData;
        } else if (error) {
          throw error;
        }

        setPartnerData(data);
        if (!data.onboarded) {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("Partner init error:", err);
        // Fallback for UI if DB table doesn't exist yet
        setShowOnboarding(!localStorage.getItem("velora:partner_onboarded"));
      } finally {
        setMfaEnabled(false);
        setLoading(false);
      }
    };

    fetchPartner();
  }, [user]);

  const finishOnboarding = async () => {
    if (user) {
      await supabase
        .from("partners")
        .update({ onboarded: true })
        .eq("user_id", user.id);
    }
    localStorage.setItem("velora:partner_onboarded", "true");
    setShowOnboarding(false);
    setPartnerData((prev: any) => prev ? { ...prev, onboarded: true } : null);
    toast.success("Welcome to the ecosystem! You're ready to grow.");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardShell title="Partner Ecosystem">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-3">
              <Sparkles className="h-3 w-3" />
              <span>Active Solutions Partner</span>
            </div>
            <h2 className="text-3xl font-black">Partner Dashboard</h2>
            <p className="text-muted-foreground mt-1">Track your referrals, earnings, and ecosystem growth.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="rounded-xl border-glass-border font-bold"
              onClick={() => setShowOnboarding(true)}
            >
              Program Guide
            </Button>
            <Button className="rounded-xl bg-gradient-primary text-primary-foreground border-0 shadow-glow font-bold">
              Submit Lead
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Earnings" 
            value={partnerData ? `$${Number(partnerData.total_earnings).toFixed(2)}` : "$0.00"} 
            trend={partnerData?.total_earnings > 0 ? "+15% from last month" : "Join the program to start earning"} 
            icon={<DollarSign className="h-5 w-5" />} 
            color="primary"
          />
          <StatCard 
            title="Active Referrals" 
            value={partnerData?.active_referrals || 0} 
            trend="Share your link to grow" 
            icon={<Users className="h-5 w-5" />} 
            color="green"
          />
          <StatCard 
            title="Conversion Rate" 
            value="0%" 
            trend="N/A" 
            icon={<TrendingUp className="h-5 w-5" />} 
            color="purple"
          />
          <StatCard 
            title="Current Tier" 
            value={partnerData?.tier ? partnerData.tier.charAt(0).toUpperCase() + partnerData.tier.slice(1) : "Partner"} 
            trend="Registered Partner" 
            icon={<Target className="h-5 w-5" />} 
            color="amber"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Referral Section */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Referral Link Card */}
            <section className="dash-card overflow-hidden">
              <div className="dash-card-accent bg-gradient-primary" />
              <div className="p-8">
                <h3 className="text-xl font-bold mb-2">Share Velora with your network</h3>
                <p className="text-sm text-muted-foreground mb-6">Earn 15% recurring commission for every organization that joins through your link.</p>
                
                <div className="flex gap-3">
                  <div className="flex-1 bg-sidebar/40 border border-glass-border rounded-2xl px-5 py-4 flex items-center justify-between group overflow-hidden">
                    <span className="font-mono text-sm text-muted-foreground truncate mr-4 italic">
                      {referralLink}
                    </span>
                    <button 
                      onClick={copyLink}
                      className={`shrink-0 h-10 w-10 grid place-items-center rounded-xl transition-all ${
                        copied ? "bg-green-500 text-white" : "bg-primary text-primary-foreground shadow-glow hover:scale-105"
                      }`}
                    >
                      {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Referrals Section */}
            <section className="dash-card p-6">
              <h3 className="font-bold mb-6 flex items-center justify-between">
                <span>Recent Referrals</span>
                <Button variant="ghost" size="sm" className="text-primary text-xs font-bold" disabled>View all</Button>
              </h3>
              
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center glass rounded-2xl border-dashed border-2 border-glass-border/50">
                <div className="h-16 w-16 rounded-full bg-primary/5 grid place-items-center mb-4">
                  <Users className="h-8 w-8 text-primary/40" />
                </div>
                <h4 className="font-bold text-lg mb-1">No referrals yet</h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Share your unique link above to start building your network and earning recurring rewards.
                </p>
                <Button variant="outline" onClick={copyLink} className="mt-6 rounded-xl border-glass-border">
                  Copy Referral Link
                </Button>
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            
            {/* Tier Progress */}
            <section className="dash-card p-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Rocket className="h-4 w-4 text-amber-500" /> Tier Progress
              </h3>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Registered Partner</span>
                <span className="text-amber-600">Silver: 0%</span>
              </div>
              <div className="h-2 bg-amber-500/10 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "0%" }} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Refer your first organization to unlock the 15% recurring commission tier and partner portal assets.
              </p>
              <Button variant="link" className="px-0 text-amber-600 h-auto mt-3 text-xs font-bold">
                View all benefits <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </section>

            {/* Quick Actions */}
            <section className="space-y-3">
              <QuickAction 
                icon={<BarChart3 className="h-4 w-4" />} 
                title="Revenue Reports" 
                desc="Detailed monthly breakdown"
              />
              <QuickAction 
                icon={<Briefcase className="h-4 w-4" />} 
                title="Partner Assets" 
                desc="Brand kit & slide decks"
              />
              <QuickAction 
                icon={<MessageSquare className="h-4 w-4" />} 
                title="Support Channel" 
                desc="Chat with our engineers"
              />
              <QuickAction 
                icon={<Headphones className="h-4 w-4" />} 
                title="Success Manager" 
                desc="Schedule a 1-on-1 call"
              />
            </section>

            {/* Program Update */}
            <div className="glass rounded-2xl p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 text-primary font-bold text-xs mb-3">
                <Gift className="h-4 w-4" />
                <span>NEW REWARD</span>
              </div>
              <p className="text-sm font-bold mb-2">Exclusive Partner Dinner</p>
              <p className="text-xs text-muted-foreground mb-4">Join our top 1% partners in Nairobi this December for a strategy retreat.</p>
              <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5 p-0 h-auto font-bold text-xs">
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-glass-border bg-background/95 backdrop-blur-2xl">
          <div className="relative h-32 bg-gradient-primary overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="absolute -bottom-12 -right-12 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute top-6 left-8 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl glass grid place-items-center shadow-glow">
                <HeartHandshake className="h-6 w-6 text-white" />
              </div>
              <div className="text-white">
                <p className="text-xs font-bold opacity-80">Velora Ecosystem</p>
                <h2 className="text-xl font-black">Partner Onboarding</h2>
              </div>
            </div>
          </div>

          <div className="p-8">
            {onboardingStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">Welcome aboard!</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You're now part of an elite network of agencies and consultants building the future of collaboration. Let's get you set up.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <DollarSign className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs font-bold">15% Commission</p>
                    <p className="text-[10px] text-muted-foreground">Recurring revenue on every seat you refer.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-brand-green/5 border border-brand-green/10">
                    <Zap className="h-5 w-5 text-brand-green mb-2" />
                    <p className="text-xs font-bold">Priority Support</p>
                    <p className="text-[10px] text-muted-foreground">Direct access to our engineering team.</p>
                  </div>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">Your Referral Link</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    This is your unique magic link. Anyone who signs up through this link will be automatically credited to your account.
                  </p>
                </div>
                <div className="bg-sidebar/40 border border-glass-border rounded-xl p-4 flex items-center justify-between group">
                  <span className="font-mono text-xs text-muted-foreground truncate mr-4">
                    {referralLink}
                  </span>
                  <Button size="sm" variant="ghost" onClick={copyLink} className="h-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                    <Copy className="h-3.5 w-3.5 mr-2" /> Copy
                  </Button>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                  <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Cookies last for 60 days. Even if they don't buy immediately, you'll still get the credit.
                  </p>
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">Marketing Assets</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We've prepared high-quality assets to help you sell Velora. Use our brand kit, slide decks, and case studies.
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: Video, label: "Product Demo Clips", color: "blue" },
                    { icon: Briefcase, label: "Sales Presentation", color: "purple" },
                    { icon: Star, label: "Velora Expert Badge", color: "amber" }
                  ].map((asset) => (
                    <div key={asset.label} className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-glass-border hover:bg-card/60 transition-colors cursor-pointer">
                      <div className={`h-8 w-8 rounded-lg bg-${asset.color}-500/10 text-${asset.color}-500 grid place-items-center`}>
                        <asset.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold flex-1">{asset.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between">
              <div className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      onboardingStep === s ? "w-6 bg-primary" : "w-1.5 bg-glass-border"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                {onboardingStep > 1 && (
                  <Button variant="ghost" onClick={() => setOnboardingStep(onboardingStep - 1)} className="rounded-xl font-bold">
                    Back
                  </Button>
                )}
                {onboardingStep < 3 ? (
                  <Button onClick={() => setOnboardingStep(onboardingStep + 1)} className="rounded-xl bg-gradient-primary text-primary-foreground border-0 shadow-glow font-bold gap-2">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={finishOnboarding} className="rounded-xl bg-brand-green text-white border-0 shadow-glow font-bold gap-2">
                    Get Started <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function StatCard({ title, value, trend, icon, color }: any) {
  const colorMap: any = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
    amber: "bg-amber-500/10 text-amber-500",
  };

  return (
    <div className="dash-card p-6 relative overflow-hidden group hover:shadow-brand transition-all duration-300">
      <div className={`absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full ${colorMap[color]} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
      <div className={`h-10 w-10 rounded-xl ${colorMap[color]} grid place-items-center mb-4`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-muted-foreground">{title}</p>
      <h4 className="text-2xl font-black mt-1">{value}</h4>
      <p className={`text-[10px] font-bold mt-2 ${trend.includes("+") ? "text-green-500" : "text-muted-foreground"}`}>{trend}</p>
    </div>
  );
}

function QuickAction({ icon, title, desc }: any) {
  return (
    <button className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:bg-card/60 transition-all text-left border-glass-border/30 group">
      <div className="h-9 w-9 rounded-xl bg-sidebar/40 border border-glass-border grid place-items-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold leading-none">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </button>
  );
}
