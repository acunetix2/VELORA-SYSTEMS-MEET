import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Sparkles, ListChecks, Target, FileText, Home, RefreshCw, Loader2, Download, Activity, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/summary/$meetingId")({
  head: ({ params }) => ({
    meta: [
      { title: `Summary ${params.meetingId} — Velora Meet` },
      { name: "description", content: "AI-generated meeting summary, decisions, and action items." },
    ],
  }),
  component: SummaryPage,
});

type Summary = {
  title: string;
  overview: string;
  key_points: string[];
  decisions: string[];
  action_items: { task: string; owner: string }[];
};

const TRANSCRIPT_KEY = (id: string) => `velora:transcript:${id}`;

function SummaryPage() {
  const { meetingId } = Route.useParams();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRANSCRIPT_KEY(meetingId));
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setTranscript(arr.join("\n"));
    } catch { /* noop */ }
  }, [meetingId]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("summarize-meeting", {
        body: { transcript, meetingId },
      });
      if (fnErr) {
        // surface gateway errors
        const msg = (fnErr as { message?: string }).message ?? "Failed to generate summary";
        setError(msg);
        return;
      }
      if (data?.error) {
        setError(data.error);
        return;
      }
      setSummary(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  // auto-generate if we have a transcript
  useEffect(() => {
    if (transcript && transcript.length > 30 && !summary && !loading && !error) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  const exportData = () => {
    let content = `MEETING SUMMARY: ${meetingId}\n\n`;
    if (summary) {
      content += `Title: ${summary.title}\n`;
      content += `Overview: ${summary.overview}\n\n`;
      content += `Key Points:\n${summary.key_points.map(k => `- ${k}`).join("\n")}\n\n`;
      content += `Decisions:\n${summary.decisions.map(d => `- ${d}`).join("\n")}\n\n`;
      content += `Action Items:\n${summary.action_items.map(a => `- ${a.task} (@${a.owner})`).join("\n")}\n\n`;
    }
    content += `TRANSCRIPT:\n${transcript}\n`;
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-${meetingId}-export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <header className="container mx-auto px-6 pt-6">
        <div className="glass rounded-2xl px-4 py-2.5 flex items-center justify-between">
          <Logo />
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard"><Home className="h-4 w-4 mr-2" /> Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-primary font-medium uppercase tracking-wide">Post-call summary</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold">
              {summary?.title ?? "Your meeting, summarized."}
            </h1>
            <p className="mt-2 text-muted-foreground font-mono text-sm">{meetingId}</p>
          </div>
          {(summary || transcript) && (
            <Button onClick={exportData} className="bg-card hover:bg-card/80 text-foreground border border-glass-border">
              <Download className="h-4 w-4 mr-2" /> Export Data
            </Button>
          )}
        </div>

        {!transcript && (
          <div className="glass rounded-2xl p-8 text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-semibold">No transcript was captured</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enable live captions during your next meeting to get an automatic summary here.
            </p>
            <Button asChild className="mt-5 bg-gradient-primary text-primary-foreground border-0 shadow-glow">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        )}

        {transcript && loading && (
          <div className="glass rounded-2xl p-10 text-center">
            <Loader2 className="h-8 w-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">Generating your AI summary…</p>
          </div>
        )}

        {transcript && error && !loading && (
          <div className="glass rounded-2xl p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={generate} variant="secondary" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" /> Try again
            </Button>
          </div>
        )}

        {summary && (
          <div className="space-y-5">
            <Card icon={<FileText className="h-5 w-5" />} title="Overview">
              <p className="text-foreground/90 leading-relaxed">{summary.overview}</p>
            </Card>

            <section className="grid md:grid-cols-2 gap-5">
              <Card icon={<Activity className="h-5 w-5" />} title="Engagement Vibe">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-brand grid place-items-center text-white shadow-glow animate-pulse">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-brand-green">High</p>
                    <p className="text-xs text-muted-foreground font-bold">Audience Focus</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  The meeting maintained a highly constructive tone with frequent participant contributions and positive feedback cycles.
                </p>
              </Card>

              <Card icon={<Sparkles className="h-5 w-5" />} title="Key points">
                <ul className="space-y-2">
                  {summary.key_points.map((k, i) => (
                    <li key={i} className="flex gap-2 text-foreground/90">
                      <span className="text-primary mt-1">•</span><span>{k}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            {summary.decisions.length > 0 && (
              <Card icon={<Target className="h-5 w-5" />} title="Decisions">
                <ul className="space-y-2">
                  {summary.decisions.map((d, i) => (
                    <li key={i} className="flex gap-2 text-foreground/90">
                      <span className="text-accent mt-1">→</span><span>{d}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {summary.action_items.length > 0 && (
              <Card icon={<ListChecks className="h-5 w-5" />} title="Action items">
                <ul className="space-y-3">
                  {summary.action_items.map((a, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                      <div className="flex-1">
                        <p className="text-foreground/90">{a.task}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Owner: {a.owner}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <details className="glass rounded-2xl p-5">
              <summary className="cursor-pointer text-sm font-medium">View raw transcript</summary>
              <pre className="mt-4 text-xs text-muted-foreground whitespace-pre-wrap font-mono">{transcript}</pre>
            </details>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow text-primary-foreground">
          {icon}
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
