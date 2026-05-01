import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Building2, Users2, Crown, ArrowRight, ShieldCheck, Zap, Globe, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/enterprise")({
  head: () => ({
    meta: [
      { title: "Enterprise Solutions — Velora Meet™" },
      { name: "description", content: "Scale your organization with Velora Enterprise. Dedicated infrastructure, SSO integration, and 24/7 priority support." },
    ],
  }),
  component: EnterprisePage,
});

function EnterprisePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto px-4 sm:px-6 py-10 sm:py-20 max-w-7xl">
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-brand-green/30 text-brand-green text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="h-3 w-3" /> Velora for Organizations
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-tight tracking-tight">
            Meetings at <span className="text-gradient">global scale.</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-lg sm:text-xl leading-relaxed">
            Velora Enterprise provides the security, control, and reliability required by modern organizations to collaborate without boundaries.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow h-12 px-8">
              Contact Sales <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="ghost" className="glass h-12 px-8">
              View Case Studies
            </Button>
          </div>
        </section>

        <section className="mt-24 grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Dedicated Infrastructure",
              desc: "Isolate your meeting traffic with private cloud instances and regional data residency.",
              icon: Building2,
            },
            {
              title: "Enterprise Security",
              desc: "SAML/SSO integration, domain lockdown, and granular role-based access controls.",
              icon: ShieldCheck,
            },
            {
              title: "Unlimited Scale",
              desc: "Host up to 2,000 participants per call with 99.99% uptime guarantees.",
              icon: Globe,
            },
            {
              title: "White-Glove Support",
              desc: "Dedicated account manager and 24/7 priority response for technical needs.",
              icon: MessageSquare,
            },
            {
              title: "Custom Branding",
              desc: "Custom meeting domains and fully branded lobby experiences for your clients.",
              icon: Zap,
            },
            {
              title: "Advanced Analytics",
              desc: "Deep insights into organizational usage and quality metrics across your team.",
              icon: Crown,
            },
          ].map((f) => (
            <div key={f.title} className="p-8 rounded-3xl glass border-glass-border hover:border-brand-green/30 transition-smooth group">
              <div className="h-12 w-12 rounded-2xl bg-brand-green/10 text-brand-green grid place-items-center mb-6 group-hover:scale-110 transition-transform">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {f.desc}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-24 glass rounded-[2.5rem] p-10 sm:p-20 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 h-64 w-64 bg-brand-green/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-display font-semibold mb-6">Ready to transform how your team works?</h2>
            <p className="text-muted-foreground mb-10 leading-relaxed">
              Join 5,000+ organizations building the future of remote collaboration on Velora. Our team will help you find the right fit.
            </p>
            <Button size="lg" className="bg-gradient-brand text-primary-foreground border-0 shadow-brand h-14 px-10 text-lg">
              Get a Personalized Demo
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}