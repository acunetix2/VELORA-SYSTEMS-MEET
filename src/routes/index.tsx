import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { AiAssistant } from "@/components/dashboard/AiAssistant";
import { 
  BrainCircuit, Video, MonitorUp, MessagesSquare, ShieldCheck, Zap, Lock,
  ArrowRight, MousePointerClick, Link2, Users, Mic, Globe2,
  Captions, Pin, Activity, Cloud, Calendar, Smartphone,
  Sparkles, KeyRound, Sliders, Building2, GraduationCap, Stethoscope,
  Headphones, CheckCircle2, Star, Twitter, Linkedin, Github, Instagram,
  Facebook, Mail, MapPin, Phone, ExternalLink 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Velora Meet™ — Beautifully simple video meetings" },
      { name: "description", content: "Crystal-clear video calls with host controls, private rooms, and a one-click waiting room. No installs." },
      { property: "og:title", content: "Velora Meet™ — Beautifully simple video meetings" },
      { property: "og:description", content: "Crystal-clear video calls with host controls, private rooms, and a one-click waiting room. No installs." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  
  // Logged-in users always go straight to the dashboard.
  if (user) return <Navigate to="/dashboard" />;
  const ctaTo = user ? "/dashboard" : "/auth";
  
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium text-brand-green mb-6 sm:mb-8 border border-brand-green/30">
          <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
          <span>Now with reactions, raise hand & private chat</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-semibold leading-[1.05] tracking-tight max-w-4xl mx-auto">
          Meet better. <span className="text-gradient">Faster</span>.
        </h1>

        <p className="mt-5 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Velora Meet™ is a focused video conferencing app that respects your time and your privacy.
          Spin up a room in one click, invite anyone, and stay in control.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow border-0 h-12 px-7 text-base w-full sm:w-auto">
            <Link to={ctaTo} {...(!user ? { search: { mode: "signup" as const } } : {})}>
              Start a meeting <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-12 px-7 text-base w-full sm:w-auto">
            <Link to={ctaTo} {...(!user ? { search: { mode: "signin" as const } } : {})}>Sign in</Link>
          </Button>
        </div>

        {/* Hero visual */}
        <div className="mt-14 sm:mt-20 relative max-w-5xl mx-auto">
          <div className="absolute inset-0 -z-10 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
          <div className="glass rounded-3xl p-2 sm:p-3 shadow-elegant animate-float">
            <div className="rounded-2xl overflow-hidden bg-card/40 aspect-[16/9] grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3 p-2 sm:p-3">
              {[
                { name: "Maya Chen", initial: "M" },
                { name: "Diego Rivera", initial: "D" },
                { name: "Aisha Khan", initial: "A" },
                { name: "You", initial: "Y" },
              ].map((p, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden glass">
                  <div className="absolute inset-0 bg-gradient-primary opacity-25" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="h-12 w-12 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-gradient-primary grid place-items-center font-display text-xl sm:text-3xl md:text-4xl font-semibold text-primary-foreground shadow-glow">
                      {p.initial}
                    </div>
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2 sm:left-2 sm:right-2 flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs glass px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md truncate">{p.name}</span>
                    <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Trusted-by strip */}
        <div className="mb-14 sm:mb-20">
          <p className="text-center text-xs uppercase tracking-[0.18em] text-muted-foreground mb-6">
            Trusted by teams at fast-growing organizations
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 items-center max-w-5xl mx-auto opacity-80">
            {[
              { name: "Northwind", initials: "NW" },
              { name: "Helix Labs", initials: "HX" },
              { name: "Atlas Studio", initials: "AS" },
              { name: "Quanta", initials: "QT" },
              { name: "Fielder", initials: "FD" },
              { name: "Verdant", initials: "VD" },
            ].map((o) => (
              <div key={o.name} className="glass rounded-xl py-4 grid place-items-center transition-smooth hover:opacity-100 hover:shadow-glow group">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-gradient-brand grid place-items-center text-[10px] font-bold text-primary-foreground">
                    {o.initials}
                  </div>
                  <span className="font-display font-semibold text-sm tracking-tight text-foreground/80 group-hover:text-foreground">{o.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">Built for teams that ship</p>
          <h2 className="mt-2 text-2xl sm:text-4xl font-semibold">An entire meeting platform — without the bloat.</h2>
          <p className="mt-3 text-muted-foreground">From the boardroom to the back row, every detail engineered for clarity.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            { icon: Video, title: "HD video & audio", desc: "WebRTC peer-to-peer with adaptive bitrate for any network." },
            { icon: MonitorUp, title: "Screen sharing", desc: "Share your screen, a window, or a tab in one click." },
            { icon: MessagesSquare, title: "Real-time chat", desc: "Send messages and links without leaving the call." },
            { icon: ShieldCheck, title: "Encrypted by default", desc: "DTLS-SRTP keeps every stream private end-to-end." },
            { icon: Users, title: "Waiting room", desc: "Lock private meetings and admit only the right people." },
            { icon: Zap, title: "Instant join", desc: "No installs, no friction. Open the link and you're in." },
            { icon: Captions, title: "Live captions", desc: "On-device speech to text with persistent transcripts." },
            { icon: Pin, title: "Pin & spotlight", desc: "Focus on the speaker — automatic grid stays balanced." },
            { icon: Activity, title: "Network-aware quality", desc: "Auto low-bandwidth mode keeps calls flowing on flaky Wi-Fi." },
            { icon: KeyRound, title: "Host controls", desc: "Lock rooms, mute everyone, transfer host or end for all." },
            { icon: Calendar, title: "Schedule & invite", desc: "Plan recurring meetings and copy a shareable link." },
            { icon: Smartphone, title: "Mobile-first", desc: "Touch-tuned controls and safe-area aware layouts." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-5 sm:p-6 transition-smooth hover:-translate-y-1 hover:shadow-glow">
              <div className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center shadow-glow mb-4">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">How we compare</p>
          <h2 className="mt-2 text-2xl sm:text-4xl font-semibold">Why teams switch to Velora</h2>
        </div>
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 text-sm font-semibold border-b border-glass-border">
            <div className="p-4">Capability</div>
            <div className="p-4 text-center text-primary">Velora</div>
            <div className="p-4 text-center text-muted-foreground">Legacy A</div>
            <div className="p-4 text-center text-muted-foreground">Legacy B</div>
          </div>
          {[
            ["Instant join, no install", true, true, true],
            ["Pin + auto-grid that scales", true, false, true],
            ["Built-in lobby & host controls", true, true, true],
            ["Live captions on-device (no server)", true, false, false],
            ["Network-aware low-bandwidth mode", true, false, false],
            ["Always-on encryption", true, true, true],
            ["Free for unlimited meetings (beta)", true, false, false],
          ].map(([cap, a, b, c], i) => (
            <div key={i} className="grid grid-cols-4 text-sm border-b border-glass-border/60 last:border-0">
              <div className="p-4">{cap}</div>
              <div className="p-4 text-center">{a ? <CheckCircle2 className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>}</div>
              <div className="p-4 text-center">{b ? <CheckCircle2 className="h-4 w-4 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground">—</span>}</div>
              <div className="p-4 text-center">{c ? <CheckCircle2 className="h-4 w-4 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground">—</span>}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">Built for every team</p>
          <h2 className="mt-2 text-2xl sm:text-4xl font-semibold">From classrooms to boardrooms</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Building2, title: "Enterprise", desc: "Secure rooms, host transfer, audit-ready logs." },
            { icon: GraduationCap, title: "Education", desc: "Lecture-ready captions, attendee lobby, screen share." },
            { icon: Stethoscope, title: "Healthcare", desc: "Private one-click rooms with no recording by default." },
            { icon: Headphones, title: "Support", desc: "Quick-join links with auto low-bandwidth fallback." },
          ].map((it) => (
            <div key={it.title} className="glass rounded-2xl p-5 transition-smooth hover:-translate-y-1 hover:shadow-glow">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow text-primary-foreground mb-3">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{it.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{it.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Numbers strip */}
      <section className="container mx-auto px-4 sm:px-6 py-12">
        <div className="glass rounded-3xl p-8 sm:p-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { n: "99.9%", l: "service uptime" },
            { n: "E2EE", l: "privacy by design" },
            { n: "WebRTC", l: "industry standard" },
            { n: "Chrome/Edge", l: "native support" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-3xl sm:text-4xl font-semibold text-gradient">{s.n}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">Loved by teams</p>
          <h2 className="mt-2 text-2xl sm:text-4xl font-semibold">What people say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { q: "Switched our entire org. Calls just work — even on hotel Wi-Fi.", a: "Sara K., COO" },
            { q: "The pin and auto-grid is what every product manager dreams of.", a: "Marc D., Head of Design" },
            { q: "Dead simple to invite clients. They never ask 'do I need an app?' anymore.", a: "Lina H., Solo consultant" },
          ].map((t) => (
            <figure key={t.a} className="glass rounded-2xl p-5">
              <div className="flex gap-0.5 text-primary mb-2">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <blockquote className="text-sm leading-relaxed">"{t.q}"</blockquote>
              <figcaption className="text-xs text-muted-foreground mt-3">— {t.a}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="container mx-auto px-4 sm:px-6 py-12">
        <div className="glass rounded-2xl p-6 sm:p-8 grid md:grid-cols-[1fr_auto] items-center gap-6">
          <div>
            <p className="text-xs text-primary uppercase tracking-wider font-semibold">Works with your stack</p>
            <h3 className="mt-1 text-xl sm:text-2xl font-semibold">Drop a meeting link anywhere</h3>
            <p className="text-sm text-muted-foreground mt-2">Calendar invites, Slack messages, email signatures, support tools — share a link and people are in.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {[Cloud, Calendar, MessagesSquare, Globe2, Sliders, Sparkles].map((Icon, i) => (
              <div key={i} className="h-12 w-12 rounded-xl glass grid place-items-center text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">How it works</p>
          <h2 className="mt-2 text-2xl sm:text-4xl font-semibold">Three steps. That's it.</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {[
            { icon: MousePointerClick, n: "01", title: "Create", desc: "One click on the dashboard creates a fresh, private room." },
            { icon: Link2, n: "02", title: "Share", desc: "Send the link by email, message or calendar invite." },
            { icon: Video, n: "03", title: "Meet", desc: "Admit guests from the lobby and you're in." },
          ].map((s) => (
            <div key={s.title} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow text-primary-foreground">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{s.n}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick links to pillar pages */}
      <section className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/about" className="glass rounded-2xl p-5 transition-smooth hover:shadow-brand border border-brand-green/20">
            <h3 className="font-semibold text-brand-green">About us</h3>
            <p className="text-sm text-muted-foreground mt-1">Founder, mission and values.</p>
          </Link>
          <Link to="/enterprise" className="glass rounded-2xl p-5 transition-smooth hover:shadow-brand border border-brand-green/20">
            <h3 className="font-semibold text-brand-green">Enterprise</h3>
            <p className="text-sm text-muted-foreground mt-1">Scale with dedicated solutions.</p>
          </Link>
          <Link to="/use-cases" className="glass rounded-2xl p-5 transition-smooth hover:shadow-glow">
            <h3 className="font-semibold">Use cases</h3>
            <p className="text-sm text-muted-foreground mt-1">Teams, interviews, study, clients.</p>
          </Link>
          <Link to="/faq" className="glass rounded-2xl p-5 transition-smooth hover:shadow-glow">
            <h3 className="font-semibold">FAQ</h3>
            <p className="text-sm text-muted-foreground mt-1">Answers to common questions.</p>
          </Link>
          <Link to="/academy" className="glass rounded-2xl p-5 transition-smooth hover:shadow-glow">
            <h3 className="font-semibold">Academy</h3>
            <p className="text-sm text-muted-foreground mt-1">Master master collaboration.</p>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h2 className="text-2xl sm:text-5xl font-semibold max-w-2xl mx-auto leading-tight">
          Ready to host meetings people actually enjoy?
        </h2>
        <p className="mt-4 text-muted-foreground">Free during beta. No credit card required.</p>
        <Button asChild size="lg" className="mt-7 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow border-0 h-12 px-8 text-base">
          <Link to={ctaTo} {...(!user ? { search: { mode: "signup" as const } } : {})}>Launch Velora Meet <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </section>

      {/* Partners section */}
      <section className="border-t border-glass-border/30 bg-card/10 backdrop-blur-sm py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-2">Our Global Partners</p>
            <h2 className="text-2xl sm:text-3xl font-semibold">Powering collaboration for world-class teams</h2>
          </div>
          <div className="relative overflow-hidden py-4 -mx-4 sm:-mx-6">
            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            
            <div className="animate-ticker flex items-center gap-6 px-6">
              {[
                { name: "Northwind", initials: "NW" },
                { name: "Helix Labs", initials: "HX" },
                { name: "Atlas Studio", initials: "AS" },
                { name: "Quanta", initials: "QT" },
                { name: "Fielder", initials: "FD" },
                { name: "Verdant", initials: "VD" },
                { name: "SkyLine", initials: "SL" },
                { name: "GlobalTech", initials: "GT" },
                { name: "EcoStream", initials: "ES" },
                { name: "Pulse Dev", initials: "PD" },
                { name: "SafeGuard", initials: "SG" },
                { name: "Acme Corp", initials: "AC" },
                { name: "Meliora Tech LTD", initials: "MT" },
                { name: "Gebeya Inc", initials: "GB" },
                { name: "Equity Bank", initials: "EB" },
                { name: "Safaricom", initials: "SF" },
                { name: "KCB Bank", initials: "KC" },
                { name: "NCBA Group", initials: "NC" },
                { name: "Little Cab", initials: "LC" },
                { name: "Britam", initials: "BT" },
              ].concat([
                { name: "Northwind", initials: "NW" },
                { name: "Helix Labs", initials: "HX" },
                { name: "Atlas Studio", initials: "AS" },
                { name: "Quanta", initials: "QT" },
                { name: "Fielder", initials: "FD" },
                { name: "Verdant", initials: "VD" },
                { name: "SkyLine", initials: "SL" },
                { name: "GlobalTech", initials: "GT" },
                { name: "EcoStream", initials: "ES" },
                { name: "Pulse Dev", initials: "PD" },
                { name: "SafeGuard", initials: "SG" },
                { name: "Acme Corp", initials: "AC" },
                { name: "Meliora Tech LTD", initials: "MT" },
                { name: "Gebeya Inc", initials: "GB" },
                { name: "Equity Bank", initials: "EB" },
                { name: "Safaricom", initials: "SF" },
                { name: "KCB Bank", initials: "KC" },
                { name: "NCBA Group", initials: "NC" },
                { name: "Little Cab", initials: "LC" },
                { name: "Britam", initials: "BT" },
              ]).map((o, i) => (
                <div key={i} className="glass rounded-2xl py-4 px-8 flex items-center justify-center transition-smooth hover:bg-card/60 hover:shadow-glow hover:-translate-y-1 group border border-glass-border/20 min-w-[140px]">
                  <span className="font-display font-bold text-base tracking-tight text-foreground/70 group-hover:text-foreground whitespace-nowrap">{o.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-background pt-20 pb-10 border-t border-glass-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 sm:gap-12 mb-16">
            {/* Branding */}
            <div className="col-span-2 lg:col-span-2 pr-0 lg:pr-16">
              <div className="mb-6">
                <Logo />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm">
                The world's most focused video conferencing platform. Engineered for speed, designed for clarity, and built for privacy-first collaboration.
              </p>
              <div className="flex gap-4">
                <a href="#" className="h-9 w-9 rounded-lg glass grid place-items-center text-muted-foreground hover:text-primary hover:shadow-glow transition-all"><Twitter className="h-4 w-4" /></a>
                <a href="#" className="h-9 w-9 rounded-lg glass grid place-items-center text-muted-foreground hover:text-primary hover:shadow-glow transition-all"><Linkedin className="h-4 w-4" /></a>
                <a href="#" className="h-9 w-9 rounded-lg glass grid place-items-center text-muted-foreground hover:text-primary hover:shadow-glow transition-all"><Github className="h-4 w-4" /></a>
                <a href="#" className="h-9 w-9 rounded-lg glass grid place-items-center text-muted-foreground hover:text-primary hover:shadow-glow transition-all"><Instagram className="h-4 w-4" /></a>
              </div>
            </div>

            {/* Links columns */}
            <div>
              <h4 className="font-semibold text-sm mb-6 uppercase tracking-wider">Product</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link to="/academy" className="hover:text-primary transition-colors">Academy</Link></li>
                <li><Link to="/enterprise" className="hover:text-primary transition-colors">Enterprise</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Live Streaming</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">SDK & API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-6 uppercase tracking-wider">Resources</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">System Status</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-6 uppercase tracking-wider">Company</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-glass-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>© {new Date().getFullYear()} Velora Systems Inc. All rights reserved.</span>
              <span className="hidden sm:inline h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className="hidden sm:inline">Nairobi, Kenya</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-primary transition-colors">Sitemap</a>
              <a href="#" className="hover:text-primary transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
