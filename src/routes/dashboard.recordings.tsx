import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { History, Download, Trash2, ChevronDown, FileText, Clock, ExternalLink } from "lucide-react";
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

type Item = { id: string; meetingId: string; transcript: string[] };

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
        transcript: d.content
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const download = (it: Item) => {
    const blob = new Blob([it.transcript.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `velora-${it.meetingId}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded");
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
    toast.success("Transcript deleted");
  };

  return (
    <DashboardShell title="Activity & Transcripts">
      <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-rose-500" />
            Meeting History
          </h2>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-card/60 px-3 py-1 rounded-full border border-glass-border">
            {items.length} Sessions
          </span>
        </div>

        {items.length === 0 ? (
          <div className="dash-card p-16 text-center border-dashed">
            <div className="h-20 w-20 rounded-full bg-muted/20 grid place-items-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">No history captured yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto">
              Captions and transcripts from your meetings will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((it) => {
              const isExpanded = expandedId === it.meetingId;
              return (
                <div key={it.meetingId} className={`dash-card ${isExpanded ? 'ring-2 ring-rose-500/20' : ''}`}>
                  <div className="dash-card-accent accent-red" />
                  <div 
                    className="dash-card-header"
                    onClick={() => setExpandedId(isExpanded ? null : it.meetingId)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-rose-500/10 grid place-items-center border border-rose-500/20 shrink-0">
                        <FileText className="h-6 w-6 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base truncate">Meeting: {it.meetingId}</h3>
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> Captured Session · {it.transcript.length} lines
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
                        {/* Transcript Preview */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
                            Transcript Preview
                          </h4>
                          <div className="bg-card/60 border border-glass-border rounded-2xl p-4 max-h-[300px] overflow-y-auto no-scrollbar font-mono text-[13px] leading-relaxed">
                            {it.transcript.length > 0 ? (
                              <div className="space-y-3">
                                {it.transcript.slice(0, 50).map((line, i) => {
                                  const [speaker, ...rest] = line.split(':');
                                  return (
                                    <div key={i} className="flex gap-2">
                                      <span className="text-rose-500 font-bold shrink-0">{speaker}:</span>
                                      <span className="text-foreground/80">{rest.join(':')}</span>
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

                        {/* Actions Sidebar */}
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Session Data</h4>
                            <div className="space-y-2 text-sm text-foreground/80">
                              <p className="flex items-center gap-2">Status: <span className="text-success font-bold">Processed</span></p>
                              <p className="flex items-center gap-2">Size: <span className="font-bold">{(it.transcript.join('\n').length / 1024).toFixed(1)} KB</span></p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Export & Cleanup</h4>
                            <div className="flex flex-col gap-2">
                              <Button onClick={() => download(it)} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-10 border-0">
                                <Download className="h-4 w-4 mr-2" /> Download TXT
                              </Button>
                              <Button variant="outline" className="rounded-xl h-10 border-glass-border hover:bg-rose-500/5 hover:text-rose-500">
                                <ExternalLink className="h-4 w-4 mr-2" /> Open in Editor
                              </Button>
                              <Button 
                                variant="ghost" 
                                onClick={() => remove(it.id)} 
                                className="rounded-xl h-10 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Permanently Delete
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