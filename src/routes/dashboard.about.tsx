import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  Shield, Zap, Video, Users, Globe, Lock, Star, Code2,
  HeartHandshake, Award, Building2, Sparkles, ArrowRight,
  Target, Eye, Quote, Lightbulb, CheckCircle2, TrendingUp
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/about")({
  head: () => ({ meta: [{ title: "About — Velora" }] }),
  component: () => (
    <RequireAuth>
      <AboutPage />
    </RequireAuth>
  ),
});

const STATS = [
  { label: "Uptime SLA", value: "99.99%", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { label: "End-to-End Encrypted", value: "100%", icon: Lock, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Countries Active", value: "120+", icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Enterprise Clients", value: "500+", icon: Building2, color: "text-purple-500", bg: "bg-purple-500/10" },
];

const ADVANTAGES = [
  { title: "P2P Architecture", desc: "Unlike Zoom or Teams, Velora uses peer-to-peer WebRTC — your media never touches our servers, making it inherently private." },
  { title: "No Install Required", desc: "Full enterprise-grade video conferencing directly in your browser. Zero downloads, zero plugins, zero friction." },
  { title: "AI-Assisted Workflow", desc: "Built-in live captions, automated transcripts, and smart summaries reduce note-taking overhead by over 60%." },
  { title: "Open Standards", desc: "Built on WebRTC, STUN/TURN, and open protocols — no proprietary lock-in, no black boxes, full auditability." },
  { title: "Classroom Intelligence", desc: "Purpose-built Classroom Suite with assignments, Q&A, whiteboards, and polls for educators." },
  { title: "Enterprise Security", desc: "Org-level admin controls, passcode-gated access, waiting rooms, and end-to-end encrypted sessions by default." },
];

const TEAM = [
  { name: "Iddy Chesire", role: "Chief Executive Officer", initials: "IC", color: "#6366f1", bio: "Visionary leader with deep expertise in scaling enterprise communications. Committed to bridging technical gaps for global teams." },
  { name: "Precious Ochieng", role: "Chief Technology Officer", initials: "PO", color: "#22c55e", bio: "WebRTC pioneer and systems architect. Former lead at a major telecommunications firm, specializing in low-latency infrastructure." },
  { name: "Benson Kibet", role: "Chief Design Officer", initials: "BK", color: "#f59e0b", bio: "Expert in user-centric design and behavioral psychology. Focused on making enterprise tools feel intuitive and human." },
  { name: "Macmilan Mutua", role: "Head of Security", initials: "MM", color: "#ec4899", bio: "Cybersecurity specialist with a background in cryptographic research and military-grade encryption systems." },
];

function AboutPage() {
  return (
    <DashboardShell title="About Velora">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-16">

        {/* Hero */}
        <section className="dash-card relative overflow-hidden">
          <div className="dash-card-accent bg-gradient-primary" />
          <div className="p-8 sm:p-12 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
              <Sparkles className="h-3 w-3" /> Velora Systems — Enterprise Edition v2.4
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Where teams<br />
              <span className="text-gradient">actually connect.</span>
            </h1>
            <p className="mt-6 text-muted-foreground leading-relaxed max-w-xl text-lg">
              Velora is a next-generation enterprise video collaboration platform — engineered for speed, 
              designed for clarity, and built with Africa's future-forward teams in mind.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                to="/dashboard/upgrade"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-bold shadow-glow hover:opacity-90 transition-all"
              >
                Upgrade Plan <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Motto */}
        <section className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Target, label: "Mission", color: "text-blue-500", bg: "bg-blue-500/10",
              text: "To democratize professional video collaboration — making enterprise-grade tools accessible to every team, in every corner of the world."
            },
            {
              icon: Eye, label: "Vision", color: "text-purple-500", bg: "bg-purple-500/10",
              text: "A world where geographic boundaries no longer limit human potential — where any team can collaborate with the same power as a Fortune 500 boardroom."
            },
            {
              icon: Quote, label: "Motto", color: "text-green-500", bg: "bg-green-500/10",
              text: "\"Connect with clarity. Collaborate with purpose. Build without limits.\""
            },
          ].map(({ icon: Icon, label, color, bg, text }) => (
            <div key={label} className="dash-card p-6 group hover:ring-2 hover:ring-primary/20 transition-all">
              <div className={`h-10 w-10 rounded-xl ${bg} ${color} grid place-items-center mb-4`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground mb-2">{label}</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
            </div>
          ))}
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="dash-card p-6 text-center group hover:shadow-glow transition-all">
              <div className={`h-10 w-10 rounded-xl ${s.bg} ${s.color} grid place-items-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </section>

        {/* What We Do */}
        <section className="dash-card">
          <div className="dash-card-accent bg-gradient-primary" />
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black">What We Do</h2>
                <p className="text-muted-foreground text-sm">The core of the Velora experience</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-foreground/80">
              {[
                "Peer-to-peer HD video conferencing with up to 100 participants",
                "AI-powered live captions and session transcripts in real time",
                "Collaborative whiteboards, polls, Q&A and breakout rooms",
                "Enterprise classroom management with assignments and grading",
                "End-to-end encrypted meetings with zero cloud media routing",
                "Organization-level management, passcode security & SAML SSO",
                "Built-in meeting scheduler with calendar sync (Google / iCal)",
                "Recording, session summaries and analytics for team leads",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How We're Better */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 grid place-items-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Why Velora Wins</h2>
              <p className="text-muted-foreground text-sm">How we compare to the market</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADVANTAGES.map((v) => (
              <div key={v.title} className="dash-card p-5 group hover:ring-2 hover:ring-primary/20 transition-all">
                <h3 className="font-black text-sm mb-2 flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-400" /> {v.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Leadership */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Leadership Team</h2>
              <p className="text-muted-foreground text-sm">The people driving Velora's mission</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {TEAM.map((m) => (
              <div key={m.name} className="dash-card p-6 flex items-start gap-5 group hover:shadow-glow transition-all">
                <div
                  className="h-14 w-14 rounded-2xl grid place-items-center text-white font-black text-lg shrink-0 shadow-lg group-hover:scale-105 transition-transform"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </div>
                <div>
                  <p className="font-black text-sm">{m.name}</p>
                  <p className="text-[11px] text-primary font-bold mt-0.5">{m.role}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{m.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <section className="dash-card p-6 flex items-center gap-4">
          <Award className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="font-bold text-sm">Built with purpose in Nairobi, Kenya</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Velora Systems Inc. © {new Date().getFullYear()} — A proudly African technology company empowering global teams.
            </p>
          </div>
        </section>

      </div>
    </DashboardShell>
  );
}
