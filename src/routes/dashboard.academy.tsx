import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, PlayCircle, BookOpen, Lightbulb,
  Search, ExternalLink, ArrowRight, Video,
  MessageCircle, Layout, X, Play, Clock as ClockIcon,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function AcademyComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/academy")({
  head: () => ({ meta: [{ title: "Academy — Velora" }] }),
  component: AcademyComponent,
});

type Course = { id: string; title: string; description: string; category: string; lessons_count: number };
type Progress = { course_id: string; progress: number; status: string };

function Page() {
  const { user } = useAuth();
  const [activeLesson, setActiveLesson] = useState<{ title: string; category: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: cData } = await supabase.from("academy_courses").select("*");
      setCourses(cData || []);

      if (user) {
        const { data: pData } = await supabase
          .from("user_course_progress")
          .select("*")
          .eq("user_id", user.id);
        
        const pMap: Record<string, Progress> = {};
        pData?.forEach(p => pMap[p.course_id] = p);
        setProgress(pMap);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return (
    <DashboardShell title="Academy">
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell title="Academy">
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Welcome to the Academy</h2>
            <p className="text-sm text-muted-foreground">Master the art of collaborative meetings with our curated resources.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tutorials..." className="pl-9 bg-input/60 border-glass-border" />
          </div>
        </div>

        {activeLesson ? (
          <div className="dash-card p-0 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="aspect-video bg-black relative group">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-t from-black/80 via-transparent to-transparent">
                <Play className="h-16 w-16 fill-current mb-4" />
                <p className="text-lg font-bold">Previewing: {activeLesson.title}</p>
                <p className="text-sm opacity-70">Lesson video will load here...</p>
              </div>
              <button 
                onClick={() => setActiveLesson(null)}
                className="absolute top-4 right-4 h-10 w-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded mb-2 inline-block">
                  {activeLesson.category}
                </span>
                <h3 className="text-xl font-bold">{activeLesson.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="rounded-xl h-12" onClick={() => setActiveLesson(null)}>Close</Button>
                <Button className="bg-brand-green hover:bg-brand-green/90 text-white shadow-brand rounded-xl h-12 px-8" onClick={() => toast.success("Course joined", { description: "This lesson has been added to your dashboard." })}>
                  Enroll in Track
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Feature Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {courses.map((c) => (
                <AcademyCard
                  key={c.id}
                  icon={c.category === 'Hardware' ? <Video className="h-5 w-5" /> : c.category === 'Features' ? <Layout className="h-5 w-5" /> : c.category === 'Soft Skills' ? <MessageCircle className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                  title={c.title}
                  desc={c.description}
                  lessons={c.lessons_count}
                  active={progress[c.id]?.progress > 0}
                  onClick={() => setActiveLesson(c)}
                />
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Feed */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-semibold">Your Learning Path</h3>
                <div className="space-y-4">
                  {Object.values(progress).length === 0 ? (
                    <div className="p-8 rounded-3xl border border-dashed border-glass-border text-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Pick a course above to start learning.</p>
                    </div>
                  ) : (
                    Object.values(progress).map((p) => {
                      const course = courses.find(c => c.id === p.course_id);
                      if (!course) return null;
                      return (
                        <div key={p.course_id} className="p-5 rounded-3xl glass border-glass-border hover:border-brand-green/30 transition-smooth group cursor-pointer" onClick={() => setActiveLesson(course)}>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] uppercase tracking-wider bg-brand-green/10 text-brand-green px-2 py-0.5 rounded font-bold">
                              {course.category}
                            </span>
                            <span className="text-xs text-muted-foreground">{p.progress}% complete</span>
                          </div>
                          <h4 className="font-semibold mb-4 group-hover:text-brand-green transition-colors">{course.title}</h4>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-brand-green shadow-glow transition-all" style={{ width: `${p.progress}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <h3 className="text-lg font-semibold pt-4">Community Guides</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    "How to use P2P File Transfer",
                    "Setting Up Breakout Rooms",
                    "Keyboard Shortcuts Masterlist",
                    "Improving Video Stability",
                  ].map((g) => (
                    <div key={g} className="p-4 rounded-xl glass border-glass-border flex items-center justify-between hover:bg-card/40 cursor-pointer group" onClick={() => toast.info(`Opening Guide: ${g}`)}>
                      <span className="text-sm font-medium group-hover:text-brand-green transition-colors">{g}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <aside className="space-y-6">
                <div className="p-8 rounded-[2rem] bg-gradient-brand text-white shadow-brand">
                  <Lightbulb className="h-8 w-8 mb-4 opacity-80" />
                  <h3 className="font-bold text-lg mb-2">Pro Tip</h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    Use <kbd className="px-1.5 py-0.5 rounded border border-white/20 bg-white/10 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded border border-white/20 bg-white/10 font-mono text-[10px]">D</kbd> to quickly mute/unmute your microphone in any meeting.
                  </p>
                </div>

                <div className="p-6 rounded-3xl glass border-glass-border">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-brand-green" /> Masterclasses
                  </h3>
                  <div className="space-y-4">
                    <div className="aspect-video rounded-2xl bg-muted overflow-hidden relative group cursor-pointer" onClick={() => setActiveLesson({ title: "Leading Hybrid Teams", category: "Masterclass" })}>
                      <div className="absolute inset-0 grid place-items-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <PlayCircle className="h-10 w-10 text-white/70 group-hover:text-white transition-all scale-90 group-hover:scale-100" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Leading Hybrid Teams</p>
                      <p className="text-xs text-muted-foreground italic">With Velora Experts</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function AcademyCard({ icon, title, desc, lessons, active, onClick }: { icon: React.ReactNode; title: string; desc: string; lessons: number; active?: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-[2rem] border transition-smooth hover:-translate-y-1 cursor-pointer flex flex-col h-full ${
        active ? "bg-brand-green/5 border-brand-green/30 shadow-brand/5" : "glass border-glass-border hover:border-brand-green/30"
      }`}
    >
      <div className={`h-12 w-12 rounded-2xl grid place-items-center mb-5 ${active ? "bg-brand-green text-white shadow-brand" : "bg-muted text-primary"}`}>
        {icon}
      </div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">{desc}</p>
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="h-3 w-3 text-brand-green" />
          <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider">{lessons} Lessons</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
