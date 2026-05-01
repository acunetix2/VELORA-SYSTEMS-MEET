import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRecentMeetings, type LocalMeeting } from "@/lib/meeting";
import { Copy, Search, Video, Lock, Globe2, ArrowRight, ChevronDown, Clock, ShieldCheck, Share2 } from "lucide-react";
import { toast } from "sonner";

function MeetingsComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/meetings")({
  head: () => ({ meta: [{ title: "Meetings — Velora" }] }),
  component: MeetingsComponent,
});

function Page() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LocalMeeting[]>([]);
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { setItems(getRecentMeetings()); }, []);
  const filtered = items.filter((m) => m.id.includes(q.toLowerCase()));

  const copy = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/${id}`)
      .then(() => toast.success("Meeting link copied"));
  };

  return (
    <DashboardShell title="Previous Meetings">
      <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-2">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              Meeting History
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              Review and rejoin your past sessions
            </p>
          </div>
          
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Search by meeting code..." 
              className="pl-10 h-11 bg-card/40 border-glass-border rounded-xl focus:ring-purple-500/20" 
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="dash-card p-16 text-center border-dashed">
            <div className="h-20 w-20 rounded-full bg-muted/20 grid place-items-center mx-auto mb-4">
              <Video className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">{q ? "No matches found" : "No meetings yet"}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto">
              {q ? "Try a different search term or clear the filter." : "Your past meetings will appear here for easy rejoining."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((m) => {
              const isExpanded = expandedId === m.id;
              const date = new Date(m.createdAt);
              return (
                <div key={m.id} className={`dash-card ${isExpanded ? 'ring-2 ring-purple-500/20' : ''}`}>
                  <div className="dash-card-accent accent-purple" />
                  <div 
                    className="dash-card-header"
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-purple-500/10 grid place-items-center border border-purple-500/20 shrink-0">
                        <Video className="h-6 w-6 text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-mono font-bold text-base truncate uppercase tracking-tight">{m.id}</h3>
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2">
                        {m.privacy === "private" ? (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 uppercase tracking-tighter flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> Private
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20 uppercase tracking-tighter flex items-center gap-1">
                            <Globe2 className="h-2.5 w-2.5" /> Open
                          </span>
                        )}
                      </div>
                      <button className={`h-8 w-8 rounded-lg grid place-items-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-purple-500/10 text-purple-500' : 'text-muted-foreground'}`}>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="dash-card-content border-t border-glass-border/50 pt-6">
                      <div className="grid sm:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Session Security</h4>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 h-2 w-2 rounded-full ${m.privacy === 'private' ? 'bg-amber-500' : 'bg-green-500'}`} />
                              <div className="space-y-0.5">
                                <p className="text-sm font-bold">{m.privacy === 'private' ? 'End-to-End Private' : 'Public Access'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {m.privacy === 'private' 
                                    ? 'Requires host approval for new participants to join.' 
                                    : 'Anyone with the meeting code can join this session.'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-medium text-foreground/70">
                              <ShieldCheck className="h-4 w-4 text-purple-500" />
                              Encrypted connection verified
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Quick Rejoin</h4>
                          <div className="flex flex-col gap-2">
                            <Button 
                              onClick={() => navigate({ to: "/meet/$meetingId", params: { meetingId: m.id } })}
                              className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl h-11 border-0 shadow-lg shadow-purple-500/20"
                            >
                              Rejoin Meeting <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" onClick={() => copy(m.id)} className="rounded-xl h-10 border-glass-border hover:bg-purple-500/5 hover:text-purple-500">
                                <Share2 className="h-4 w-4 mr-2" /> Copy Link
                              </Button>
                              <Button variant="outline" className="rounded-xl h-10 border-glass-border hover:bg-purple-500/5 hover:text-purple-500">
                                <Copy className="h-4 w-4 mr-2" /> Copy ID
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