import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { History, Download, Trash2, ChevronDown, FileText, Clock, ExternalLink, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function RecordingsComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/recordings")({
  head: () => ({ meta: [{ title: "Recordings — Velora" }] }),
  component: RecordingsComponent,
});

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Item = { id: string; meetingId: string; transcript: string[]; videoUrl?: string; createdAt: string };

function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("transcripts" as any)
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        toast.error("Failed to load recordings");
        setLoading(false);
        return;
      }

      setItems((data || []).map((d: any) => ({
        id: d.id,
        meetingId: d.meeting_id,
        transcript: d.content || [],
        videoUrl: d.video_url,
        createdAt: d.created_at
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const downloadTranscript = (it: Item) => {
    const blob = new Blob([it.transcript.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transcript-${it.meetingId}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded");
  };

  const downloadVideo = (it: Item) => {
    if (!it.videoUrl) return;
    const a = document.createElement("a");
    a.href = it.videoUrl;
    a.download = `recording-${it.meetingId}.webm`;
    a.target = "_blank";
    a.click();
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from("transcripts" as any)
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to delete recording");
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== id));
    toast.success("Recording deleted");
  };

  return (
    <DashboardShell title="Activity & Transcripts">
      <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-rose-500" />
            Meeting history
          </h2>
          <span className="text-xs font-bold text-muted-foreground bg-card/60 px-3 py-1 rounded-full border border-glass-border">
            {items.length} Sessions
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="dash-card p-16 text-center border-dashed">
            <div className="h-20 w-20 rounded-full bg-muted/20 grid place-items-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">No history captured yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto">
              Recordings and transcripts from your meetings will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((it) => {
              const isExpanded = expandedId === it.id;
              const date = new Date(it.createdAt);
              return (
                <div key={it.id} className={`dash-card ${isExpanded ? 'ring-2 ring-rose-500/20' : ''}`}>
                  <div className="dash-card-accent accent-red" />
                  <div 
                    className="dash-card-header"
                    onClick={() => setExpandedId(isExpanded ? null : it.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-rose-500/10 grid place-items-center border border-rose-500/20 shrink-0">
                        {it.videoUrl ? <Video className="h-6 w-6 text-rose-500" /> : <FileText className="h-6 w-6 text-rose-500" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base break-words">Meeting: {it.meetingId}</h3>
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {it.videoUrl ? "Video + " : ""}{it.transcript.length} lines
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className={`h-8 w-8 rounded-lg grid place-items-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-rose-500/10 text-rose-500' : 'text-muted-foreground'}`}>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="dash-card-content border-t border-glass-border/50 pt-6">
                      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
                        {/* Video / Transcript Preview */}
                        <div className="space-y-6">
                          {it.videoUrl && (
                            <div className="space-y-3">
                              <h4 className="text-[10px] tracking-[0.2em] font-bold text-muted-foreground">Video recording</h4>
                              <div className="rounded-2xl overflow-hidden border border-glass-border aspect-video bg-black shadow-elegant">
                                <video src={it.videoUrl} controls className="h-full w-full" />
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            <h4 className="text-[10px] tracking-[0.2em] font-bold text-muted-foreground">Transcript preview</h4>
                            <div className="bg-card/60 border border-glass-border rounded-2xl p-4 max-h-[300px] overflow-y-auto no-scrollbar font-mono text-[13px] leading-relaxed">
                              {it.transcript.length > 0 ? (
                                <div className="space-y-3">
                                  {it.transcript.slice(0, 50).map((line, i) => {
                                    const [speaker, ...rest] = line.split(':');
                                    return (
                                      <div key={i} className="flex gap-2">
                                        <span className="text-rose-500 font-bold shrink-0">{speaker}:</span>
                                        <span className="text-foreground/80 break-words">{rest.join(':')}</span>
                                      </div>
                                    );
                                  })}
                                  {it.transcript.length > 50 && (
                                    <p className="text-muted-foreground text-xs italic pt-2">... and {it.transcript.length - 50} more lines</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-muted-foreground italic">No transcript data available.</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Sidebar */}
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <h4 className="text-[10px] tracking-[0.2em] font-bold text-muted-foreground">Session data</h4>
                              <p className="flex items-center gap-2">Status: <span className="text-success font-bold">processed</span></p>
                              <p className="flex items-center gap-2">Format: <span className="font-bold">{it.videoUrl ? "Video/Transcript" : "Transcript only"}</span></p>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-[10px] tracking-[0.2em] font-bold text-muted-foreground">Export & actions</h4>
                            <div className="flex flex-col gap-2">
                              {it.videoUrl && (
                                <Button onClick={() => downloadVideo(it)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 border-0 shadow-glow">
                                  <Download className="h-4 w-4 mr-2" /> Download video
                                </Button>
                              )}
                              <Button variant="outline" onClick={() => downloadTranscript(it)} className="rounded-xl h-10 border-glass-border hover:bg-rose-500/5 hover:text-rose-500">
                                <Download className="h-4 w-4 mr-2" /> Download transcript
                              </Button>
                              <Button 
                                variant="ghost" 
                                onClick={() => remove(it.id)} 
                                className="rounded-xl h-10 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete recording
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardShell>
  );
}