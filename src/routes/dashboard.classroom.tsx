import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, Plus, Search, ChevronRight, MoreVertical, 
  BookOpen, Video, Calendar, Clock, GraduationCap, 
  Trash2, Settings, Users2, Shield, ArrowRight, UserPlus
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/Loader";
import { useNavigate } from "@tanstack/react-router";

function ClassroomComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/classroom")({
  head: () => ({ meta: [{ title: "Classroom — Velora" }] }),
  component: ClassroomComponent,
});

type Classroom = {
  id: string;
  name: string;
  description: string;
  student_count?: number;
  meeting_id: string | null;
  created_at: string;
  user_id: string;
};

function Page() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [tab, setTab] = useState<"classes" | "students">("classes");
  const [allStudents, setAllStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch owned classes
      const { data: owned, error: ownedErr } = await supabase
        .from("classrooms" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch joined classes
      const { data: joined } = await supabase
        .from("classroom_members" as any)
        .select("classroom_id, classrooms(*)")
        .eq("email", user.email);

      if (ownedErr) {
        console.error("Fetch error:", ownedErr);
      } else {
        setClasses(owned || []);
        
        // Fetch all students for the owned classes
        if (owned && owned.length > 0) {
          const classIds = owned.map(c => c.id);
          const { data: studentData } = await supabase
            .from("classroom_members" as any)
            .select("*, user:profiles(*), classrooms(name)")
            .in("classroom_id", classIds)
            .eq("role", "student");
            
          setAllStudents(studentData || []);
        }
      }

      if (joined) {
        setJoinedClasses(joined.map((j: any) => j.classrooms).filter(Boolean));
      }
    } catch (err) {
      console.error("Error fetching classroom data:", err);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const createClass = async () => {
    if (!newName.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log("Attempting to create classroom for user:", user.id);
    const payload = {
      name: newName,
      description: newDesc,
      user_id: user.id,
    };
    console.log("Insert payload:", payload);

    const { data, error } = await supabase
      .from("classrooms" as any)
      .insert(payload)
      .select();

    if (error) {
      console.error("Full Supabase Error:", error);
      toast.error(`Failed to create classroom: ${error.message} (${error.code})`);
    } else if (!data || data.length === 0) {
      console.warn("Insert appeared to succeed but no data was returned. Check RLS SELECT policy.");
      toast.error("Classroom created but could not be retrieved. Refreshing...");
      fetchData();
      setIsCreating(false);
    } else {
      const newClass = data[0];
      setClasses([newClass, ...classes]);
      toast.success("Classroom created successfully");
      setIsCreating(false);
      setNewName("");
      setNewDesc("");
    }
  };

  const joinClass = async () => {
    if (!joinCode.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find class by ID (acting as code for now)
    const { data: cls, error: findErr } = await supabase
      .from("classrooms" as any)
      .select("*")
      .eq("id", joinCode)
      .single();

    if (findErr || !cls) {
      toast.error("Classroom not found. Check the ID.");
      return;
    }

    const { error: joinErr } = await supabase
      .from("classroom_members" as any)
      .insert({
        classroom_id: cls.id,
        user_id: user.id,
        email: user.email,
        role: "student"
      });

    if (joinErr) {
      if (joinErr.code === "23505") {
        toast.info("You are already a member of this class.");
      } else {
        toast.error("Failed to join classroom.");
      }
    } else {
      setJoinedClasses([cls, ...joinedClasses]);
      toast.success(`Joined ${cls.name}`);
      setIsJoining(false);
      setJoinCode("");
    }
  };

  const allVisible = [...classes, ...joinedClasses].filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const visibleStudents = allStudents.filter(s => 
    (s.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (s.user?.display_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (s.classrooms?.name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <DashboardShell title="Classroom" actions={
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setIsJoining(true)} className="rounded-xl h-10 px-4 border-glass-border">
          <UserPlus className="h-4 w-4 mr-2" /> Join Class
        </Button>
        <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-10 px-4 shadow-glow">
          <Plus className="h-4 w-4" /> Create Class
        </Button>
      </div>
    }>
      <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-3xl p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Teaching</p>
                <h3 className="text-2xl font-black">{classes.length}</h3>
              </div>
            </div>
          </div>
          <div className="glass rounded-3xl p-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 grid place-items-center">
                <Users2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Enrolled</p>
                <h3 className="text-2xl font-black">{joinedClasses.length}</h3>
              </div>
            </div>
          </div>
          <div className="glass rounded-3xl p-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 grid place-items-center">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Students</p>
                <h3 className="text-2xl font-black">{allStudents.length}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex gap-1 bg-muted/20 p-1 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => setTab("classes")}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === "classes" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              My Classes
            </button>
            <button 
              onClick={() => setTab("students")}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === "students" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              All Students
            </button>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={tab === "classes" ? "Search classrooms..." : "Search students..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-card/40 border-glass-border rounded-xl"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20">
            <Loader label="Synchronizing your classrooms" />
          </div>
        ) : tab === "classes" ? (
          allVisible.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl border-dashed">
              <div className="h-20 w-20 rounded-full bg-muted/10 grid place-items-center mx-auto mb-4">
                <GraduationCap className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">No classrooms found</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Ready to start teaching or learning? Create a class or join one with a code.
              </p>
              <div className="flex justify-center gap-3 mt-8">
                <Button onClick={() => setIsJoining(true)} variant="outline" className="rounded-xl h-12 px-8 border-glass-border font-bold">
                  Join Class
                </Button>
                <Button onClick={() => setIsCreating(true)} className="rounded-xl h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-glow font-bold">
                  <Plus className="h-4 w-4 mr-2" /> Create Class
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allVisible.map(c => {
                const isOwner = classes.some(o => o.id === c.id);
                return (
                  <div 
                    key={c.id} 
                    onClick={() => navigate({ to: "/dashboard/classroom/$classId", params: { classId: c.id } })}
                    className="group glass rounded-[2.5rem] border-glass-border hover:border-primary/30 transition-all duration-500 hover:shadow-brand flex flex-col h-72 overflow-hidden relative cursor-pointer active:scale-95"
                  >
                    <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-background/50 backdrop-blur-md border border-glass-border shadow-elegant">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-glass-border p-2 min-w-[160px]">
                          <DropdownMenuItem className="rounded-lg h-10 px-3"><Settings className="h-4 w-4 mr-2" /> Settings</DropdownMenuItem>
                          {isOwner && <DropdownMenuItem className="rounded-lg h-10 px-3 text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>}
                          {!isOwner && <DropdownMenuItem className="rounded-lg h-10 px-3 text-destructive"><ArrowRight className="h-4 w-4 mr-2 rotate-180" /> Leave</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="p-8 flex-1">
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`h-12 w-12 rounded-2xl grid place-items-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${isOwner ? 'bg-primary/10 text-primary shadow-glow' : 'bg-amber-500/10 text-amber-500 shadow-glow'}`}>
                          {isOwner ? <Users className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
                        </div>
                        <span className={`text-[10px] uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full ${isOwner ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-500'}`}>
                          {isOwner ? "Lecturer" : "Student"}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-black group-hover:text-primary transition-colors line-clamp-1 mb-2">{c.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                        {c.description}
                      </p>
                    </div>

                    <div className="p-5 bg-gradient-to-t from-muted/20 to-transparent border-t border-glass-border/30 flex gap-3">
                      <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-glow h-12 font-bold text-sm">
                        Open Classroom <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      {isOwner && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="rounded-2xl border-glass-border h-12 w-12 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Logic to start meeting immediately
                          }}
                        >
                          <Video className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="glass rounded-3xl border-glass-border overflow-hidden">
            {visibleStudents.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground italic">No students found.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b border-glass-border">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Student Name</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Classroom</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {visibleStudents.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm">
                        {s.user?.display_name || s.email.split('@')[0]}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold bg-primary/10 text-primary">
                          {s.classrooms?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] grid place-items-center px-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass rounded-3xl p-8 max-w-md w-full shadow-elegant border-primary/20">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <Plus className="h-6 w-6 text-primary" /> Create Classroom
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">Class Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Advanced Physics" className="bg-card/40 h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">Description</Label>
                <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Briefly describe your class" className="bg-card/40 h-12 rounded-xl" />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="flex-1 rounded-xl h-12">Cancel</Button>
                <Button onClick={createClass} disabled={!newName} className="flex-1 bg-primary text-white rounded-xl h-12 shadow-glow">Create Class</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {isJoining && (
        <div className="fixed inset-0 z-[100] grid place-items-center px-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass rounded-3xl p-8 max-w-md w-full shadow-elegant border-amber-500/20">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-amber-500" /> Join Classroom
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-widest font-bold ml-1">Class ID / Code</Label>
                <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter the ID provided by your lecturer" className="bg-card/40 h-12 rounded-xl font-mono" />
              </div>
              <p className="text-[10px] text-muted-foreground italic px-1">
                Tip: Ask your lecturer to share the class ID found in their classroom dashboard.
              </p>
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setIsJoining(false)} className="flex-1 rounded-xl h-12">Cancel</Button>
                <Button onClick={joinClass} disabled={!joinCode} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-12 shadow-glow">Join Class</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
