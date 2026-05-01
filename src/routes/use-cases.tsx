import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, GraduationCap, HeartHandshake, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/use-cases")({
  head: () => ({
    meta: [
      { title: "Use cases — Velora Meet" },
      { name: "description", content: "From remote teams to interviews and study groups, Velora fits the way you meet." },
      { property: "og:title", content: "Use cases — Velora Meet" },
      { property: "og:description", content: "From remote teams to interviews and study groups, Velora fits the way you meet." },
    ],
  }),
  component: UseCasesPage,
});

const cases = [
  { icon: Briefcase, title: "Remote teams", desc: "Stand-ups, design reviews and 1:1s with crystal-clear video and instant chat." },
  { icon: Users, title: "Client calls", desc: "Send a private link, admit guests from the lobby, and end on a high note." },
  { icon: GraduationCap, title: "Study groups", desc: "Open meetings, share your screen, take captions for review later." },
  { icon: HeartHandshake, title: "Interviews", desc: "Lock the room once it starts. Built-in waiting room keeps things tidy." },
];

function UseCasesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
        <p className="text-xs text-primary uppercase tracking-wider font-semibold">Use cases</p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-semibold leading-tight max-w-2xl">
          Built for the way <span className="text-gradient">you actually meet</span>.
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          A focused conferencing experience without the bloat of an enterprise suite.
        </p>
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          {cases.map((c) => (
            <div key={c.title} className="glass rounded-2xl p-6 transition-smooth hover:-translate-y-0.5 hover:shadow-glow">
              <div className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center shadow-glow text-primary-foreground mb-4">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 glass rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-semibold">Spin up a room in one click.</h2>
          <Button asChild size="lg" className="mt-5 bg-gradient-primary text-primary-foreground border-0 shadow-glow">
            <Link to="/dashboard">Start a meeting <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
