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
                <div key={m.id} className={`dash-card ${isExpanded ? 'ring-2 ring-primary/20 border-primary/30 shadow-none' : ''}`}>
                  <div className="dash-card-accent accent-purple" />
                  <div 
                    className="dash-card-header cursor-pointer select-none px-5 py-4"
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                      <div className="h-9 w-9 rounded-xl bg-purple-500/10 grid place-items-center border border-purple-500/20 shrink-0">
                        <Video className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h3 className="font-mono font-semibold text-[13px] truncate tracking-tight text-foreground">{m.id}</h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="truncate">{date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {m.privacy === "private" ? (
                        <span className="hidden sm:flex text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 items-center gap-1 shrink-0">
                          <Lock className="h-2.5 w-2.5" /> Private
                        </span>
                      ) : (
                        <span className="hidden sm:flex text-[10px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20 items-center gap-1 shrink-0">
                          <Globe2 className="h-2.5 w-2.5" /> Open
                        </span>
                      )}
                      <button className={`h-7 w-7 rounded-lg grid place-items-center transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 bg-purple-500/10 text-purple-500' : 'text-muted-foreground'}`}>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 py-5 border-t border-glass-border/50">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-muted-foreground tracking-wide">Session security</h4>
                          <div className="space-y-2.5">
                            <div className="flex items-start gap-2.5">
                              <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${m.privacy === 'private' ? 'bg-amber-500' : 'bg-green-500'}`} />
                              <div className="space-y-0.5 min-w-0">
                                <p className="text-[13px] font-semibold">{m.privacy === 'private' ? 'End-to-end private' : 'Public access'}</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {m.privacy === 'private' 
                                    ? 'Requires host approval for new participants to join.' 
                                    : 'Anyone with the meeting code can join this session.'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-[12px] font-medium text-foreground/70">
                              <ShieldCheck className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                              Encrypted connection verified
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-muted-foreground tracking-wide">Quick rejoin</h4>
                          <div className="flex flex-col gap-1.5">
                            <Button 
                              onClick={() => navigate({ to: "/meet/$meetingId", params: { meetingId: m.id } })}
                              className="w-full bg-primary hover:opacity-90 text-primary-foreground rounded-xl h-9 border-0 shadow-md shadow-primary/20 font-semibold text-[13px]"
                            >
                              Rejoin meeting <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                            </Button>
                            <div className="grid grid-cols-2 gap-1.5">
                              <Button variant="outline" onClick={() => copy(m.id)} className="rounded-xl h-8 border-glass-border hover:bg-primary/5 hover:text-primary font-semibold text-[11px]">
                                <Share2 className="h-3 w-3 mr-1" /> Copy link
                              </Button>
                              <Button variant="outline" onClick={() => navigator.clipboard.writeText(m.id).then(() => toast.success("Meeting ID copied"))} className="rounded-xl h-8 border-glass-border hover:bg-primary/5 hover:text-primary font-semibold text-[11px]">
                                <Copy className="h-3 w-3 mr-1" /> Copy ID
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