import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, Video, Calendar as CalendarIcon, Clock, GraduationCap, 
  Settings, ArrowLeft, Plus, Mail, Shield, 
  FileText, CheckCircle2, ChevronRight,
  MoreVertical, Search, Copy, UserPlus, Loader2,
  Trash2, File as FileIcon, Image as ImageIcon, PlayCircle,
  BarChart2, Sparkles, BrainCircuit, Zap, MessageSquare, Info, ArrowRight,
  RefreshCcw, Globe, BookOpen, ClipboardList, PenTool, Layout, Eye,
  Trophy, AlertCircle, CalendarDays, Filter, CalendarSearch, Paperclip, X,
  Upload, Download
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { generateMeetingId } from "@/lib/meeting";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/Loader";
import { ClassShell } from "@/components/dashboard/ClassShell";
import { cn } from "@/lib/utils";

function ClassDetailComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/classroom/$slug/class")({
  head: () => ({ meta: [{ title: "Class Hub — Velora" }] }),
  component: ClassDetailComponent,
});

function Page() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [tab, setTab] = useState<"dashboard" | "students" | "sessions" | "resources" | "assignments">("dashboard");
  const [cls, setCls] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editBanner, setEditBanner] = useState<string | null>(null);
  const [isUpdatingClass, setIsUpdatingClass] = useState(false);
  
  const [stats, setStats] = useState({
    membersCount: 0,
    commentsCount: 0,
    resourcesCount: 0,
    attendanceRate: 0,
    resourceRate: 0
  });
  
  useEffect(() => {
    fetchClass();
  }, [slug]);

  const fetchClass = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      let { data } = await supabase.from("classrooms").select("*").eq("slug", slug).maybeSingle();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (!data && isUuid) {
        const res = await supabase.from("classrooms").select("*").eq("id", slug).maybeSingle();
        data = res.data;
      }

      if (!data) {
        toast.error("Classroom not found.");
        setTimeout(() => navigate({ to: "/dashboard/classroom" }), 2000);
        return;
      }
      
      setCls(data);
      setIsHost(data.user_id === user?.id);
      setEditName(data.name);
      setEditDesc(data.description || "");
      setEditBanner(data.preview_image_url);
      
      const [membersRes, commentsRes, resourcesRes] = await Promise.all([
        supabase.from("classroom_members").select("id, user_id", { count: "exact" }).eq("classroom_id", data.id),
        supabase.from("classroom_comments").select("author_id").eq("classroom_id", data.id),
        supabase.from("classroom_resources").select("id", { count: "exact", head: true }).eq("classroom_id", data.id)
      ]);

      const membersCount = membersRes.count || 1;
      const commentsCount = commentsRes.data?.length || 0;
      const resourcesCount = resourcesRes.count || 0;

      const uniqueCommenters = new Set(commentsRes.data?.map(c => c.author_id)).size;
      const attendanceRate = membersCount > 0 ? Math.round((uniqueCommenters / membersCount) * 100) : 0;
      const resourceRate = membersCount > 0 ? Math.min(100, Math.round(((commentsCount / membersCount) / 2) * 100)) : 0;

      setStats({ membersCount, commentsCount, resourcesCount, attendanceRate: attendanceRate || 0, resourceRate: resourceRate || 0 });
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const updateClass = async () => {
    if (!editName.trim() || !cls) return;
    setIsUpdatingClass(true);
    const { error } = await supabase.from("classrooms").update({
      name: editName,
      description: editDesc,
      preview_image_url: editBanner
    }).eq("id", cls.id);

    if (error) toast.error("Failed to update classroom.");
    else {
      toast.success("Classroom updated.");
      setIsEditingClass(false);
      fetchClass();
    }
    setIsUpdatingClass(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsUpdatingClass(true);
    const path = `${currentUser.id}/banner_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("meeting-previews").upload(path, file);
    if (error) toast.error("Banner upload failed.");
    else {
      const { data: { publicUrl } } = supabase.storage.from("meeting-previews").getPublicUrl(path);
      setEditBanner(publicUrl);
      toast.success("Banner uploaded.");
    }
    setIsUpdatingClass(false);
  };

  const generateAiSummary = async () => {
    if (!cls) return;
    setIsAiLoading(true);
    setIsAiOpen(true);
    try {
      const { data: comments } = await supabase
        .from("classroom_comments")
        .select("comment")
        .eq("classroom_id", cls.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const context = comments?.map(c => c.comment).join("\n") || "No recent discussion.";
      const prompt = `Generate a professional classroom summary for "${cls.name}".
Description: ${cls.description || "N/A"}
Recent discussion context: ${context}
Please include:
1. Current focus
2. Activity summary
3. Student sentiment
4. Instructor tips
Avoid raw markdown like ### or **. Use clear section names and list points with -.`;

      const { data, error } = await supabase.functions.invoke("velora-ai", {
        body: { 
          messages: [
            { role: "system", content: "You are the Velora Classroom AI assistant. Provide structured, professional summaries WITHOUT raw markdown symbols like # or *." },
            { role: "user", content: prompt }
          ] 
        }
      });

      if (error) throw error;
      if (data && data.choices?.[0]?.message?.content) {
        setAiSummary(data.choices[0].message.content);
      } else {
        throw new Error("Invalid response from AI");
      }
    } catch (err) {
      console.error(err);
      toast.error("Velora AI unavailable.");
      setAiSummary("Unable to generate summary at this time.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const copyId = () => {
    const code = cls?.join_code || cls?.id;
    navigator.clipboard.writeText(code);
    toast.success(`Class code ${code} copied.`);
  };

  const startInstantMeeting = async () => {
    if (!cls) return;
    const mid = cls.meeting_id || generateMeetingId();
    if (isHost && !cls.meeting_id) {
      await supabase.from("classrooms").update({ meeting_id: mid }).eq("id", cls.id);
    }
    window.open(`/meet/${mid}`, "_blank");
  };

  const renderAiContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim().replace(/^[\#\*\-\s]+/, "").replace(/[\*\_]+/g, "");
      if (!trimmed) return null;
      const isHeading = idx === 0 || (line.length < 50 && !line.includes(".") && !line.startsWith("-"));
      if (isHeading) {
        return <h4 key={idx} className="text-[12px] font-bold text-primary mt-4 mb-1 uppercase tracking-wider">{trimmed}</h4>;
      }
      if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
        return (
          <div key={idx} className="flex gap-2 items-start mt-1.5 ml-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0 mt-1.5" />
            <p className="text-[13px] text-foreground/80 font-medium leading-relaxed">{trimmed}</p>
          </div>
        );
      }
      return <p key={idx} className="text-[13px] text-foreground/80 font-medium leading-relaxed mt-2">{trimmed}</p>;
    });
  };

  if (loading) return <div className="h-screen grid place-items-center"><Loader label="Opening classroom..." /></div>;  return (
    <>
      <ClassShell 
        title={cls?.name || "Classroom"} 
        className={cls?.name}
        activeTab={tab as any}
        onTabChange={(id) => setTab(id as any)}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateAiSummary} className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 h-9 px-3 text-[11px] font-bold">
              <Sparkles className="h-3.5 w-3.5 mr-2" /> {isAiLoading ? "Analyzing..." : "AI Assist"}
            </Button>
            <Button onClick={startInstantMeeting} size="sm" className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-9 px-4 shadow-glow text-[11px] font-bold">
              <Video className="h-3.5 w-3.5" /> {isHost ? "Start session" : "Join live"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col min-h-full bg-background/50">
          <div className={`relative h-48 sm:h-64 overflow-hidden shadow-sm bg-gradient-to-r ${cls?.preview_image_url ? '' : (cls?.id ? (cls.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 2 === 0 ? 'from-indigo-600 to-blue-500' : 'from-teal-600 to-emerald-500') : 'from-blue-600 to-blue-400')}`}>
             {cls?.preview_image_url && <img src={cls.preview_image_url} alt="Class banner" className="absolute inset-0 w-full h-full object-cover" />}
             <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
             <div className="absolute inset-0 p-6 sm:p-12 flex flex-col justify-end text-white max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold border border-white/20">
                        {isHost ? "Teaching" : "Enrolled"}
                      </span>
                      {isHost && (
                        <Button onClick={copyId} variant="ghost" className="h-7 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold border border-white/10">
                          <Copy className="h-3 w-3 mr-2" /> 
                          {cls?.join_code ? `Code: ${cls.join_code}` : 'Copy ID'}
                        </Button>
                      )}
                   </div>
                   {isHost && (
                    <Button onClick={() => setIsEditingClass(true)} variant="velora-cancel" size="micro">
                      <Settings className="h-3 w-3 mr-2" /> Edit class
                    </Button>
                   )}
                </div>
                <h1 className="text-3xl sm:text-5xl font-bold drop-shadow-xl mb-2 tracking-tight">{cls?.name}</h1>
                <p className="text-white/90 text-sm sm:text-base font-medium drop-shadow-md line-clamp-1 max-w-2xl">{cls?.description || "Welcome to your virtual learning workspace."}</p>
             </div>
          </div>
  
          <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-[1fr_300px] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-8">
                <div className="bg-card border border-glass-border rounded-[2rem] overflow-hidden shadow-sm min-h-[400px]">
                  {cls && (
                    <>
                      {tab === "dashboard" && <ClassDashboard classId={cls.id} isHost={isHost} onGenerateGuide={generateAiSummary} isGenerating={isAiLoading} />}
                      {tab === "students" && <StudentList classId={cls.id} isHost={isHost} />}
                      {tab === "sessions" && <SessionHistory classId={cls.id} isHost={isHost} meetingId={cls.meeting_id} />}
                      {tab === "resources" && <ResourceLibrary classId={cls.id} isHost={isHost} currentUser={currentUser} />}
                      {tab === "assignments" && <AssignmentSection classId={cls.id} isHost={isHost} currentUser={currentUser} />}
                    </>
                  )}
                </div>
                {cls && tab === "dashboard" && <CommentSection classId={cls.id} currentUser={currentUser} />}
              </div>
  
              <aside className="space-y-6">
                <div className="bg-card border border-glass-border rounded-[2rem] p-6 relative overflow-hidden group shadow-sm flex flex-col min-h-[120px]">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-[11px] font-bold text-primary flex items-center gap-2 tracking-tight"><Sparkles className="h-3.5 w-3.5" /> AI Assist</h3>
                     {isAiLoading && <RefreshCcw className="h-3 w-3 animate-spin text-primary/50" />}
                   </div>
                   
                   {isAiLoading ? (
                     <div className="flex-1 flex flex-col items-center justify-center py-4 animate-pulse">
                       <div className="h-8 w-8 rounded-xl bg-primary/10 grid place-items-center mb-3">
                         <BrainCircuit className="h-5 w-5 text-primary" />
                       </div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Analyzing activity...</p>
                     </div>
                   ) : aiSummary ? (
                     <div className="flex-1 flex flex-col">
                       <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-1 mb-4">
                          {renderAiContent(aiSummary)}
                       </div>
                       <Button onClick={generateAiSummary} variant="ghost" className="h-8 w-full rounded-xl bg-primary/5 text-primary text-[10px] font-bold hover:bg-primary/10">
                         Regenerate insight
                       </Button>
                     </div>
                   ) : (
                     <div className="flex-1 flex flex-col justify-center">
                       <p className="text-[13px] leading-relaxed text-foreground/80 mb-4 font-medium italic">
                         Generate an intelligent, scrollable overview of your class interactions.
                       </p>
                       <Button onClick={generateAiSummary} className="w-full h-10 rounded-xl bg-primary text-white font-bold text-[11px] shadow-glow">
                         Generate insight <ArrowRight className="h-3 w-3 ml-1" />
                       </Button>
                     </div>
                   )}
                </div>
  
                <div className="bg-card border border-glass-border rounded-[2rem] p-6 shadow-sm">
                   <h3 className="text-[11px] font-bold text-muted-foreground mb-4 flex items-center justify-between tracking-tight">Upcoming <Info className="h-3 w-3" /></h3>
                   <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="h-9 w-9 rounded-xl bg-muted/50 grid place-items-center shrink-0"><CalendarSearch className="h-4 w-4 text-muted-foreground" /></div>
                        <div><p className="text-[13px] font-bold">Next session</p><p className="text-[11px] text-muted-foreground">Check your calendar</p></div>
                      </div>
                   </div>
                   <Button asChild className="w-full mt-6 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-[11px] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                     <Link to="/dashboard/schedule"><CalendarSearch className="h-3.5 w-3.5 mr-2" /> Open calendar</Link>
                   </Button>
                </div>
  
                <div className="bg-card border border-glass-border rounded-[2rem] p-6">
                   <h3 className="text-[11px] font-bold text-muted-foreground mb-4 tracking-tight">Engagement</h3>
                   <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1.5 tracking-tight"><span>Active participants</span><span className="text-primary">{stats.attendanceRate}%</span></div>
                        <div className="h-1 bg-muted/30 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${stats.attendanceRate}%` }} /></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1.5 tracking-tight"><span>Discussion volume</span><span className="text-amber-500">{stats.resourceRate}%</span></div>
                        <div className="h-1 bg-muted/30 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${stats.resourceRate}%` }} /></div>
                      </div>
                   </div>
                   <div className="mt-6 pt-4 border-t border-glass-border flex justify-between items-center text-[10px] font-bold text-muted-foreground/60">
                     <span>Size: {stats.membersCount}</span><span>Activity: {stats.commentsCount}</span>
                   </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </ClassShell>
  
      <Dialog open={isEditingClass} onOpenChange={setIsEditingClass}>
        <DialogContent className="glass border-glass-border rounded-[2.5rem] p-8 max-w-md shadow-2xl">
          <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Edit classroom</DialogTitle>
          <DialogDescription className="font-medium text-foreground/80">Update your class branding and information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-widest font-black ml-1 text-foreground/90">Banner image</Label>
            <div className="flex gap-4">
              <div className="h-16 w-24 rounded-xl border border-glass-border overflow-hidden bg-muted/20 shrink-0">
                {editBanner ? <img src={editBanner} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-muted-foreground"><ImageIcon className="h-6 w-6" /></div>}
              </div>
              <input id="edit-banner-upload" type="file" onChange={handleBannerUpload} className="hidden" accept="image/*" />
              <Button variant="outline" onClick={() => document.getElementById('edit-banner-upload')?.click()} className="flex-1 bg-card/40 h-16 rounded-xl border-glass-border hover:bg-card/60 text-xs font-bold transition-all">
                {isUpdatingClass ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ImageIcon className="h-5 w-5 mr-2" />}
                {isUpdatingClass ? "Uploading..." : "Choose image"}
              </Button>
            </div>
            </div>
            <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-widest font-black ml-1 text-foreground/90">Class name</Label>
            <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Advanced Mathematics" className="bg-card/40 h-12 rounded-xl text-foreground font-medium" />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-widest font-black ml-1 text-foreground/90">Description</Label>
            <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Describe your class..." className="bg-card/40 min-h-[100px] rounded-xl resize-none text-foreground font-medium" />
          </div>
          </div>
        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button onClick={() => setIsEditingClass(false)} variant="velora-cancel" size="thin">Cancel</Button>
          <Button onClick={updateClass} disabled={isUpdatingClass} variant="velora-save" size="thin">
            {isUpdatingClass ? <Loader2 className="animate-spin h-4 w-4" /> : "Save changes"}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClassDashboard({ classId, isHost, onGenerateGuide, isGenerating }: { classId: string; isHost: boolean; onGenerateGuide?: () => void; isGenerating?: boolean }) {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-[2rem] bg-muted/20 border border-glass-border hover:bg-muted/30 transition-all group">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 grid place-items-center mb-4 group-hover:scale-110 transition-transform"><Users className="h-5 w-5" /></div>
          <h3 className="text-[15px] font-bold mb-1">Collaborative environment</h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">Interact with your classmates and join live sessions with a single click.</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-muted/20 border border-glass-border hover:bg-muted/30 transition-all group">
          <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-500 grid place-items-center mb-4 group-hover:scale-110 transition-transform"><FileText className="h-5 w-5" /></div>
          <h3 className="text-[15px] font-bold mb-1">Knowledge library</h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">All class materials, recordings, and assignments are organized for easy access.</p>
        </div>
      </div>
      <div className="mt-8 p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex flex-col sm:flex-row items-center gap-6">
        <div className="h-16 w-16 rounded-[1.5rem] bg-white grid place-items-center shadow-lg shrink-0">
          <div className={`h-12 w-12 rounded-xl bg-primary text-white grid place-items-center ${isGenerating ? 'animate-pulse' : ''}`}>
            <BrainCircuit className="h-6 w-6" />
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-bold">Quick start guide</h3>
          <p className="text-sm text-muted-foreground font-medium">Get personalized AI guidance on how to master your classroom in seconds.</p>
        </div>
        <Button 
          onClick={onGenerateGuide} 
          disabled={isGenerating}
          className="rounded-xl h-10 px-6 bg-primary text-white font-bold text-[12px] shadow-glow"
        >
          {isGenerating ? "Analyzing..." : "AI Guide"}
        </Button>
      </div>
    </div>
  );
}

function StudentList({ classId, isHost }: { classId: string; isHost: boolean }) {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  useEffect(() => { fetchMembers(); }, [classId]);
  const fetchMembers = async () => {
    try {
      setLoading(true);
      // Join with profiles table to get names and photos
      const { data, error } = await supabase
        .from("classroom_members" as any)
        .select("*, user:profiles(*)")
        .eq("classroom_id", classId);
      
      if (error) throw error;
      if (data) setMembers(data);
    } catch (err) { 
      console.error("Fetch members error:", err); 
    } finally { 
      setLoading(false); 
    }
  };
  const inviteStudent = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const { error } = await supabase.from("classroom_members" as any).insert({ 
        classroom_id: classId, 
        email: inviteEmail.trim().toLowerCase(), 
        role: "student" 
      });
      
      if (error) {
        if (error.code === '23505') toast.error("Student is already enrolled.");
        else throw error;
      } else {
        toast.success("Student invited successfully.");
        setInviteEmail("");
        setIsInviting(false);
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add student. Please check the email.");
    }
  };
  const filtered = members.filter(m => (m.email?.toLowerCase() || "").includes(search.toLowerCase()) || (m.user?.display_name?.toLowerCase() || "").includes(search.toLowerCase()));
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="relative max-w-xs w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search students..." className="pl-9 h-11 rounded-2xl bg-card border-glass-border text-[13px]" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {isHost && <Button onClick={() => setIsInviting(true)} className="bg-primary text-white rounded-xl h-9 px-4 text-[12px] font-bold shadow-glow"><UserPlus className="h-4 w-4 mr-2" /> Add student</Button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-muted/5 rounded-[2rem] border border-dashed border-glass-border">
            <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No students enrolled yet.</p>
          </div>
        ) : (
          <div className="col-span-full space-y-2">
            {filtered.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2 px-4 rounded-xl border border-glass-border bg-card/30 hover:bg-card/50 transition-all group h-12">
                <Avatar 
                  name={m.user?.display_name || m.email} 
                  src={m.user?.avatar_url} 
                  size="sm" 
                  className="h-8 w-8 rounded-lg shadow-sm" 
                />
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 min-w-0">
                    <p className="text-[13px] font-bold truncate text-foreground/90">
                      {m.user?.display_name || m.email?.split("@")[0] || "Student"}
                    </p>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full w-fit",
                      m.role === 'host' ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground"
                    )}>
                      {m.role === "host" ? "Instructor" : "Student"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground hidden md:flex">
                    <span className="opacity-40">{m.email}</span>
                    <span className="opacity-30">Joined {new Date(m.joined_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isHost && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog open={isInviting} onOpenChange={setIsInviting}>
        <DialogContent className="glass border-glass-border rounded-[2rem] p-8 max-w-sm"><h2 className="text-xl font-bold mb-2">Enroll student</h2><p className="text-xs text-muted-foreground mb-6 font-medium">Add a student directly by their email address.</p><Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="student@university.com" className="bg-card/40 h-12 rounded-xl mb-6" /><div className="flex gap-3"><Button variant="ghost" onClick={() => setIsInviting(false)} className="flex-1 rounded-xl h-12 font-bold">Cancel</Button><Button onClick={inviteStudent} className="flex-1 bg-primary text-white rounded-xl h-12 font-bold shadow-glow">Enrol student</Button></div></DialogContent>
      </Dialog>
    </div>
  );
}

function SessionHistory({ classId, isHost, meetingId }: { classId: string; isHost: boolean; meetingId?: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchSessions(); }, [classId]);
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from("meeting_sessions" as any).select("*").eq("classroom_id", classId).order("created_at", { ascending: false });
      setSessions(data || []);
    } finally { setLoading(false); }
  };
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8"><h3 className="font-bold text-lg">Class stream</h3><Button variant="outline" className="h-8 px-4 rounded-xl text-[11px] font-bold border-glass-border">Refresh</Button></div>
      {loading ? <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : sessions.length === 0 ? (
        <div className="py-20 text-center bg-muted/10 rounded-[2rem] border border-dashed border-glass-border"><Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-sm text-muted-foreground font-medium">No sessions recorded yet.</p></div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-5 rounded-[1.5rem] border border-glass-border bg-card/40 hover:bg-card/60 transition-all"><div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Video className="h-5 w-5" /></div><div className="flex-1 min-w-0"><p className="font-bold text-[14px]">Live session #{s.id.slice(0, 4)}</p><div className="flex items-center gap-2 mt-0.5"><p className="text-[11px] text-muted-foreground font-bold">{new Date(s.created_at).toLocaleDateString()}</p><span className="h-1 w-1 rounded-full bg-muted-foreground" /><p className="text-[11px] text-muted-foreground font-bold">{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div></div><Button size="sm" className="h-8 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-[11px] px-4">View logs</Button></div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceLibrary({ classId, isHost, currentUser }: { classId: string; isHost: boolean; currentUser: any }) {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { fetchResources(); }, [classId]);
  const fetchResources = async () => {
    const { data } = await supabase.from("classroom_resources" as any).select("*").eq("classroom_id", classId).order("created_at", { ascending: false });
    setResources(data || []);
    setLoading(false);
  };
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploading(true);
    const path = `${currentUser.id}/${classId}/${Date.now()}_${file.name}`;
    await supabase.storage.from("classroom-resources").upload(path, file);
    const { data: { publicUrl } } = supabase.storage.from("classroom-resources").getPublicUrl(path);
    await supabase.from("classroom_resources" as any).insert({ classroom_id: classId, uploaded_by: currentUser.id, name: file.name, file_url: publicUrl, file_type: file.type, file_size: file.size });
    fetchResources();
    setUploading(false);
  };
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-bold text-lg">Knowledge hub</h3>
        {isHost && (
          <>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl font-bold text-[12px] h-9 px-5 bg-primary text-white shadow-glow">
              {uploading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              <span>Upload material</span>
            </Button>
          </>
        )}
      </div>
      <div className="grid gap-3">
        {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /> : resources.length === 0 ? (<p className="text-center py-10 text-muted-foreground italic font-medium">No materials shared yet.</p>) : resources.map(r => (
          <div key={r.id} className="flex items-center gap-4 p-4 rounded-[1.5rem] border border-glass-border bg-card/40 hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 grid place-items-center"><FileText className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0"><p className="font-bold text-[14px] truncate">{r.name}</p><p className="text-[10px] text-muted-foreground font-bold">{(r.file_size / 1024 / 1024).toFixed(2)} MB</p></div>
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"><a href={r.file_url} target="_blank" download><Download className="h-4 w-4" /></a></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignmentSection({ classId, isHost, currentUser }: { classId: string; isHost: boolean; currentUser: any }) {
  const { push } = useNotifications();
  const [activeTab, setActiveTab] = useState<"list" | "submissions" | "uploads">("list");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    type: "assignment",
    deadline: undefined as Date | undefined,
    points: 100
  });

  useEffect(() => { fetchAssignments(); }, [classId]);

  const fetchAssignments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("classroom_assignments" as any)
      .select("*, submissions:classroom_submissions(*)")
      .eq("classroom_id", classId)
      .order("created_at", { ascending: false });
    setAssignments(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsUploading(true);
    try {
      const path = `${currentUser.id}/assignment_attachments/${Date.now()}_${file.name}`;
      await supabase.storage.from("classroom-resources").upload(path, file);
      const { data: { publicUrl } } = supabase.storage.from("classroom-resources").getPublicUrl(path);
      setAttachment({ url: publicUrl, name: file.name });
      toast.success("Attachment added.");
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const createAssignment = async () => {
    if (!newAssignment.title.trim()) return;
    const { error } = await supabase.from("classroom_assignments" as any).insert({
      classroom_id: classId,
      title: newAssignment.title.trim(),
      description: newAssignment.description.trim(),
      type: newAssignment.type,
      deadline: newAssignment.deadline ? newAssignment.deadline.toISOString() : null,
      points: newAssignment.points,
      uploaded_by: currentUser.id,
      file_url: attachment?.url || "",
    });
    if (error) toast.error("Failed to create assignment.");
    else {
      await push({ title: "New Assignment", body: `Task "${newAssignment.title}" posted`, kind: "info" });
      toast.success("Assignment created!");
      setIsCreating(false);
      setAttachment(null);
      setNewAssignment({ title: "", description: "", type: "assignment", deadline: undefined, points: 100 });
      fetchAssignments();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 pb-0 border-b border-glass-border">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-2xl tracking-tight text-foreground">Assignments</h3>
            <p className="text-[11px] text-muted-foreground font-bold tracking-widest uppercase mt-1">Task management & grading</p>
          </div>
          {isHost && (
            <Button onClick={() => setIsCreating(true)} className="bg-primary text-white rounded-xl h-10 px-6 font-bold shadow-glow gap-2">
              <Plus className="h-4 w-4" /> Create task
            </Button>
          )}
        </div>
        
        <div className="flex gap-8">
          <button onClick={() => setActiveTab("list")} className={`pb-4 text-[12px] font-bold transition-all relative ${activeTab === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            Active tasks
            {activeTab === "list" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
          </button>
          {isHost && (
            <button onClick={() => setActiveTab("submissions")} className={`pb-4 text-[12px] font-bold transition-all relative ${activeTab === "submissions" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              Grading portal
              {activeTab === "submissions" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : activeTab === "list" ? (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="py-24 text-center bg-muted/5 rounded-[2.5rem] border border-dashed border-glass-border">
                <ClipboardList className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground font-medium">No tasks posted yet.</p>
              </div>
            ) : (
              assignments.map(item => (
                <AssignmentCard key={item.id} assignment={item} isHost={isHost} currentUser={currentUser} onUpdate={fetchAssignments} />
              ))
            )}
          </div>
        ) : (
          <GradingHub classId={classId} assignments={assignments} onUpdate={fetchAssignments} />
        )}
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="glass border-glass-border rounded-[2rem] p-6 max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
          <h2 className="text-xl font-black text-foreground mb-1">Create task</h2>
          <p className="text-[11px] text-foreground/70 mb-6 font-medium leading-relaxed">Define expectations, deadlines, and scoring criteria for your students.</p>
          
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-foreground ml-0.5">Task category</Label>
                <select 
                  className="w-full bg-card/60 h-10 rounded-xl border border-glass-border px-3 text-xs font-bold appearance-none outline-none focus:ring-2 ring-primary/20 text-foreground"
                  value={newAssignment.type}
                  onChange={e => setNewAssignment({...newAssignment, type: e.target.value})}
                >
                  <option value="assignment">Standard assignment</option>
                  <option value="cat">CAT (Test)</option>
                  <option value="quiz">Quiz</option>
                  <option value="material">Required reading</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-foreground ml-0.5">Max score</Label>
                <Input type="number" value={newAssignment.points} onChange={e => setNewAssignment({...newAssignment, points: parseInt(e.target.value)})} className="bg-card/60 h-10 rounded-xl text-xs font-bold text-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-wider text-foreground ml-0.5">Title</Label>
              <Input value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} placeholder="e.g. Data structures analysis" className="bg-card/60 h-10 rounded-xl text-xs font-bold text-foreground" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-wider text-foreground ml-0.5">Instructions</Label>
              <Textarea value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} placeholder="Outline the requirements..." className="bg-card/60 min-h-[80px] rounded-xl resize-none text-xs font-medium text-foreground p-3" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-wider text-foreground ml-0.5">Reference documents (optional)</Label>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
              {attachment ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-[11px] font-bold truncate text-primary">{attachment.name}</span>
                  </div>
                  <button onClick={() => setAttachment(null)} className="p-1 hover:bg-primary/10 rounded-full text-primary transition-colors"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <Button onClick={() => fileRef.current?.click()} disabled={isUploading} variant="outline" className="w-full h-10 rounded-xl border-dashed border-glass-border bg-muted/20 hover:bg-muted/30 text-[11px] font-bold gap-2 text-foreground transition-all">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  <span>Attach PDF or Word document</span>
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-wider text-foreground ml-0.5">Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full bg-card/60 h-10 rounded-xl pl-3 text-left text-xs font-bold border border-glass-border hover:bg-card/80 transition-all",
                      !newAssignment.deadline && "text-foreground/50"
                    )}
                  >
                    <CalendarDays className="mr-2 h-3.5 w-3.5 text-foreground/50" />
                    {newAssignment.deadline ? format(newAssignment.deadline, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 rounded-[2rem] border-glass-border glass shadow-2xl animate-in fade-in zoom-in-95 duration-200" align="start">
                  <Calendar
                    mode="single"
                    selected={newAssignment.deadline}
                    onSelect={(date) => setNewAssignment({ ...newAssignment, deadline: date })}
                    disabled={{ before: new Date() }}
                    initialFocus
                    className="rounded-[1.5rem] bg-transparent"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)} className="flex-1 rounded-xl h-10 text-[11px] font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border-none transition-colors">Cancel</Button>
              <Button onClick={createAssignment} disabled={!newAssignment.title.trim() || isUploading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-[11px] font-bold shadow-glow transition-all">Post task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignmentCard({ assignment, isHost, currentUser, onUpdate }: { assignment: any; isHost: boolean; currentUser: any; onUpdate: () => void }) {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  
  const studentSubmission = assignment.submissions?.find((s: any) => s.student_id === currentUser?.id);
  const isDeadlinePassed = assignment.deadline && new Date(assignment.deadline) < new Date();
  
  const handleSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploading(true);
    try {
      const path = `${currentUser.id}/submissions/${assignment.id}_${Date.now()}_${file.name}`;
      await supabase.storage.from("classroom-resources").upload(path, file);
      const { data: { publicUrl } } = supabase.storage.from("classroom-resources").getPublicUrl(path);
      
      const { error } = await supabase.from("classroom_submissions" as any).insert({
        assignment_id: assignment.id,
        student_id: currentUser.id,
        file_url: publicUrl,
        file_name: file.name,
        status: 'submitted'
      });
      
      if (error) throw error;
      toast.success("Assignment submitted!");
      setIsSubmitOpen(false);
      onUpdate();
    } catch (err) {
      console.error(err);
      toast.error("Submission failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="group relative bg-card/40 border border-glass-border rounded-[2rem] p-6 hover:bg-card/60 transition-all">
      <div className="flex items-start gap-6">
        <div className={`h-14 w-14 rounded-2xl grid place-items-center shrink-0 shadow-sm ${
          assignment.type === 'cat' ? 'bg-amber-500/10 text-amber-500' : 
          assignment.type === 'quiz' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-primary/10 text-primary'
        }`}>
          {assignment.type === 'cat' ? <Trophy className="h-7 w-7" /> : 
           assignment.type === 'quiz' ? <PenTool className="h-7 w-7" /> : <ClipboardList className="h-7 w-7" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="font-bold text-lg truncate text-foreground">{assignment.title}</h4>
            <span className="px-2.5 py-0.5 rounded-full bg-muted/50 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{assignment.type}</span>
            {studentSubmission && (
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                studentSubmission.status === 'graded' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
              }`}>
                {studentSubmission.status === 'graded' ? `Score: ${studentSubmission.grade}` : 'Work turned in'}
              </span>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 mb-4 font-medium">{assignment.description || "Refer to instructions."}</p>
          
          <div className="flex flex-wrap items-center gap-6">
            <div className={`flex items-center gap-2 text-[11px] font-bold ${isDeadlinePassed ? 'text-destructive' : 'text-muted-foreground/60'}`}>
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Deadline: {assignment.deadline ? format(new Date(assignment.deadline), "PPP") : 'Open ended'}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60">
              <Trophy className="h-3.5 w-3.5" />
              <span>{assignment.points} points max</span>
            </div>
            {isHost && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-primary">
                <Users className="h-3.5 w-3.5" />
                <span>{assignment.submissions?.length || 0} submissions</span>
              </div>
            )}
          </div>

          {assignment.file_url && (
            <div className="mt-4">
              <Button asChild variant="link" className="p-0 h-auto text-[11px] font-bold text-blue-500 gap-1.5 hover:no-underline">
                <a href={assignment.file_url} target="_blank">
                  <Paperclip className="h-3 w-3" /> View attachment
                </a>
              </Button>
            </div>
          )}
        </div>

        {!isHost && (
          <div className="shrink-0 flex flex-col items-end gap-3">
            {!studentSubmission ? (
              <Button onClick={() => setIsSubmitOpen(true)} disabled={isDeadlinePassed} className="bg-primary text-white rounded-xl h-10 px-6 font-bold shadow-glow text-[12px]">
                {isDeadlinePassed ? "Expired" : "Submit work"}
              </Button>
            ) : (
              <div className="text-right">
                <p className="text-[11px] font-bold text-green-500 mb-1 flex items-center gap-1 justify-end"><CheckCircle2 className="h-3.5 w-3.5" /> Handed in</p>
                <p className="text-[10px] text-muted-foreground font-bold">{new Date(studentSubmission.submitted_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="glass border-glass-border rounded-[2rem] p-8 max-w-sm text-center">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-[1.5rem] grid place-items-center mx-auto mb-6">
            <Upload className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">Turn in task</h2>
          <p className="text-xs text-muted-foreground mb-8 font-medium">Select your file to submit for <br /><span className="text-foreground font-bold">{assignment.title}</span></p>
          
          <input ref={fileRef} type="file" className="hidden" onChange={handleSubmit} />
          
          <div className="space-y-3">
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full bg-primary text-white rounded-xl h-12 font-bold shadow-glow">
              {uploading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              Choose file
            </Button>
            <Button variant="ghost" onClick={() => setIsSubmitOpen(false)} className="w-full rounded-xl h-12 font-bold text-muted-foreground">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GradingHub({ classId, assignments, onUpdate }: { classId: string; assignments: any[]; onUpdate: () => void }) {
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<any>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions();
      fetchRoster();
    }
    else {
      setSubmissions([]);
      setMembers([]);
    }
  }, [selectedAssignment]);

  const fetchRoster = async () => {
    const { data } = await supabase.from("classroom_members").select("*, user:profiles(*)").eq("classroom_id", classId);
    setMembers(data || []);
  };

  const downloadGradebook = () => {
    if (!selectedAssignment || members.length === 0) return;
    
    // Create CSV header
    let csv = "Student Name,Email,Status,Grade,Submitted At\n";
    
    members.forEach(m => {
      const sub = submissions.find(s => s.student_id === m.user_id);
      const name = m.user?.display_name || m.email?.split('@')[0] || "Student";
      const email = m.email || "N/A";
      const status = sub ? sub.status : "Pending";
      const score = sub?.grade || "0";
      const date = sub ? new Date(sub.submitted_at).toLocaleDateString() : "-";
      
      csv += `"${name}","${email}","${status}","${score}","${date}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedAssignment.title}_Gradebook.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Gradebook downloaded.");
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("classroom_submissions" as any)
      .select("*, student:profiles(*)")
      .eq("assignment_id", selectedAssignment.id)
      .order("submitted_at", { ascending: false });
    
    if (error) console.error("GradingHub fetch error:", error);
    setSubmissions(data || []);
    setLoading(false);
  };

  const submitGrade = async () => {
    if (!activeSubmission || !grade) return;
    const { error } = await supabase.from("classroom_submissions" as any).update({
      grade,
      feedback,
      status: 'graded'
    }).eq("id", activeSubmission.id);
    
    if (error) toast.error("Grading failed.");
    else {
      toast.success("Score published!");
      setIsGrading(false);
      fetchSubmissions();
      onUpdate();
    }
  };

  if (!selectedAssignment) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-6 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <p className="text-[12px] font-bold uppercase tracking-wider">Review submissions</p>
        </div>
        {assignments.map(a => (
          <button key={a.id} onClick={() => setSelectedAssignment(a)} className="w-full flex items-center justify-between p-6 rounded-[2rem] border border-glass-border bg-card/40 hover:bg-primary/5 hover:border-primary/20 transition-all text-left group">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted/50 text-muted-foreground grid place-items-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-[15px] text-foreground">{a.title}</p>
                <p className="text-[11px] text-muted-foreground font-bold uppercase">{a.type} • {a.submissions?.length || 0} handed in</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setSelectedAssignment(null)} className="rounded-full h-10 w-10"><ArrowLeft className="h-5 w-5 text-foreground" /></Button>
        <div className="flex-1">
          <h4 className="font-bold text-xl text-foreground">{selectedAssignment.title}</h4>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Grading management</p>
        </div>
        <Button onClick={downloadGradebook} variant="outline" className="h-9 rounded-xl px-4 text-[11px] font-bold border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
          <Download className="h-3.5 w-3.5 mr-2" /> Gradebook (.csv)
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : submissions.length === 0 ? (
          <div className="py-20 text-center bg-muted/5 rounded-[2.5rem] border border-dashed border-glass-border">
            <AlertCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground font-medium">No submissions yet.</p>
          </div>
        ) : (
          submissions.map(sub => (
            <div key={sub.id} className="flex flex-col gap-4 p-5 rounded-[2rem] border border-glass-border bg-card/40 hover:bg-card/60 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={sub.student?.display_name || "Student"} size="sm" />
                  <div>
                    <p className="font-bold text-[14px] text-foreground">{sub.student?.display_name || "Velora learner"}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">Received: {new Date(sub.submitted_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary text-foreground" title="Download">
                      <a href={sub.file_url} target="_blank"><Download className="h-4 w-4" /></a>
                    </Button>
                    {/* Support PDF and Images for preview */}
                    {(sub.file_url?.toLowerCase().match(/\.(pdf|png|jpg|jpeg|webp|gif|svg)/) || sub.file_name?.toLowerCase().match(/\.(pdf|png|jpg|jpeg|webp|gif|svg)/)) && (
                      <Button 
                        onClick={() => setActiveSubmission({...sub, type: 'preview'})} 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 text-foreground"
                        title="Quick View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button onClick={() => { setActiveSubmission(sub); setGrade(sub.grade || ""); setFeedback(sub.feedback || ""); setIsGrading(true); }} className={`h-9 rounded-xl px-4 font-bold text-[11px] transition-all ${sub.status === 'graded' ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20' : 'bg-primary text-white shadow-glow'}`}>
                    {sub.status === 'graded' ? `Score: ${sub.grade}` : 'Assign grade'}
                  </Button>
                </div>
              </div>

              {activeSubmission?.id === sub.id && activeSubmission.type === 'preview' && (
                <div className="w-full mt-2 rounded-[1.5rem] overflow-hidden border border-glass-border animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-muted/30 p-2 flex items-center justify-between border-b border-glass-border">
                    <span className="text-[10px] font-bold text-muted-foreground px-2 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="h-3 w-3" /> Document Preview
                    </span>
                    <Button onClick={() => setActiveSubmission(null)} variant="ghost" size="micro" className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="aspect-[4/3] w-full bg-white relative">
                    <iframe 
                      src={`${sub.file_url}#toolbar=0`} 
                      className="w-full h-full border-none"
                      title="Submission Preview"
                    />
                    <div className="absolute bottom-4 right-4">
                       <Button asChild variant="secondary" size="sm" className="rounded-xl font-bold text-[10px] h-8 shadow-2xl">
                         <a href={sub.file_url} target="_blank">Open Full <ArrowRight className="ml-1 h-3 w-3" /></a>
                       </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={isGrading} onOpenChange={setIsGrading}>
        <DialogContent className="glass border-glass-border rounded-[2.5rem] p-8 max-w-sm">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Assign score</h2>
          <p className="text-xs text-muted-foreground mb-8 font-medium">Evaluate work for <span className="text-foreground font-bold">{activeSubmission?.student?.display_name}</span>.</p>
          <div className="space-y-5">
             <div className="space-y-2">
               <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1 text-foreground">Score (out of {selectedAssignment?.points})</Label>
               <Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. 85" className="bg-card/40 h-12 rounded-xl text-foreground" />
             </div>
             <div className="space-y-2">
               <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1 text-foreground">Notes & feedback</Label>
               <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Provide constructive criticism..." className="bg-card/40 min-h-[120px] rounded-xl resize-none text-foreground" />
             </div>
             <div className="flex gap-3 pt-2">
               <Button variant="ghost" onClick={() => setIsGrading(false)} className="flex-1 rounded-xl h-12 font-bold text-red-500">Cancel</Button>
               <Button onClick={submitGrade} className="flex-1 bg-primary text-white rounded-xl h-12 font-bold shadow-glow">Return grade</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommentSection({ classId, currentUser }: { classId: string; currentUser: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  useEffect(() => { fetchComments(); }, [classId]);
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("classroom_comments" as any)
        .select("*, author:profiles!author_id(*)")
        .eq("classroom_id", classId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  };
  const post = async () => {
    if (!text.trim() || !currentUser) return;
    try {
      const { error } = await supabase
        .from("classroom_comments" as any)
        .insert({ 
          classroom_id: classId, 
          author_id: currentUser.id,
          student_id: currentUser.id, // Set both for maximum policy compatibility
          comment: text.trim() 
        });
      
      if (error) throw error;
      setText(""); 
      fetchComments();
    } catch (err) {
      console.error("Post comment error:", err);
      toast.error("Failed to send message.");
    }
  };
  return (
    <div className="bg-card border border-glass-border rounded-[2.5rem] p-8 shadow-sm text-foreground">
      <div className="flex items-center justify-between mb-8"><h3 className="font-bold text-xl tracking-tight flex items-center gap-2 text-foreground"><MessageSquare className="h-5 w-5 text-primary" /> Class stream</h3><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{comments.length} messages</span></div>
      <div className="space-y-6 max-h-[500px] overflow-y-auto mb-10 pr-4 custom-scrollbar text-foreground">
        {comments.length === 0 ? (<p className="text-center py-10 text-muted-foreground italic text-[13px] font-medium">Be the first to say something!</p>) : comments.map(c => (
          <div key={c.id} className="flex gap-4 group">
            <Avatar name={c.author?.display_name || "Class member"} size="sm" className="ring-2 ring-primary/5 group-hover:scale-105 transition-transform" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-bold text-foreground">{c.author?.display_name || "Class member"}</span>
                <span className="text-[10px] text-muted-foreground font-bold">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="p-4 rounded-2xl bg-muted/20 border border-glass-border/50 text-[14px] leading-relaxed font-medium text-foreground">{c.comment}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="relative"><Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="bg-muted/10 rounded-2xl h-12 pl-6 pr-20 border-glass-border focus:ring-primary/20 text-[13px] font-medium text-foreground" onKeyDown={e => e.key === "Enter" && post()} /><Button onClick={post} disabled={!text.trim()} className="absolute right-1.5 top-1.5 h-9 rounded-xl bg-primary text-white font-bold text-[11px] px-4 shadow-glow">Send</Button></div>
    </div>
  );
}
