import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, Video, Calendar, Clock, GraduationCap, 
  Settings, ArrowLeft, Plus, Mail, Shield, 
  FileText, CheckCircle2, ChevronRight,
  MoreVertical, Search, Copy, UserPlus, Loader2,
  Upload, Download, Trash2, File, Image, PlayCircle,
  BarChart2
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { generateMeetingId } from "@/lib/meeting";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/Loader";

function ClassDetailComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/classroom/$classId")({
  head: () => ({ meta: [{ title: "Class Details — Velora" }] }),
  component: ClassDetailComponent,
});

function Page() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"students" | "sessions" | "resources" | "assignments">("students");
  const [cls, setCls] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => { fetchClass(); }, [classId]);

  const fetchClass = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      const { data, error } = await supabase
        .from("classrooms" as any)
        .select("*")
        .eq("id", classId)
        .single();

      if (error) {
        toast.error("Failed to load classroom details");
        navigate({ to: "/dashboard/classroom" });
        return;
      }

      setCls(data);
      setIsHost(data.user_id === user.id);
    } catch (err) {
      console.error("Error fetching class:", err);
    } finally {
      setLoading(false);
    }
  };

  const startInstantMeeting = async () => {
    const mid = cls?.meeting_id || generateMeetingId();
    if (isHost) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("meeting_sessions" as any).insert({
          meeting_id: mid, host_id: user.id, classroom_id: classId,
          privacy: "private", capacity: 100,
        }).select().single();
        if (!cls?.meeting_id) {
          await supabase.from("classrooms" as any).update({ meeting_id: mid }).eq("id", classId);
        }
      }
    }
    toast.success("Joining class session...");
    navigate({ to: "/meet/$meetingId", params: { meetingId: mid }, search: { mode: "private", host: isHost ? 1 : 0 } });
  };

  const copyId = () => {
    navigator.clipboard.writeText(classId).then(() => toast.success("Class ID copied!"));
  };

  if (loading) return (
    <DashboardShell title="Loading Class...">
      <div className="h-[60vh] flex items-center justify-center">
        <Loader label="Synchronizing class data" />
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell title={cls?.name || "Classroom View"} actions={
      <div className="flex gap-2">
        {isHost && (
          <Button variant="outline" onClick={copyId} className="rounded-xl h-10 border-glass-border hidden sm:flex">
            <Copy className="h-4 w-4 mr-2" /> Copy Class ID
          </Button>
        )}
        <Button onClick={startInstantMeeting} className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-10 px-4 shadow-glow">
          <Video className="h-4 w-4" /> {isHost ? "Start Class Now" : "Join Live Room"}
        </Button>
      </div>
    }>
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <Button asChild variant="ghost" className="mb-6 rounded-xl hover:bg-muted/10">
          <Link to="/dashboard/classroom">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Classrooms
          </Link>
        </Button>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-6">
            {/* Hero */}
            <div className="glass rounded-[2rem] p-8 border-primary/15 bg-gradient-to-br from-primary/10 via-transparent to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary grid place-items-center">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] uppercase tracking-widest font-bold">Class Hub</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">{cls?.name}</h2>
                <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">{cls?.description || "No description provided."}</p>
                <div className="flex flex-wrap items-center gap-4 mt-8">
                  <div className="flex items-center gap-2 text-sm text-foreground/80 bg-background/40 backdrop-blur-md px-4 py-2 rounded-xl border border-glass-border">
                    <Users className="h-4 w-4 text-primary" /> Members Only
                  </div>
                  {isHost && (
                    <div className="flex items-center gap-2 text-sm text-foreground/80 bg-background/40 backdrop-blur-md px-4 py-2 rounded-xl border border-glass-border">
                      <Shield className="h-4 w-4 text-primary" /> Lecturer Access
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
              <div className="flex gap-1 bg-muted/20 p-1 rounded-2xl w-fit">
                {(["students", "sessions", "resources", "assignments"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize ${tab === t ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    {t === "students" ? (isHost ? "Students" : "Classmates") : t === "sessions" ? "Past sessions" : t === "resources" ? "Materials" : "Assignments"}
                  </button>
                ))}
              </div>

            <div className="glass rounded-[2rem] border-glass-border p-2 min-h-[400px]">
              {tab === "students" && <StudentList classId={classId} isHost={isHost} />}
              {tab === "sessions" && <SessionHistory classId={classId} isHost={isHost} meetingId={cls?.meeting_id} />}
              {tab === "resources" && <ResourceLibrary classId={classId} isHost={isHost} currentUser={currentUser} />}
              {tab === "assignments" && <AssignmentManager classId={classId} isHost={isHost} currentUser={currentUser} />}
            </div>
            
            <div className="mt-8">
              <CommentSection classId={classId} currentUser={currentUser} />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass rounded-3xl p-6 border-blue-500/20">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" /> Announcements
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-xs font-bold text-blue-500 uppercase">System</p>
                  <h4 className="font-bold text-sm mt-1">Welcome to Velora Classroom</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    Start meetings, share resources and manage your students in real-time.
                  </p>
                </div>
                {isHost && (
                  <Button className="w-full rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border-0 transition-all font-bold">
                    Post Announcement
                  </Button>
                )}
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="font-bold mb-4">Class Identity</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted/20 border border-glass-border">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Class ID</p>
                  <code className="text-xs font-mono break-all">{classId}</code>
                  {isHost && (
                    <Button onClick={copyId} variant="ghost" size="sm" className="w-full mt-3 h-8 text-[11px] font-bold rounded-lg border-glass-border hover:bg-primary/5">
                      <Copy className="h-3.5 w-3.5 mr-2" /> Copy ID
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ─── Student List ─── */
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
      const { data } = await supabase
        .from("classroom_members" as any)
        .select("*, user:profiles(*)")
        .eq("classroom_id", classId);
      if (data) setMembers(data);
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  const inviteStudent = async () => {
    if (!inviteEmail.trim()) return;
    const { error } = await supabase.from("classroom_members" as any).insert({
      classroom_id: classId, email: inviteEmail.trim(), role: "student"
    });
    if (error) {
      if (error.code === "23505") toast.info("User already in class.");
      else toast.error("Failed to invite.");
    } else {
      toast.success("Student added to class.");
      setInviteEmail(""); setIsInviting(false); fetchMembers();
    }
  };

  const removeStudent = async (memberId: string) => {
    if (!confirm("Remove this student from the class?")) return;
    const { error } = await supabase.from("classroom_members" as any).delete().eq("id", memberId);
    if (error) toast.error("Failed to remove student.");
    else { toast.success("Student removed."); fetchMembers(); }
  };

  const filtered = members.filter(m =>
    (m.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (m.user?.display_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." className="pl-9 h-10 rounded-xl bg-card/40 border-glass-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {isHost && (
            <Button onClick={() => window.print()} variant="outline" className="flex-1 sm:flex-none rounded-xl h-10 border-glass-border font-bold">
              <FileText className="h-4 w-4 mr-2" /> Print list
            </Button>
          )}
          {isHost && (
            <Button onClick={() => setIsInviting(true)} className="flex-1 sm:flex-none bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl h-10 border-0 font-bold">
              <Plus className="h-4 w-4 mr-2" /> Add student
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground italic">No members found.</div>
        ) : filtered.map(m => (
          <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/10 transition-colors group">
            <Avatar name={m.user?.display_name || m.email} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate">{m.user?.display_name || m.email.split("@")[0]}</p>
                {m.role === "ta" && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-black">T.A.</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
            </div>
            <div className="hidden sm:block text-right mr-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Status</p>
              <p className="text-xs font-semibold">{m.user ? "Registered" : "Invited"}</p>
            </div>
            {isHost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-glass-border">
                  <DropdownMenuSeparator className="bg-glass-border" />
                  <DropdownMenuItem className="rounded-lg text-destructive" onClick={() => removeStudent(m.id)}>
                    <Plus className="h-4 w-4 mr-2 rotate-45" /> Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      {isInviting && (
        <div className="fixed inset-0 z-[100] grid place-items-center px-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass rounded-3xl p-8 max-w-md w-full shadow-elegant border-primary/20">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><UserPlus className="h-6 w-6 text-primary" /> Add Student</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">Student Email</Label>
                <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="student@university.edu" className="bg-card/40 h-12 rounded-xl" />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setIsInviting(false)} className="flex-1 rounded-xl h-12">Cancel</Button>
                <Button onClick={inviteStudent} disabled={!inviteEmail} className="flex-1 bg-primary text-white rounded-xl h-12 shadow-glow">Add Student</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Session History ─── */
function SessionHistory({ classId, isHost, meetingId }: { classId: string; isHost: boolean; meetingId?: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSessions(); }, [classId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("meeting_sessions" as any)
        .select("*")
        .eq("classroom_id", classId)
        .order("created_at", { ascending: false });
      setSessions(data || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-lg">Session History</h3>
          <p className="text-xs text-muted-foreground">{sessions.length} recorded session{sessions.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : sessions.length === 0 ? (
        <div className="py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-muted/10 grid place-items-center mx-auto mb-4">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg">No sessions yet</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            {isHost ? "Start your first class session to see it appear here." : "No classes have been held yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-5 rounded-2xl border border-glass-border bg-card/40 hover:border-primary/30 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center group-hover:scale-110 transition-transform shrink-0">
                <Video className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base truncate">Class Session</h4>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(s.created_at)}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    s.status === "active" ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                  }`}>{s.status || "ended"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{s.meeting_id}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Users className="h-3 w-3" />
                  <span>{s.capacity ? `Cap: ${s.capacity}` : "—"}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  s.privacy === "private" ? "bg-amber-500/20 text-amber-500" : "bg-primary/20 text-primary"
                }`}>{s.privacy || "private"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Resource Library ─── */
function ResourceLibrary({ classId, isHost, currentUser }: { classId: string; isHost: boolean; currentUser: any }) {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchResources(); }, [classId]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("classroom_resources" as any)
        .select("*")
        .eq("classroom_id", classId)
        .order("created_at", { ascending: false });
      setResources(data || []);
    } catch (err) {
      console.error("Error fetching resources:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploading(true);
    toast.loading("Uploading file...", { id: "upload" });

    const path = `${currentUser.id}/${classId}/${Date.now()}_${file.name}`;
    const { data: storageData, error: storageErr } = await supabase.storage
      .from("classroom-resources")
      .upload(path, file, { upsert: true });

    if (storageErr) {
      toast.error("Upload failed: " + storageErr.message, { id: "upload" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("classroom-resources").getPublicUrl(path);

    const { error: dbErr } = await supabase.from("classroom_resources" as any).insert({
      classroom_id: classId,
      uploaded_by: currentUser.id,
      name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
    });

    if (dbErr) {
      toast.error("Failed to save resource record.", { id: "upload" });
    } else {
      toast.success("File uploaded successfully!", { id: "upload" });
      fetchResources();
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const deleteResource = async (res: any) => {
    if (!confirm("Delete this resource?")) return;
    const pathMatch = res.file_url?.split("/classroom-resources/")[1];
    if (pathMatch) {
      await supabase.storage.from("classroom-resources").remove([pathMatch]);
    }
    const { error } = await supabase.from("classroom_resources" as any).delete().eq("id", res.id);
    if (error) toast.error("Failed to delete resource.");
    else { toast.success("Resource deleted."); fetchResources(); }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (!type) return <FileText className="h-5 w-5" />;
    if (type.startsWith("image/")) return <Image className="h-5 w-5" />;
    if (type.startsWith("video/")) return <PlayCircle className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-lg">Materials Library</h3>
          <p className="text-xs text-muted-foreground">{resources.length} file{resources.length !== 1 ? "s" : ""} shared</p>
        </div>
        {isHost && (
          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept="*/*" />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl font-bold">
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload File
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : resources.length === 0 ? (
        <div className="py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-muted/10 grid place-items-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg">No materials yet</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            {isHost ? "Upload lecture notes, PDFs, or any files your students need." : "Your lecturer hasn't shared any materials yet."}
          </p>
          {isHost && (
            <Button onClick={() => fileRef.current?.click()} variant="outline" className="mt-6 rounded-xl border-primary/30 text-primary hover:bg-primary/5">
              <Upload className="h-4 w-4 mr-2" /> Upload First File
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {resources.map(r => (
            <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl border border-glass-border bg-card/40 hover:border-primary/30 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 group-hover:scale-110 transition-transform">
                {getFileIcon(r.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(r.file_size)} · {new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button asChild size="sm" variant="outline" className="rounded-xl h-9 border-glass-border font-bold">
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4 mr-1.5" /> Download
                  </a>
                </Button>
                {isHost && (
                  <Button size="sm" variant="ghost" className="rounded-xl h-9 text-destructive hover:text-destructive" onClick={() => deleteResource(r)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/* ─── Assignment Manager ─── */
function AssignmentManager({ classId, isHost, currentUser }: { classId: string; isHost: boolean; currentUser: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAssignments(); }, [classId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("classroom_assignments" as any)
        .select("*, student:profiles(*)")
        .eq("classroom_id", classId)
        .order("created_at", { ascending: false });
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploading(true);
    toast.loading("Uploading assignment...");

    const path = `assignments/${classId}/${currentUser.id}/${Date.now()}_${file.name}`;
    const { data: storageData, error: storageErr } = await supabase.storage
      .from("classroom-resources")
      .upload(path, file);

    if (storageErr) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("classroom-resources").getPublicUrl(path);

    await supabase.from("classroom_assignments" as any).insert({
      classroom_id: classId,
      student_id: currentUser.id,
      uploaded_by: currentUser.id,
      title: file.name,
      file_url: publicUrl
    });

    toast.success("Assignment uploaded", { id: "upload" });
    fetchAssignments();
    setUploading(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-lg">Assignments</h3>
          <p className="text-xs text-muted-foreground">{isHost ? "Student submissions" : "Your uploads"}</p>
        </div>
        {!isHost && (
          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl font-bold">
              <Upload className="h-4 w-4 mr-2" /> Upload submission
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground italic">No assignments submitted yet.</div>
      ) : (
        <div className="grid gap-3">
          {items.map(a => (
            <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl border border-glass-border bg-card/40">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  By {a.student?.display_name || "Student"} · {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button asChild size="sm" variant="ghost" className="rounded-xl">
                <a href={a.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Comment Section ─── */
function CommentSection({ classId, currentUser }: { classId: string; currentUser: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchComments(); }, [classId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("classroom_comments" as any)
      .select("*, author:profiles(*)")
      .eq("classroom_id", classId)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setLoading(false);
  };

  const post = async () => {
    if (!text.trim() || !currentUser) return;
    await supabase.from("classroom_comments" as any).insert({
      classroom_id: classId,
      author_id: currentUser.id,
      comment: text.trim()
    });
    setText("");
    fetchComments();
  };

  return (
    <div className="glass rounded-[2rem] p-6 border-glass-border">
      <h3 className="font-black text-lg mb-4">Class discussion</h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 pr-2 no-scrollbar">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <Avatar name={c.author?.display_name} size="sm" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{c.author?.display_name}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm text-foreground/80 mt-0.5">{c.comment}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Share a thought with the class..." 
          className="bg-card/40 rounded-xl h-11"
          onKeyDown={e => e.key === "Enter" && post()}
        />
        <Button onClick={post} disabled={!text.trim()} className="rounded-xl h-11 px-6 font-bold">Post</Button>
      </div>
    </div>
  );
}
