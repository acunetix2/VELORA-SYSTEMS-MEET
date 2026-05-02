import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Copy, Plus, Trash2, ChevronDown, Clock, Video, FileText, ArrowRight, Users, Loader2, Timer, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateMeetingId } from "@/lib/meeting";
import { toast } from "sonner";
import { generateGoogleCalendarLink, downloadICS } from "@/lib/calendar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { format, setHours, setMinutes, parseISO, addMinutes, isAfter, isBefore, subMinutes } from "date-fns";
import { Bell, CheckCircle, AlertTriangle } from "lucide-react";

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

type Scheduled = { 
  id: string; 
  meetingId: string; 
  title: string; 
  when: string; 
  notes: string;
  duration?: number;
  capacity?: number;
  previewImageUrl?: string | null;
};
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [capacity, setCapacity] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        notes: d.notes,
        duration: d.duration || 60,
        capacity: d.capacity,
        previewImageUrl: d.preview_image_url
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  // Notification Logic
  useEffect(() => {
    if (items.length === 0) return;

    const checkMeetings = () => {
      const now = new Date();
      items.forEach(m => {
        const startTime = new Date(m.when);
        const fiveMinsBefore = subMinutes(startTime, 5);
        
        // Notify if meeting starts in 5 minutes
        if (isAfter(now, fiveMinsBefore) && isBefore(now, startTime)) {
          const key = `notif:${m.id}`;
          if (!localStorage.getItem(key)) {
            toast(`Meeting "${m.title}" is starting in 5 minutes!`, {
              icon: <Bell className="h-4 w-4 text-primary" />,
              action: {
                label: "Join Now",
                onClick: () => navigate({ to: "/meet/$meetingId", params: { meetingId: m.meetingId } })
              }
            });
            localStorage.setItem(key, "true");
          }
        }
      });
    };

    const interval = setInterval(checkMeetings, 30000); // Check every 30s
    checkMeetings(); // Initial check
    return () => clearInterval(interval);
  }, [items]);

  const add = async () => {
    if (!title.trim() || !selectedDate) { toast.error("Title and date required"); return; }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Combine date and time
    const [h, m] = selectedTime.split(":").map(Number);
    const finalDate = setHours(setMinutes(selectedDate, m), h);

    const mid = generateMeetingId();
    const { data, error } = await supabase
      .from("scheduled_meetings" as any)
      .insert({
        user_id: user.id,
        meeting_id: mid,
        title: title.trim(),
        scheduled_for: finalDate.toISOString(),
        notes: notes.trim(),
        capacity: capacity,
        preview_image_url: previewUrl,
        duration: parseInt(duration, 10)
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
      notes: data.notes,
      capacity: data.capacity,
      previewImageUrl: data.preview_image_url,
      duration: data.duration
    }, ...items]);
    
    setTitle(""); 
    setNotes(""); 
    setPreviewUrl(null); 
    setCapacity(10);
    toast.success("Meeting scheduled");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("meeting-previews")
      .upload(path, file);

    if (error) {
      toast.error("Failed to upload image");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("meeting-previews").getPublicUrl(path);
    setPreviewUrl(publicUrl);
    setUploading(false);
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
                <Label htmlFor="t" className="text-[11px] text-muted-foreground font-bold ml-1">Meeting title</Label>
                <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project Sync" className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-bold ml-1">Meeting Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-12 justify-start text-left font-normal rounded-xl bg-card/40 border-glass-border hover:bg-primary/5 hover:text-primary transition-all",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass border-glass-border" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-bold ml-1">Start Time</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-primary/20">
                      <Clock className="mr-2 h-4 w-4 text-primary" />
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="glass border-glass-border max-h-[300px]">
                      {Array.from({ length: 24 * 4 }).map((_, i) => {
                        const h = Math.floor(i / 4);
                        const m = (i % 4) * 15;
                        const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                        const display = format(setHours(setMinutes(new Date(), m), h), "hh:mm aa");
                        return <SelectItem key={time} value={time}>{display}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-bold ml-1">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-primary/20">
                      <Timer className="mr-2 h-4 w-4 text-primary" />
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent className="glass border-glass-border">
                      <SelectItem value="15">15 Minutes</SelectItem>
                      <SelectItem value="30">30 Minutes</SelectItem>
                      <SelectItem value="45">45 Minutes</SelectItem>
                      <SelectItem value="60">1 Hour</SelectItem>
                      <SelectItem value="90">1.5 Hours</SelectItem>
                      <SelectItem value="120">2 Hours</SelectItem>
                      <SelectItem value="180">3 Hours</SelectItem>
                      <SelectItem value="240">4 Hours</SelectItem>
                      <SelectItem value="300">5 Hours</SelectItem>
                      <SelectItem value="360">6 Hours</SelectItem>
                      <SelectItem value="420">7 Hours</SelectItem>
                      <SelectItem value="480">8 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-bold ml-1">Security</Label>
                  <Select defaultValue="private">
                    <SelectTrigger className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-primary/20">
                      <Shield className="mr-2 h-4 w-4 text-primary" />
                      <SelectValue placeholder="Privacy" />
                    </SelectTrigger>
                    <SelectContent className="glass border-glass-border">
                      <SelectItem value="private">Private (Lobby)</SelectItem>
                      <SelectItem value="open">Open (Instant Join)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[11px] text-muted-foreground font-bold">Number of Participants</Label>
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{capacity} people</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={capacity}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) {
                        if (val > 100) { 
                          toast.success("Limit Reached", {
                            description: (
                              <div className="flex flex-col gap-2">
                                <p className="text-foreground">Upgrade to host more than <span className="text-destructive font-black">100</span> participants.</p>
                                <Button size="sm" className="w-fit bg-primary text-primary-foreground font-bold rounded-lg" onClick={() => navigate({ to: "/dashboard/upgrade" as any })}>Upgrade Now</Button>
                              </div>
                            ),
                            duration: 5000,
                            className: "bg-green-500/10 border-green-500/20"
                          });
                          setCapacity(100); 
                        }
                        else setCapacity(val);
                      }
                    }}
                    className="flex-1 h-12 bg-card/40 border border-glass-border rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex flex-col gap-1">
                    {[5,10,25,50].map(n => (
                      <button key={n} type="button" onClick={() => setCapacity(n)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                          capacity === n ? 'bg-primary text-primary-foreground' : 'bg-card/60 border border-glass-border text-muted-foreground hover:text-primary hover:border-primary/40'
                        }`}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-[11px] text-muted-foreground font-bold">Participant Capacity</Label>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{capacity} Guests</span>
                  </div>
                  <div className="relative pt-2">
                    <input 
                      type="range" 
                      min="2" 
                      max="1000" 
                      value={capacity} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val > 100) {
                          toast.success("Limit Reached", {
                            description: (
                              <div className="flex flex-col gap-2">
                                <p className="text-foreground">Upgrade to host more than <span className="text-destructive font-black">100</span> participants.</p>
                                <Button size="sm" className="w-fit bg-primary text-primary-foreground font-bold rounded-lg" onClick={() => navigate({ to: "/dashboard/upgrade" as any })}>Upgrade Now</Button>
                              </div>
                            ),
                            duration: 5000,
                            className: "bg-green-500/10 border-green-500/20"
                          });
                          setCapacity(100);
                        } else {
                          setCapacity(val);
                        }
                      }}
                      className="w-full h-2 bg-glass-border rounded-lg appearance-none cursor-pointer accent-primary shadow-sm" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-bold ml-1">Preview image</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="bg-card/40 border-glass-border h-12 rounded-xl file:hidden pt-3 text-xs" 
                    />
                    {uploading && <div className="absolute right-3 top-3"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>}
                  </div>
                  {previewUrl && (
                    <div className="h-12 w-12 rounded-xl overflow-hidden border border-glass-border shrink-0">
                      <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="n" className="text-[11px] text-muted-foreground font-bold ml-1">Agenda / notes</Label>
                <Textarea id="n" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What's on the agenda?" className="bg-card/40 border-glass-border rounded-xl focus:ring-blue-500/20 min-h-[100px]" />
              </div>
              <Button onClick={add} className="w-full h-14 bg-gradient-primary text-primary-foreground border-0 shadow-glow rounded-2xl font-black text-lg mt-4 transition-all hover:scale-[1.02] active:scale-[0.98]">
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
            <span className="text-xs font-bold text-muted-foreground bg-card/60 px-3 py-1 rounded-full border border-glass-border">
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
                const startDate = new Date(m.when);
                const endDate = addMinutes(startDate, (m as any).duration || 60);
                const now = new Date();
                
                const isPassed = isAfter(now, endDate);
                const isActive = isAfter(now, startDate) && isBefore(now, endDate);
                const isUpcoming = isBefore(now, startDate);

                return (
                  <div key={m.id} className={`dash-card ${isExpanded ? 'ring-2 ring-primary/20 shadow-brand' : ''} ${isPassed ? 'opacity-70 grayscale-[0.3] pointer-events-none cursor-not-allowed select-none' : ''}`}>
                    <div className={`dash-card-accent ${isPassed ? 'bg-muted' : isActive ? 'bg-brand-green' : 'bg-primary'}`} />
                    <div 
                      className="dash-card-header"
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`h-12 w-12 rounded-2xl flex flex-col items-center justify-center border shrink-0 ${
                          isPassed ? 'bg-muted/10 border-muted text-muted-foreground' : 
                          isActive ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 
                          'bg-primary/10 border-primary/20 text-primary'
                        }`}>
                          <span className="text-[10px] font-black leading-none uppercase">{format(startDate, 'MMM')}</span>
                          <span className="text-lg font-black leading-none">{format(startDate, 'dd')}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-base truncate">{m.title}</h3>
                            {isActive && <span className="flex h-2 w-2 rounded-full bg-brand-green animate-pulse" />}
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">
                            {format(startDate, 'hh:mm aa')} — {format(endDate, 'hh:mm aa')}
                            <span className="mx-2 opacity-30">|</span>
                            {isPassed ? <span className="text-destructive font-bold uppercase tracking-wider">Expired / Ended</span> : isActive ? "Active now" : "Upcoming"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isPassed ? (
                          <CheckCircle className="h-5 w-5 text-muted-foreground/40" />
                        ) : isActive ? (
                          <div className="px-2.5 py-1 rounded-full bg-brand-green/20 text-brand-green text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-500">
                            Live
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                            {format(startDate, 'HH:mm')}
                          </div>
                        )}
                        <button className={`h-8 w-8 rounded-lg grid place-items-center transition-all duration-300 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="dash-card-content border-t border-glass-border/50 pt-6 bg-gradient-to-b from-muted/5 to-transparent">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-5">
                            {m.previewImageUrl && (
                              <div className="mb-6 rounded-2xl overflow-hidden border border-glass-border shadow-brand h-40 group/img relative">
                                <img src={m.previewImageUrl} alt="Meeting preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                  <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-80">Session Visual</span>
                                </div>
                              </div>
                            )}
                            <div>
                              <h4 className="text-[10px] tracking-[0.2em] font-black text-muted-foreground uppercase mb-3">Session intelligence</h4>
                              <div className="space-y-3 text-sm font-medium">
                                <div className="flex items-center gap-3 text-foreground/80"><Video className="h-4 w-4 text-primary" /> Platform: Velora Enterprise</div>
                                <div className="flex items-center gap-3 text-foreground/80"><Clock className="h-4 w-4 text-primary" /> Duration: {(m as any).duration} minutes</div>
                                <div className="flex items-center gap-3 text-foreground/80"><Users className="h-4 w-4 text-primary" /> Capacity: {(m as any).capacity || 100} members</div>
                              </div>
                            </div>
                            {m.notes && (
                              <div>
                                <h4 className="text-[10px] tracking-[0.2em] font-black text-muted-foreground uppercase mb-3">Agenda</h4>
                                <div className="p-4 rounded-2xl bg-card/60 border border-glass-border text-sm text-foreground/80 leading-relaxed shadow-sm">
                                  <p>{m.notes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-6">
                            <h4 className="text-[10px] tracking-[0.2em] font-black text-muted-foreground uppercase">Management Console</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <Button 
                                onClick={() => navigate({ to: "/meet/$meetingId", params: { meetingId: m.meetingId } })}
                                disabled={isPassed}
                                className={`h-12 rounded-xl border-0 font-black text-sm shadow-glow ${isPassed ? 'bg-muted text-muted-foreground' : 'bg-gradient-primary text-primary-foreground'}`}
                              >
                                {isPassed ? "Meeting Ended" : "Enter Room"} <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                              <Button variant="outline" onClick={() => copyLink(m.meetingId)} className="rounded-xl h-12 border-glass-border hover:bg-primary/5 hover:text-primary font-bold">
                                <Copy className="h-4 w-4 mr-2" /> Invite Team
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="rounded-xl h-12 border-glass-border hover:bg-primary/5 hover:text-primary w-full font-bold">
                                    <Calendar className="h-4 w-4 mr-2" /> Calendar Sync
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="glass border-glass-border p-2 min-w-[180px]">
                                  <DropdownMenuItem className="rounded-lg h-10 px-3 font-medium" onClick={() => window.open(generateGoogleCalendarLink(m.title, m.when, m.notes, m.meetingId), "_blank")}>
                                    Google Calendar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-lg h-10 px-3 font-medium" onClick={() => downloadICS(m.title, m.when, m.notes, m.meetingId)}>
                                    Download (.ics)
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button 
                                variant="ghost" 
                                onClick={() => remove(m.id)} 
                                className="rounded-xl h-12 text-destructive hover:bg-destructive/10 font-bold"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Cancel
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