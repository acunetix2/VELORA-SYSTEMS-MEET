import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  Handshake, Target, Rocket, ShieldCheck, Globe2, Zap,
  ArrowRight, CheckCircle2, Star, Users, MessageSquare,
  BarChart3, Gift, Headphones,
} from "lucide-react";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partner Program — Velora Meet™" },
      { name: "description", content: "Join the Velora Meet partner ecosystem. Grow your business by delivering world-class collaboration solutions to your clients." },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden border-b border-glass-border/30">
        <div className="absolute inset-0 -z-10 opacity-30 blur-3xl bg-gradient-to-br from-primary/20 via-transparent to-brand-green/20" />
        <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-bold text-primary mb-6 border border-primary/20">
              <Handshake className="h-3.5 w-3.5" />
              <span>VELORA PARTNER ECOSYSTEM</span>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              Grow with <span className="text-gradient">Velora</span>.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl mb-10">
              Join a network of innovators, agencies, and consultants building the future of remote collaboration. Deliver a premium meeting experience to your clients.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow h-12 px-8">
                Apply to partner <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="ghost" size="lg" className="h-12 px-8">View tiers</Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
            <img 
              src="/partners_hero_illustration_1777577883975.png" 
              alt="Partnership Illustration" 
              className="relative z-10 rounded-3xl shadow-2xl animate-float"
            />
          </div>
        </div>
      </section>

      {/* Partner Tiers */}
      <section className="py-24 container mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">Program Tiers</p>
          <h2 className="text-3xl sm:text-5xl font-semibold">Choose your path</h2>
          <p className="text-muted-foreground mt-4 text-lg">Whether you're a solo consultant or a global agency, we have a tier for you.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Referral Partner",
              icon: Target,
              desc: "Perfect for consultants and influencers who love Velora.",
              benefits: ["15% recurring commission", "Partner portal access", "Ready-to-use assets"],
              color: "blue",
            },
            {
              title: "Solutions Partner",
              icon: Rocket,
              desc: "For agencies implementing collaboration stacks for clients.",
              benefits: ["25% recurring commission", "Priority technical support", "Co-marketing opportunities", "Certified expert badge"],
              color: "green",
              popular: true,
            },
            {
              title: "Enterprise Partner",
              icon: Globe2,
              desc: "For global distributors and technology integrators.",
              benefits: ["Custom revenue share", "Dedicated account manager", "White-label options", "Custom API support"],
              color: "purple",
            },
          ].map((tier) => (
            <div key={tier.title} className={`relative glass rounded-3xl p-8 transition-smooth hover:-translate-y-2 hover:shadow-glow border-2 ${tier.popular ? 'border-primary shadow-brand' : 'border-glass-border/30'}`}>
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-glow">
                  Most Popular
                </div>
              )}
              <div className={`h-12 w-12 rounded-2xl bg-gradient-${tier.color === 'green' ? 'brand' : 'primary'} grid place-items-center mb-6 shadow-glow`}>
                <tier.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{tier.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">{tier.desc}</p>
              <ul className="space-y-4 mb-10">
                {tier.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button variant={tier.popular ? "default" : "outline"} className="w-full h-11 rounded-xl">
                Get started
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Why Partner */}
      <section className="py-24 bg-card/10 backdrop-blur-sm border-y border-glass-border/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: BarChart3, title: "Recurring Revenue", desc: "Build a stable income stream with our generous commission structure." },
                { icon: Headphones, title: "Support", desc: "Direct access to our engineering team for complex implementations." },
                { icon: Gift, title: "Early Access", desc: "Be the first to test and deploy new Velora features for your clients." },
                { icon: Users, title: "Community", desc: "Join an exclusive network of high-growth technology partners." },
              ].map((f) => (
                <div key={f.title} className="glass rounded-2xl p-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary mb-4">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">Why Velora</p>
              <h2 className="text-3xl sm:text-5xl font-semibold mb-6 leading-[1.1]">The partner experience, reimagined.</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                We believe in mutual growth. Our partner program isn't just about commissions; it's about building long-term relationships that provide value to everyone in the ecosystem.
              </p>
              <div className="space-y-4">
                {[
                  "No minimum commitment to get started",
                  "Monthly payouts with clear reporting",
                  "White-label marketing collateral",
                  "Dedicated partner success manager",
                ].map((l) => (
                  <div key={l} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-brand-green/20 grid place-items-center">
                      <CheckCircle2 className="h-3 w-3 text-brand-green" />
                    </div>
                    <span className="text-sm font-medium">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 container mx-auto px-4 sm:px-6 text-center">
        <div className="glass rounded-3xl p-12 sm:p-20 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-primary opacity-10" />
          <h2 className="text-3xl sm:text-5xl font-semibold mb-6">Ready to build the future together?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Applications are reviewed within 48 hours. Join our ecosystem today and start delivering the best meeting experience on the planet.
          </p>
          <Button size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow h-14 px-10 text-lg rounded-2xl">
            Start your application now
          </Button>
        </div>
      </section>

      {/* Basic Footer for this page */}
      <footer className="py-10 border-t border-glass-border text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Velora Systems · Partner Program · <Link to="/" className="hover:text-primary">Home</Link>
      </footer>
    </div>
  );
}
