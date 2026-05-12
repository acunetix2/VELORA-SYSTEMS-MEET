import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Github, Linkedin, Mail, Award, Lock, Globe2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About - Velora Meet™" },
      { name: "description", content: "Meet the team behind Velora Meet. Founded by security researcher Iddy Chesire to build private, secure video meetings for everyone." },
      { property: "og:title", content: "About Velora Meet™" },
      { property: "og:description", content: "Founded by security researcher Iddy Chesire - privacy and craft, in equal measure." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen relative">
      <SiteHeader />

      {/* Glass overlay over the landing visual — keeps nav visible */}
      <div className="absolute inset-x-0 top-20 -z-10 h-96 bg-gradient-primary opacity-10 blur-3xl rounded-full" />

      <main className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 max-w-6xl">
        {/* Hero */}
        <section className="glass rounded-3xl p-6 sm:p-12 shadow-elegant">
          <p className="text-xs tracking-[0.18em] text-primary font-semibold">About Velora Meet™</p>
          <h1 className="mt-3 font-display text-3xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
            Privacy & craft, <span className="text-gradient">in equal measure</span>.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Velora Meet is a focused video meeting platform built for teams that take privacy seriously
            without giving up the polish. No installs, no tracking pixels, no surprise bills.
          </p>
        </section>

        {/* Founder */}
        <section className="mt-8 grid lg:grid-cols-[auto_1fr] gap-6 sm:gap-8 items-start">
          <FounderPortrait />

          <div className="glass rounded-3xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-green font-semibold">Founder</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold">Iddy Chesire</h2>
            <p className="text-sm text-muted-foreground mt-1">Security Researcher · Founder & CEO</p>

            <div className="mt-5 space-y-3 text-sm leading-relaxed text-foreground/85">
              <p>
                Iddy is a security researcher who has spent years auditing real-time and collaboration software.
                After watching teams switch between bloated, opaque meeting apps, he built Velora Meet™ as the
                meeting tool he wished existed: peer-to-peer first, encrypted by default, and dead simple to host.
              </p>
              <p>
                Today he leads engineering and security at Velora Systems, working with a small distributed team
                to ship a meeting product that respects your time, your bandwidth, and your privacy.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <a href="mailto:support@velorasystems.com" className="glass rounded-md px-3 py-1.5 text-xs inline-flex items-center gap-1.5 hover:bg-card/70">
                <Mail className="h-3.5 w-3.5 text-primary" /> support@velorameet.com
              </a>
              <span className="glass rounded-md px-3 py-1.5 text-xs inline-flex items-center gap-1.5 text-muted-foreground">
                <Linkedin className="h-3.5 w-3.5" /> /in/iddy-chesire-55009b264/
              </span>
              <span className="glass rounded-md px-3 py-1.5 text-xs inline-flex items-center gap-1.5 text-muted-foreground">
                <Github className="h-3.5 w-3.5" /> @acunetix2
              </span>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, color: "text-brand-green", title: "Security first", desc: "Encrypted by default with DTLS-SRTP. We never see your media." },
            { icon: Lock, color: "text-primary", title: "Private by design", desc: "Peer-to-peer architecture means your conversations stay between you." },
            { icon: Award, color: "text-warning", title: "Built with care", desc: "Every interaction tuned for clarity and speed. No bloat." },
            { icon: Globe2, color: "text-accent", title: "Built for everyone", desc: "Works on any browser, any device, anywhere in the world." },
            { icon: Github, color: "text-muted-foreground", title: "Open standards", desc: "We build on WebRTC and contribute back to the ecosystem." },
            { icon: Mail, color: "text-brand-green", title: "Real support", desc: "Email a real human. We answer fast and we listen." },
          ].map((v) => (
            <div key={v.title} className="glass rounded-2xl p-5 transition-smooth hover:-translate-y-1 hover:shadow-glow">
              <v.icon className={`h-6 w-6 ${v.color}`} />
              <h3 className="mt-3 font-semibold">{v.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{v.desc}</p>
            </div>
          ))}
        </section>

        {/* Mission */}
        <section className="mt-10 glass rounded-3xl p-6 sm:p-10 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-green font-semibold">Our mission</p>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold max-w-3xl mx-auto leading-tight">
            To make secure, private meetings the default - for every team, on every continent.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            We believe communication tools should serve the people using them - not data brokers, not advertisers,
            not opaque corporate giants. That belief shapes every decision we make.
          </p>
          <Button asChild size="lg" className="mt-7 bg-gradient-brand text-primary-foreground border-0 shadow-brand h-12 px-8">
            <Link to="/auth" search={{ mode: "signup" as const }}>Join us - start a meeting <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>

        <footer className="mt-10 py-6 border-t border-border/40 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Velora Systems · All rights reserved.
        </footer>
      </main>
    </div>
  );
}

function FounderPortrait() {
  // Stylised SVG portrait of Iddy Chesire — clean, abstract, on-brand
  // (no external image hosting required, fully accessible & fast)
  return (
    <div className="glass rounded-3xl p-2 w-full lg:w-72 shrink-0 shadow-glow">
      <div className="rounded-2xl overflow-hidden aspect-[3/4] relative bg-gradient-to-br from-[oklch(0.30_0.06_220)] via-[oklch(0.22_0.05_245)] to-[oklch(0.20_0.08_280)]">
        <svg viewBox="0 0 300 400" className="absolute inset-0 w-full h-full" aria-label="Iddy Chesire portrait illustration">
          <defs>
            <linearGradient id="skin" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.55 0.05 50)" />
              <stop offset="100%" stopColor="oklch(0.42 0.06 40)" />
            </linearGradient>
            <linearGradient id="shirt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.30 0.04 240)" />
              <stop offset="100%" stopColor="oklch(0.20 0.04 240)" />
            </linearGradient>
            <radialGradient id="bg" cx="50%" cy="35%" r="70%">
              <stop offset="0%" stopColor="oklch(0.74 0.13 200 / 0.35)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="300" height="400" fill="url(#bg)" />
          {/* shoulders / shirt */}
          <path d="M 30 400 C 50 290 110 270 150 270 C 190 270 250 290 270 400 Z" fill="url(#shirt)" />
          {/* neck */}
          <rect x="130" y="230" width="40" height="55" rx="14" fill="url(#skin)" />
          {/* head */}
          <ellipse cx="150" cy="170" rx="68" ry="80" fill="url(#skin)" />
          {/* hair */}
          <path d="M 90 130 C 90 80 130 65 150 65 C 175 65 215 85 215 130 C 215 145 210 152 200 145 C 195 130 175 115 150 115 C 120 115 100 135 95 150 C 88 150 90 138 90 130 Z" fill="oklch(0.18 0.02 30)" />
          {/* eyes */}
          <circle cx="125" cy="170" r="4" fill="oklch(0.18 0.03 30)" />
          <circle cx="175" cy="170" r="4" fill="oklch(0.18 0.03 30)" />
          {/* glasses (security researcher!) */}
          <circle cx="125" cy="170" r="14" fill="none" stroke="oklch(0.85 0.02 240)" strokeWidth="1.5" />
          <circle cx="175" cy="170" r="14" fill="none" stroke="oklch(0.85 0.02 240)" strokeWidth="1.5" />
          <line x1="139" y1="170" x2="161" y2="170" stroke="oklch(0.85 0.02 240)" strokeWidth="1.5" />
          {/* smile */}
          <path d="M 130 205 Q 150 220 170 205" stroke="oklch(0.30 0.05 30)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* shield watermark */}
          <g opacity="0.35" transform="translate(232, 332)">
            <path d="M 0 0 L 18 0 L 18 14 C 18 22 9 28 9 28 C 9 28 0 22 0 14 Z" fill="oklch(0.78 0.16 158)" />
          </g>
        </svg>
      </div>
      <div className="px-3 py-3 text-center">
        <p className="font-semibold text-sm">Iddy Chesire</p>
        <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
          <ShieldCheck className="h-3 w-3 text-brand-green" /> Security Researcher
        </p>
      </div>
    </div>
  );
}