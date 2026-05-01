import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Play, GraduationCap, BookOpen, Lightbulb, Search, ArrowRight, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Velora Academy — Master Remote Collaboration" },
      { name: "description", content: "Learn how to host better meetings, manage remote teams, and master Velora with our free guides and tutorials." },
    ],
  }),
  component: AcademyPage,
});

function AcademyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-7xl">
        <section className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-green font-semibold">Academy</p>
          <h1 className="mt-3 font-display text-4xl sm:text-6xl font-semibold leading-tight tracking-tight">
            Learn the art of <span className="text-gradient">seamless collaboration.</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-lg sm:text-xl">
            Free resources, guides, and masterclasses to help you and your team thrive in a hybrid world.
          </p>
          <div className="mt-10 relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search tutorials, guides, and tips..."
              className="w-full h-14 pl-12 pr-6 rounded-2xl glass border-glass-border focus:border-brand-green/40 focus:outline-none transition-smooth"
            />
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <h2 className="text-2xl font-semibold flex items-center gap-3">
              <PlayCircle className="h-6 w-6 text-brand-green" /> 
              Featured Tutorials
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: "Mastering Host Controls", time: "8 min", level: "Beginner" },
                { title: "Collaborative Whiteboarding", time: "12 min", level: "Intermediate" },
                { title: "Advanced Security & E2EE", time: "15 min", level: "Expert" },
                { title: "Hosting Large Webinars", time: "10 min", level: "Advanced" },
              ].map((v, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-video rounded-3xl glass border-glass-border overflow-hidden mb-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                      <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md grid place-items-center">
                        <Play className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-brand-green font-bold">{v.level}</span>
                    <span className="text-[10px] text-muted-foreground">{v.time}</span>
                  </div>
                  <h3 className="text-lg font-semibold group-hover:text-brand-green transition-colors">{v.title}</h3>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-8">
            <h2 className="text-2xl font-semibold flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-brand-green" /> 
              Latest Guides
            </h2>
            <div className="space-y-4">
              {[
                "The 2026 Remote Work Report",
                "Best Practices for Hybrid Meetings",
                "How to Reduce Meeting Fatigue",
                "Setting Up Your Pro Home Studio",
              ].map((g, i) => (
                <div key={i} className="p-5 rounded-2xl glass border-glass-border hover:border-brand-green/30 cursor-pointer transition-smooth group">
                  <h4 className="font-medium mb-2 group-hover:text-brand-green transition-colors">{g}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>10 min read</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">Read guide <ArrowRight className="h-3 w-3" /></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-[2rem] bg-gradient-brand text-primary-foreground text-center">
              <GraduationCap className="h-10 w-10 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Velora Certification</h3>
              <p className="text-sm opacity-90 mb-6 leading-relaxed">
                Become a certified Velora Expert and lead your team to meeting excellence.
              </p>
              <Button variant="secondary" className="w-full rounded-xl h-12">
                Enroll for Free
              </Button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
