import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Search, ChevronRight, MoreVertical,
  GraduationCap, Trash2, Settings, Users2, UserPlus,
  Loader2, Users, ArrowRight, Copy, Image as ImageIcon
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "@/components/Loader";
import { Avatar } from "@/components/Avatar";
import { useNotifications } from "@/hooks/useNotifications";

// Helper to generate a unique 6-character classroom code
const generateClassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function Page() {
  const { push } = useNotifications();
  const [classes, setClasses] = useState<any[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isJoiningLoading, setIsJoiningLoading] = useState(false);
  // Cache user to avoid concurrent getUser() calls that steal the Supabase auth lock
  const cachedUserRef = React.useRef<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      cachedUserRef.current = user; // cache for later use

      const { data: owned } = await supabase.from("classrooms").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      // Query by both user_id and email for maximum compatibility
      const [byUserId, byEmail] = await Promise.all([
        supabase.from("classroom_members").select("classroom_id, classrooms(*)").eq("user_id", user.id),
        supabase.from("classroom_members").select("classroom_id, classrooms(*)").eq("email", user.email ?? "")
      ]);
      const joinedRaw = [
        ...(byUserId.data || []),
        ...(byEmail.data || [])
      ];
      // Deduplicate by classroom_id
      const seen = new Set<string>();
      const uniqueJoined = joinedRaw.filter((j: any) => {
        if (seen.has(j.classroom_id)) return false;
        seen.add(j.classroom_id);
        return true;
      });

      setClasses(owned || []);
      // Map and filter out any null classrooms from the join
      const joined = uniqueJoined
        .map((j: any) => j.classrooms)
        .filter((c: any) => c !== null && c !== undefined);
      
      setJoinedClasses(joined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const path = `${user.id}/classroom_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from("meeting-previews").upload(path, file);
    if (error) toast.error("Upload failed");
    else {
      const { data: { publicUrl } } = supabase.storage.from("meeting-previews").getPublicUrl(path);
      setBannerImage(publicUrl);
    }
    setIsUploading(false);
  };

  const createClass = async () => {
    if (!newName.trim()) return;
    // Use cached user to avoid auth lock contention
    const user = cachedUserRef.current || (await supabase.auth.getUser()).data.user;
    if (!user) return;
    cachedUserRef.current = user;

    const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    const slug = `${slugify(newName)}-${Math.random().toString(36).substring(2, 6)}`;
    const join_code = generateClassCode();

    const { data, error } = await supabase.from("classrooms").insert({
      name: newName, 
      description: newDesc, 
      user_id: user.id, 
      preview_image_url: bannerImage, 
      slug,
      join_code
    }).select().single();

    if (error) toast.error("Failed to create class");
    else {
      // Automatically add the creator as the host member
      await supabase.from("classroom_members").insert({
        classroom_id: data.id,
        user_id: user.id,
        email: user.email ?? "",
        role: "host"
      });
      
      await push({ title: "Classroom Created", body: `You created "${newName}"`, kind: "success" });
      toast.success("Classroom created!");
      setIsCreating(false);
      fetchData();
      navigate({ to: "/dashboard/classroom/$slug/class", params: { slug: data.slug || data.id } });
    }
  };

  const joinClass = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setIsJoiningLoading(true);
    try {
      // Use cached user to avoid competing auth lock calls
      const user = cachedUserRef.current || (await supabase.auth.getUser()).data.user;
      if (!user) { toast.error("Not authenticated"); return; }
      cachedUserRef.current = user;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);
      
      let query = supabase.from("classrooms").select("*");
      if (isUuid) query = query.eq("id", code);
      else query = query.eq("join_code", code);
      
      const { data: cls, error: lookupError } = await query.maybeSingle();
      
      if (lookupError) {
        console.error("Classroom lookup error:", lookupError);
        toast.error("Unable to look up class. Please try again.");
        return;
      }
      if (!cls) { toast.error("Invalid class code. Check the code and try again."); return; }

      // Insert member record with both user_id and email for RLS compatibility
      const { error } = await supabase.from("classroom_members").insert({
        classroom_id: cls.id, 
        user_id: user.id, 
        email: user.email ?? "", 
        role: "student"
      });

      if (error) {
        if (error.code === '23505') toast.error("You are already a member of this class.");
        else { console.error("Join error:", error); toast.error("Failed to join. Please try again."); }
      } else {
        await push({ title: "Joined Classroom", body: `You are now a member of "${cls.name}"`, kind: "success" });
        toast.success(`Joined ${cls.name}!`);
        setIsJoining(false);
        setJoinCode("");
        fetchData();
        navigate({ to: "/dashboard/classroom/$slug/class", params: { slug: cls.slug || cls.id } });
      }
    } catch (err) {
      console.error("joinClass error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsJoiningLoading(false);
    }
  };

  const deleteClass = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const { error } = await supabase.from("classrooms").delete().eq("id", deleteId);
    if (error) toast.error("Failed to delete");
    else {
      setClasses(classes.filter(c => c.id !== deleteId));
      setDeleteId(null);
      toast.success("Classroom removed");
    }
    setIsDeleting(false);
  };

  const leaveClass = async (id: string) => {
    if (!confirm("Leave this classroom?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("classroom_members").delete().eq("classroom_id", id).eq("email", user.email);
    if (error) toast.error("Failed to leave");
    else {
      setJoinedClasses(joinedClasses.filter(c => c.id !== id));
      toast.success("Classroom left");
    }
  };

  const allVisible = [...classes, ...joinedClasses].filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const colors = [
    "from-blue-600 to-blue-400",
    "from-green-600 to-green-400",
    "from-purple-600 to-purple-400",
    "from-orange-600 to-orange-400",
    "from-pink-600 to-pink-400"
  ];

  if (loading) return (
    <DashboardShell title="Classroom">
      <div className="h-[60vh] flex items-center justify-center">
        <Loader label="Synchronizing class environments" />
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell title="Classroom" actions={
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setIsJoining(true)} className="rounded-xl h-10 border-glass-border hidden sm:flex">
          <UserPlus className="h-4 w-4 mr-2" /> Join Class
        </Button>
        <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-10 px-4 shadow-glow">
          <Plus className="h-4 w-4" /> Create Class
        </Button>
      </div>
    }>
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card/40 backdrop-blur-sm border border-primary/10 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-card/60">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-blue-600/60 leading-none mb-1">Teaching</p>
              <h3 className="text-xl font-bold text-foreground leading-none">{classes.length}</h3>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur-sm border border-primary/10 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-card/60">
            <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
              <Users2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-green-600/60 leading-none mb-1">Enrolled</p>
              <h3 className="text-xl font-bold text-foreground leading-none">{joinedClasses.length}</h3>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur-sm border border-primary/10 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-card/60 group cursor-pointer" onClick={() => setIsJoining(true)}>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-purple-600/60 leading-none mb-1">New class</p>
              <h3 className="text-[11px] font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                Enter code <ChevronRight className="h-3 w-3" />
              </h3>
            </div>
          </div>
        </div>

        {/* Local search removed as per user request to avoid redundancy with global search */}

        {allVisible.length === 0 ? (
          <div className="text-center py-20 bg-card/20 rounded-[2rem] border border-dashed border-glass-border">
            <GraduationCap className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold">No classrooms found</h3>
            <p className="text-muted-foreground mt-2 mb-6">Start by creating a new class or joining an existing one.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setIsCreating(true)} className="rounded-xl h-12 px-6">Create Classroom</Button>
              <Button variant="outline" onClick={() => setIsJoining(true)} className="rounded-xl h-12 px-6">Join Class</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allVisible.map((c) => {
              const isOwner = classes.some(o => o.id === c.id);
              const seed = c.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const bgClass = colors[seed % colors.length];

              const shareLink = (e: React.MouseEvent) => {
                e.stopPropagation();
                const link = `${window.location.origin}/dashboard/classroom?join=${c.join_code}`;
                navigator.clipboard.writeText(link);
                toast.success("Class link copied to clipboard.");
              };

              return (
                <div 
                  key={c.id} 
                  onClick={() => navigate({ to: "/dashboard/classroom/$slug/class", params: { slug: c.slug || c.id } })}
                  className="group flex flex-col bg-card rounded-2xl border border-glass-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
                >
                  <div className={`h-24 w-full bg-gradient-to-r ${c.preview_image_url ? '' : bgClass} p-4 relative overflow-hidden`}>
                    {c.preview_image_url && (
                      <img src={c.preview_image_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute -right-4 -top-4 w-24 h-24 border-8 border-white rounded-full" />
                      <div className="absolute right-8 bottom-0 w-16 h-16 border-4 border-white rotate-45" />
                      <div className="absolute left-1/4 top-1/2 w-32 h-32 bg-white/20 blur-2xl rounded-full" />
                    </div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg truncate drop-shadow-md group-hover:underline underline-offset-4 decoration-2">
                          {c.name}
                        </h3>
                        <p className="text-white/80 text-xs truncate drop-shadow-sm font-medium">
                          {isOwner ? "Instructor" : "Student"} • {c.join_code}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {isOwner ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-white hover:text-red-100 hover:bg-red-500/40 rounded-full transition-all"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(c.id); }}
                            title="Delete Classroom"
                          >
                            <Trash2 className="h-[18px] w-[18px]" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-white hover:text-red-100 hover:bg-red-500/40 rounded-full transition-all"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); leaveClass(c.id); }}
                            title="Leave Classroom"
                          >
                            <ArrowRight className="h-[18px] w-[18px] rotate-180" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass border-glass-border p-2" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem 
                              onSelect={(e) => { e.preventDefault(); navigate({ to: "/dashboard/classroom/$slug/class", params: { slug: c.slug || c.id } }); }}
                              className="rounded-lg h-10 px-3"
                            >
                              <Settings className="h-4 w-4 mr-2" /> Class Hub
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onSelect={(e) => {
                                e.preventDefault();
                                const link = `${window.location.origin}/dashboard/classroom?join=${c.join_code}`;
                                navigator.clipboard.writeText(link);
                                toast.success("Class link copied.");
                              }}
                              className="rounded-lg h-10 px-3"
                            >
                              <Copy className="h-4 w-4 mr-2" /> Share link
                            </DropdownMenuItem>
                            {isOwner && (
                              <DropdownMenuItem 
                                onSelect={(e) => { e.preventDefault(); setDeleteId(c.id); }}
                                className="rounded-lg h-10 px-3 text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Class
                              </DropdownMenuItem>
                            )}
                            {!isOwner && (
                               <DropdownMenuItem 
                                onSelect={(e) => { e.preventDefault(); leaveClass(c.id); }}
                                className="rounded-lg h-10 px-3 text-destructive"
                              >
                                <ArrowRight className="h-4 w-4 mr-2 rotate-180" /> Leave
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10 italic font-medium">
                      {c.description || "No description provided."}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                        <Users className="h-3 w-3" /> 
                        <span>Active hub</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-bold text-[11px] group-hover:gap-2 transition-all">
                        Manage <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="glass border-glass-border rounded-[2rem] p-8 max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Create Classroom</DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Create a new virtual space for your students.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-widest font-black ml-1 text-primary">Class Name</Label>
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="e.g. Advanced Mathematics" 
                className="bg-card/40 h-12 rounded-xl" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-widest font-black ml-1 text-primary">Description</Label>
              <Input 
                value={newDesc} 
                onChange={(e) => setNewDesc(e.target.value)} 
                placeholder="What is this class about?" 
                className="bg-card/40 h-12 rounded-xl" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-widest font-black ml-1 text-primary">Banner Image (Optional)</Label>
              <div className="flex gap-2">
                <input id="banner-upload" type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                <Button variant="outline" onClick={() => document.getElementById('banner-upload')?.click()} className="bg-card/40 h-12 rounded-xl flex-1 border-glass-border hover:bg-card/60 text-xs font-bold transition-all">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                  {isUploading ? "Uploading..." : "Choose image"}
                </Button>
                {bannerImage && <div className="h-12 w-12 shrink-0 rounded-xl border border-primary/20 overflow-hidden"><img src={bannerImage} className="h-full w-full object-cover" /></div>}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-xl h-12">Cancel</Button>
            <Button onClick={createClass} disabled={!newName || isUploading} className="bg-primary text-white rounded-xl h-12 px-6 shadow-glow font-bold">
              {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : "Create Space"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isJoining} onOpenChange={(v) => { setIsJoining(v); if (!v) setJoinCode(""); }}>
        <DialogContent className="border-0 rounded-2xl p-0 max-w-[320px] shadow-2xl overflow-hidden bg-gradient-to-b from-blue-600 to-blue-700 text-white">
          <div className="p-5 text-center">
            <div className="h-10 w-10 bg-white/20 rounded-xl grid place-items-center mx-auto mb-3">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <DialogHeader className="space-y-1 mb-4">
              <DialogTitle className="text-base font-black tracking-tight text-white text-center">Join a Classroom</DialogTitle>
              <DialogDescription className="text-[11px] text-blue-100 text-center leading-relaxed">
                Enter the 6-character class code<br/>from your instructor.
              </DialogDescription>
            </DialogHeader>
            <Input 
              value={joinCode} 
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())} 
              placeholder="A7B2X9" 
              maxLength={6}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/50 h-10 rounded-xl text-center text-lg font-mono tracking-[0.3em] uppercase font-black focus-visible:ring-white/40" 
            />
            <div className="flex gap-2 mt-3">
              <Button 
                variant="ghost" 
                onClick={() => { setIsJoining(false); setJoinCode(""); }} 
                className="flex-1 rounded-xl h-9 text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10"
              >Cancel</Button>
              <Button 
                onClick={joinClass} 
                disabled={joinCode.length < 3 || isJoiningLoading} 
                className="flex-1 bg-white hover:bg-blue-50 text-blue-700 rounded-xl h-9 font-black text-[11px] shadow-lg"
              >
                {isJoiningLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Class"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(val) => !val && setDeleteId(null)}>
        <DialogContent className="glass border-glass-border rounded-[2rem] max-w-sm p-8 shadow-2xl text-center">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-2xl grid place-items-center mx-auto mb-4">
            <Trash2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black">Delete Classroom?</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 font-medium">
            This action is permanent and cannot be undone.
          </DialogDescription>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-8">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 rounded-xl h-12 font-bold">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteClass} 
              disabled={isDeleting}
              className="flex-1 rounded-xl h-12 font-black shadow-lg shadow-destructive/20"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

export const Route = createFileRoute("/dashboard/classroom/")({
  head: () => ({ meta: [{ title: "Classroom Hub — Velora" }] }),
  component: Page,
});
