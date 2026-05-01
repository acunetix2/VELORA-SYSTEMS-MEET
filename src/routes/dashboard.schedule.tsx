import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Copy, Plus, Trash2, ChevronDown, Clock, Video, FileText, ArrowRight } from "lucide-react";
import { generateMeetingId } from "@/lib/meeting";
import { toast } from "sonner";
import { generateGoogleCalendarLink, downloadICS } from "@/lib/calendar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

function ScheduleComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/schedule")({
  head: () => ({ meta: [{ title: "Schedule — Velora" }] }),
  component: ScheduleComponent,
});

type Scheduled = { id: string; meetingId: string; title: string; when: string; notes: string };
const KEY = "velora:scheduled";

function load(): Scheduled[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(items: Scheduled[]) { localStorage.setItem(KEY, JSON.stringify(items)); }

import { supabase } from "@/integrations/supabase/client";

function Page() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Scheduled[]>([]);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("scheduled_meetings" as any)
        .select("*")
        .order("scheduled_for", { ascending: true });
      
      if (error) {
        toast.error("Failed to load schedule");
        setLoading(false);
        return;
      }

      setItems((data || []).map((d: any) => ({
        id: d.id,
        meetingId: d.meeting_id,
        title: d.title,
        when: d.scheduled_for,
        notes: d.notes
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const add = async () => {
    if (!title.trim() || !when) { toast.error("Title and time required"); return; }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const mid = generateMeetingId();
    const { data, error } = await supabase
      .from("scheduled_meetings" as any)
      .insert({
        user_id: user.id,
        meeting_id: mid,
        title: title.trim(),
        scheduled_for: when,
        notes: notes.trim()
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to schedule meeting");
      return;
    }

    setItems([{
      id: data.id,
      meetingId: data.meeting_id,
      title: data.title,
      when: data.scheduled_for,
      notes: data.notes
    }, ...items]);
    
    setTitle(""); setWhen(""); setNotes("");
    toast.success("Meeting scheduled");
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from("scheduled_meetings" as any)
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to cancel meeting");
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Meeting cancelled");
  };

  const copyLink = (mid: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/${mid}`)
      .then(() => toast.success("Meeting link copied"));
  };

  return (
    <DashboardShell title="Schedule">
      <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto grid lg:grid-cols-[400px_1fr] gap-8 items-start">
        {/* Left column: Create */}
        <div className="dash-card sticky top-8">
          <div className="dash-card-accent accent-blue" />
          <div className="p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 grid place-items-center">
                <Plus className="h-4 w-4 text-blue-500" />
              </div>
              Schedule Meeting
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="t" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Meeting Title</Label>
                <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project Sync" className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="w" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Date & Time</Label>
                  <Input id="w" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-blue-500/20" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="d" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Duration</Label>
                  <select id="d" className="w-full bg-card/40 border border-glass-border h-12 rounded-xl focus:ring-2 focus:ring-blue-500/20 px-3 text-sm">
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">1 Hour</option>
                    <option value="90">1.5 Hours</option>
                    <option value="120">2 Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Security</Label>
                  <select className="w-full bg-card/40 border border-glass-border h-12 rounded-xl focus:ring-2 focus:ring-blue-500/20 px-3 text-sm">
                    <option value="private">Private (Lobby)</option>
                    <option value="open">Open (Instant Join)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Limit</Label>
                  <Input type="number" defaultValue="50" className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-blue-500/20" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="n" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Agenda / Notes</Label>
                <Textarea id="n" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What's on the agenda?" className="bg-card/40 border-glass-border rounded-xl focus:ring-blue-500/20 min-h-[100px]" />
              </div>
              <Button onClick={add} className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-glow rounded-xl font-bold mt-2">
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>

        {/* Right column: List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Upcoming Meetings
            </h2>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-card/60 px-3 py-1 rounded-full border border-glass-border">
              {items.length} Scheduled
            </span>
          </div>

          {items.length === 0 ? (
            <div className="dash-card p-12 text-center border-dashed">
              <div className="h-16 w-16 rounded-full bg-muted/20 grid place-items-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-lg">Your calendar is clear</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[240px] mx-auto">
                Schedule your next collaboration session to keep everyone aligned.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((m) => {
                const isExpanded = expandedId === m.id;
                const date = new Date(m.when);
                return (
                  <div key={m.id} className={`dash-card ${isExpanded ? 'ring-2 ring-blue-500/20' : ''}`}>
                    <div className="dash-card-accent accent-blue" />
                    <div 
                      className="dash-card-header"
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex flex-col items-center justify-center border border-blue-500/20 shrink-0">
                          <span className="text-[10px] font-bold text-blue-500 leading-none uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-bold text-blue-500 leading-none">{date.getDate()}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base truncate">{m.title}</h3>
                          <p className="text-xs text-muted-foreground">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ID: {m.meetingId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className={`h-8 w-8 rounded-lg grid place-items-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-blue-500/10 text-blue-500' : 'text-muted-foreground'}`}>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="dash-card-content border-t border-glass-border/50 pt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Meeting Details</h4>
                              <div className="space-y-2 text-sm text-foreground/80">
                                <div className="flex items-center gap-3"><Video className="h-4 w-4 text-blue-500" /> Platform: Velora Meet</div>
                                <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-blue-500" /> Duration: ~45 mins</div>
                              </div>
                            </div>
                            {m.notes && (
                              <div>
                                <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Agenda</h4>
                                <div className="p-3 rounded-xl bg-card/60 border border-glass-border text-sm text-foreground/80 flex items-start gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                  <p>{m.notes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Quick Actions</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                onClick={() => navigate({ to: "/meet/$meetingId", params: { meetingId: m.meetingId } })}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-10 border-0"
                              >
                                Join Now <ArrowRight className="h-4 w-4 ml-1.5" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="rounded-xl h-10 border-glass-border hover:bg-blue-500/5 hover:text-blue-500">
                                    <Calendar className="h-4 w-4 mr-2" /> Add to Calendar
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="glass border-glass-border">
                                  <DropdownMenuItem onClick={() => window.open(generateGoogleCalendarLink(m.title, m.when, m.notes, m.meetingId), "_blank")}>
                                    Google Calendar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => downloadICS(m.title, m.when, m.notes, m.meetingId)}>
                                    Download .ics file
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button variant="outline" onClick={() => copyLink(m.meetingId)} className="rounded-xl h-10 border-glass-border hover:bg-blue-500/5 hover:text-blue-500">
                                <Copy className="h-4 w-4 mr-2" /> Invite
                              </Button>
                              <Button 
                                variant="ghost" 
                                onClick={() => remove(m.id)} 
                                className="rounded-xl h-10 text-destructive hover:bg-destructive/10 col-span-2"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Cancel Meeting
                              </Button>
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
      </div>
    </DashboardShell>
  );
}