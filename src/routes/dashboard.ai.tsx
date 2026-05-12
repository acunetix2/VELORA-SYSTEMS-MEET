import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { 
  BrainCircuit, Sparkles, Zap, MessageSquare, History, 
  BarChart3, ListChecks, Target, ArrowUpRight, Search,
  Bot, Settings2, Database, ShieldCheck, Cpu, 
  TrendingUp, Users, Clock, ArrowRight, Star,
  Send, Image as ImageIcon, X, Loader2, User,
  Paperclip, Mic, Globe2, ScanFace, Wand2, Plus, 
  Trash2, MessageSquarePlus, Edit3, CheckCircle2, FileText,
  ThumbsUp, Copy, Share2, Check, PanelLeftClose, PanelLeft,
  MoreVertical, MoreHorizontal, Mail, Linkedin, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EllaIcon } from "@/components/EllaIcon";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/ai")({
  validateSearch: (search: Record<string, unknown>): { conv?: string } => {
    return {
      conv: (search.conv as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Velora AI — Intelligence Hub" },
      { name: "description", content: "Advanced meeting intelligence, Velora chat, and knowledge base integration." },
    ],
  }),
  component: AiDashboard,
});

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
};

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

function InlineFormat({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="text-foreground font-black">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </>
  );
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        
        // Detect separators
        if (/^[-=]{3,}$/.test(trimmed)) {
          return <div key={i} className="my-6 h-px bg-gradient-to-r from-transparent via-glass-border to-transparent" />;
        }

        if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-primary pt-2 pb-1"><InlineFormat text={trimmed.slice(4)} /></h3>;
        if (trimmed.startsWith('## ')) return <h2 key={i} className="text-xl font-black text-primary pt-3 pb-1"><InlineFormat text={trimmed.slice(3)} /></h2>;
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-primary mt-0.5">•</span>
              <span className="flex-1"><InlineFormat text={trimmed.slice(2)} /></span>
            </div>
          );
        }
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-primary font-bold">{numMatch[1]}.</span>
              <span className="flex-1"><InlineFormat text={numMatch[2]} /></span>
            </div>
          );
        }
        if (trimmed === '') return <div key={i} className="h-1" />;
        return (
          <p key={i} className={cn("break-words leading-relaxed", line.startsWith('[Document:') ? "text-primary font-bold" : "text-foreground/80")}>
            <InlineFormat text={line} />
          </p>
        );
      })}
    </div>
  );
}

function AiDashboard() {
  const [activeTab, setActiveTab] = useState<"chat" | "overview" | "lab">("chat");
  const [stats, setStats] = useState({ meetings: 0, timeSaved: 0, insights: 0, automated: 0 });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { count: meetingsCount } = await supabase.from("meeting_history").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: insightsCount } = await supabase.from("transcripts").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const meetings = meetingsCount || 0;
      const insights = insightsCount || 0;
      setStats({ meetings, timeSaved: (meetings * 30) / 60, insights, automated: insights * 3 });
    };
    fetchStats();
  }, [user]);

  return (
    <DashboardShell title="Velora AI">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 space-y-4 pb-24">
        
        <div className="flex items-center justify-between py-2 border-b border-glass-border/40 mb-2">
          <div className="flex items-center gap-3">
             <h2 className="text-lg font-black tracking-tight text-foreground/90 flex items-center gap-2">
               Velora AI
               <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             </h2>
          </div>
          <div className="flex items-center gap-1 p-0.5 bg-muted/30 rounded-lg border border-glass-border/20">
            <TabButton active={activeTab === "chat"} onClick={() => setActiveTab("chat")} label="Chat" icon={<MessageSquare className="h-3 w-3" />} />
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} label="Intelligence" icon={<BarChart3 className="h-3 w-3" />} />
            <TabButton active={activeTab === "lab"} onClick={() => setActiveTab("lab")} label="Lab" icon={<Cpu className="h-3 w-3" />} />
          </div>
        </div>

        <div className="flex-1 min-h-[500px] relative">
          {activeTab === "chat" && <VeloraChat />}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                  <StatCard label="time saved" value={`${stats.timeSaved.toFixed(1)}h`} icon={<Clock className="h-3 w-3 text-primary" />} />
                  <StatCard label="insights" value={stats.insights.toString()} icon={<BrainCircuit className="h-3 w-3 text-primary" />} />
                  <StatCard label="automated" value={stats.automated.toString()} icon={<ListChecks className="h-3 w-3 text-primary" />} />
                  <StatCard label="accuracy" value="99.2%" icon={<ShieldCheck className="h-3 w-3 text-primary" />} />
                </div>
                <section className="py-6 border-y border-glass-border/20">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        Sentiment analysis
                      </h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground"><span>Constructive flow</span><span className="text-blue-500">78%</span></div>
                        <Progress value={78} className="h-1 bg-blue-500/5" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground"><span>Information exchange</span><span className="text-purple-500">64%</span></div>
                        <Progress value={64} className="h-1 bg-purple-500/5" />
                      </div>
                    </div>
                  </div>
                </section>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2"><StatDetailCard title="Meetings Analyzed" value={stats.meetings} icon={<Users className="h-3.5 w-3.5" />} /><StatDetailCard title="Knowledge Artifacts" value={stats.insights} icon={<Database className="h-3.5 w-3.5" />} /></div>
              </div>
              <div className="space-y-6 lg:border-l border-glass-border/20 lg:pl-6 pt-8 lg:pt-0 border-t lg:border-t-0">
                <div className="space-y-4">
                  <h3 className="font-bold text-[10px] text-muted-foreground flex items-center gap-2"><Zap className="h-3 w-3 text-amber-500" /> Engine status</h3>
                  <div className="space-y-4">
                    <StatusItem label="Velora Engine" value="v1.0.0-Core" status="online" />
                    <StatusItem label="Context" value="Unlimited" />
                    <StatusItem label="Latency" value="42ms" />
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "lab" && <VeloraLab />}
        </div>
      </div>
    </DashboardShell>
  );
}

function VeloraChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/dashboard/ai" });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(search.conv || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{ name: string; content: string } | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<number>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarCollapsed(true);
  }, []);

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      toast.info("Listening...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied.");
      } else {
        toast.error("Speech recognition failed.");
      }
    };

    recognition.start();
  };

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data } = await supabase.from("ai_conversations" as any).select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
      setConversations(data || []);
      if (data && data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0].id);
        navigate({ search: { conv: data[0].id } as any });
      }
    };
    


    fetchConversations();
  }, [user, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([{ role: "assistant", content: "Welcome to Velora AI. Select a conversation to begin." }]);
      return;
    }
    const fetchMessages = async () => {
      const { data } = await supabase.from("ai_messages" as any).select("*").eq("conversation_id", activeConversationId).order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();
  }, [activeConversationId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Image too large");
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) return toast.error("Document too large");
      const reader = new FileReader();
      reader.onloadend = () => setSelectedDoc({ name: file.name, content: reader.result as string });
      reader.readAsText(file);
    }
  };

  const startNewChat = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("ai_conversations" as any).insert({ user_id: user.id, title: "New Conversation" }).select().single();
    if (error) return toast.error("Failed to create conversation");
    setActiveConversationId(data.id);
    navigate({ search: { conv: data.id } as any });
    setMessages([{ role: "assistant", content: "How can I help you today?" }]);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("ai_conversations" as any).delete().eq("id", id);
    if (error) return toast.error("Failed to delete");
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      navigate({ search: { conv: undefined } as any });
      setMessages([]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage && !selectedDoc) || loading || !user) return;
    let conversationId = activeConversationId;
    if (!conversationId) {
      const { data } = await supabase.from("ai_conversations" as any).insert({ user_id: user.id, title: input.trim().slice(0, 30) || "New Chat" }).select().single();
      conversationId = data.id;
      setActiveConversationId(conversationId);
      navigate({ search: { conv: conversationId } as any });
    }
    const userMsg = input.trim();
    const currentImage = selectedImage;
    const currentDoc = selectedDoc;
    setInput(""); setSelectedImage(null); setSelectedDoc(null);
    let displayContent = userMsg;
    if (currentDoc) displayContent += `\n[Document: ${currentDoc.name}]`;
    setMessages(prev => [...prev, { role: "user", content: displayContent, image_url: currentImage || undefined }]);
    setLoading(true);
    
    try {
      await supabase.from("ai_messages" as any).insert({ conversation_id: conversationId, role: "user", content: displayContent, image_url: currentImage || null });
      
      // Smart title update on first message
      if (messages.length <= 1) {
        const smartTitle = userMsg.length > 25 ? userMsg.slice(0, 25).trim() + "..." : userMsg.trim() || (currentDoc ? currentDoc.name : "New Analysis");
        await supabase.from("ai_conversations" as any).update({ title: smartTitle }).eq("id", conversationId);
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title: smartTitle } : c));
      }

      let promptContent = userMsg;
      if (currentDoc) promptContent = `Document (${currentDoc.name}):\n${currentDoc.content}\n\nUser request: ${userMsg || "Analyze this document."}`;
      const { data, error } = await supabase.functions.invoke("velora-ai", { body: { messages: [...messages.slice(-10).map(m => ({ role: m.role, content: m.content })), { role: "user", content: promptContent, image_url: currentImage || undefined }], mode: "unbound" } });
      if (error) throw error;
      const assistantContent = data?.choices?.[0]?.message?.content || "Connection stable.";
      await supabase.from("ai_messages" as any).insert({ conversation_id: conversationId, role: "assistant", content: assistantContent });
      setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (err) { toast.error("Velora link interrupted."); } finally { setLoading(false); }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-250px)] sm:h-[670px] animate-in fade-in slide-in-from-bottom-6 duration-1000 relative overflow-hidden sm:overflow-visible">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
        className={cn(
          "absolute left-0 top-6 z-[60] h-6 w-6 rounded-full border border-glass-border bg-background shadow-sm transition-all hover:bg-primary hover:text-white",
          sidebarCollapsed ? "left-0" : "left-[184px] sm:left-44"
        )}
      >
        {sidebarCollapsed ? <PanelLeft className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
      </Button>

      {/* Responsive Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl transition-all duration-500 border-r border-glass-border/20 sm:relative sm:z-auto sm:bg-transparent sm:backdrop-blur-none",
        sidebarCollapsed ? "w-0 -translate-x-full opacity-0 sm:opacity-0" : "w-48 translate-x-0 opacity-100"
      )}>
        {/* Mobile overlay */}
        {!sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/20 z-[-1] sm:hidden" 
            onClick={() => setSidebarCollapsed(true)} 
          />
        )}
        <div className="p-4 border-b border-glass-border/20 flex justify-center">
          <Button onClick={startNewChat} size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/5 text-primary rounded-xl transition-all">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2 py-3">
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <div key={conv.id} className="relative group">
                <button 
                  onClick={() => { setActiveConversationId(conv.id); navigate({ search: { conv: conv.id } as any }); }} 
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all ${activeConversationId === conv.id ? "bg-primary/10 text-primary" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30"}`}
                >
                  <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${activeConversationId === conv.id ? "text-primary" : "text-muted-foreground/20"}`} />
                  <span className="break-words flex-1 text-left pr-4">{conv.title}</span>
                </button>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-6 w-6 grid place-items-center rounded-md hover:bg-muted/50 text-muted-foreground">
                        <MoreHorizontal className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass border-glass-border/20 p-1 w-32 shadow-xl">
                      <DropdownMenuItem onClick={() => toast.info("Rename coming soon")} className="text-[10px] font-bold rounded-lg gap-2 cursor-pointer">
                        <Edit3 className="h-3 w-3" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => deleteConversation(conv.id, e as any)} className="text-[10px] font-bold rounded-lg gap-2 text-destructive focus:text-destructive cursor-pointer">
                        <Trash2 className="h-3 w-3" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Window */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="px-6 py-3 border-b border-glass-border/20 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Velora AI</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Chat link copied"); }} className="h-8 w-8 rounded-lg hover:bg-primary/10 text-muted-foreground/40"><Share2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <ScrollArea className="flex-1 p-5 sm:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`group flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} max-w-[90%]`}>
                    <div className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`h-7 w-7 rounded-lg shrink-0 grid place-items-center border border-glass-border/20 bg-muted/20 relative ${m.role === "user" ? "text-primary" : ""}`}>
                        {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <EllaIcon className="scale-50" />}
                      </div>
                      <div className={`p-1 rounded-xl text-xs leading-relaxed transition-all ${m.role === "user" ? "text-right" : "text-left"}`}>
                        {m.image_url && <div className="mb-3 rounded-xl overflow-hidden border border-glass-border/20"><img src={m.image_url} alt="User upload" className="max-h-[250px] w-auto object-cover" /></div>}
                        <FormattedMessage content={m.content} />
                      </div>
                    </div>
                    {m.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mt-3 ml-11 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                        <MessageAction 
                          icon={<ThumbsUp className={`h-3 w-3 ${likedMessages.has(i) ? "fill-primary text-primary" : ""}`} />} 
                          onClick={() => {
                            setLikedMessages(prev => {
                              const n = new Set(prev);
                              if (n.has(i)) n.delete(i);
                              else {
                                n.add(i);
                                setMessages(curr => [...curr, { role: "assistant", content: "Thank you! I'm glad you found that helpful. Your feedback helps me learn and provide better insights for your future meetings." }]);
                                toast.success("Feedback recorded");
                              }
                              return n;
                            });
                          }} 
                          active={likedMessages.has(i)} 
                        />
                        <MessageAction 
                          icon={<Copy className="h-3 w-3" />} 
                          onClick={() => { 
                            navigator.clipboard.writeText(m.content); 
                            toast.success("Message copied to clipboard"); 
                          }} 
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-7 w-7 rounded-lg grid place-items-center bg-card/40 border border-glass-border/40 text-muted-foreground hover:bg-card/60 hover:text-primary transition-all shadow-sm">
                              <Share2 className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="glass border-glass-border p-1 w-48 shadow-xl">
                            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Chat link copied"); }}>
                              <Copy className="h-3.5 w-3.5 mr-2" /> Copy link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=Velora AI Intelligence&body=${encodeURIComponent("Check out this Velora AI analysis: " + window.location.href)}`, "_blank")}>
                              <img src="https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png" className="h-4 w-4 mr-2" alt="Gmail" /> Send via Gmail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent("Velora AI Intelligence: " + window.location.href)}`, "_blank")}>
                              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="h-4 w-4 mr-2" alt="WhatsApp" /> Share on WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank")}>
                              <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" className="h-4 w-4 mr-2" alt="LinkedIn" /> Share on LinkedIn
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-4">
                    <div className="h-7 w-7 rounded-lg bg-muted/20 border border-glass-border/20 grid place-items-center animate-pulse"><EllaIcon className="scale-50" /></div>
                    <div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin text-primary/40" /><span className="text-[9px] font-bold text-muted-foreground/40">Analyzing intelligence...</span></div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 sm:p-6 mt-auto">
          <div className="max-w-2xl mx-auto glass rounded-[24px] border border-glass-border p-3 sm:p-4 bg-card/30 transition-all hover:bg-card/40">
            <form onSubmit={sendMessage} className="space-y-3">
              <div className="flex gap-2">
                {selectedImage && <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-primary animate-in zoom-in"><img src={selectedImage} alt="Preview" className="w-full h-full object-cover" /><button type="button" onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-white grid place-items-center"><X className="h-2 w-2" /></button></div>}
                {selectedDoc && <div className="relative w-16 h-16 rounded-xl border-2 border-primary bg-primary/10 flex flex-col items-center justify-center p-1 animate-in zoom-in"><FileText className="h-6 w-6 text-primary" /><span className="text-[8px] font-bold break-words w-full text-center">{selectedDoc.name}</span><button type="button" onClick={() => setSelectedDoc(null)} className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-white grid place-items-center"><X className="h-2 w-2" /></button></div>}
              </div>
              <div className="relative">
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  <input type="file" ref={docInputRef} onChange={handleDocUpload} accept=".txt,.json,.md,.csv" className="hidden" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-9 w-9 rounded-xl bg-transparent text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 transition-all"><ImageIcon className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => docInputRef.current?.click()} className="h-9 w-9 rounded-xl bg-transparent text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 transition-all"><Paperclip className="h-4 w-4" /></Button>
                </div>
                <Input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="How can I help you today?"
                  className="h-12 sm:h-14 bg-card/30 border-glass-border rounded-[22px] pl-20 sm:pl-28 pr-24 sm:pr-32 focus:ring-primary/20 focus:bg-card/50 transition-all placeholder:text-muted-foreground/40 text-sm shadow-inner text-foreground dark:text-white"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={startSpeechRecognition} className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-transparent text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 transition-all">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button type="submit" disabled={(!input.trim() && !selectedImage && !selectedDoc) || loading} className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl transition-all duration-300 border-0 font-bold ${
                    input.trim() || selectedImage || selectedDoc
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "bg-zinc-100 text-zinc-400 dark:bg-white/5 dark:text-zinc-600 cursor-not-allowed"
                  }`}>
                    {loading ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </Button>
                </div>
              </div>
            </form>
          </div>
          <div className="max-w-2xl mx-auto mt-4 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 opacity-40">
            <p className="text-[10px] font-medium text-muted-foreground text-center sm:text-left">
              Velora AI can make mistakes. Please verify important information.
            </p>
            <div className="flex gap-4">
              <span className="text-[10px] font-medium text-muted-foreground">Privacy protected</span>
              <span className="text-[10px] font-medium text-muted-foreground">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageAction({ icon, onClick, active }: { icon: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={`h-6 w-6 rounded-md flex items-center justify-center transition-all border border-transparent ${active ? "text-primary" : "text-muted-foreground/20 hover:text-foreground"}`}>{icon}</button>
  );
}

function VeloraLab() {
  const { profile, refresh } = useProfile();
  const [persona, setPersona] = useState(profile?.ai_persona || "concierge");
  const [context, setContext] = useState(profile?.ai_context || "");
  const [voiceEnabled, setVoiceEnabled] = useState(profile?.ai_voice_enabled || false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (profile) { setPersona(profile.ai_persona || "concierge"); setContext(profile.ai_context || ""); setVoiceEnabled(profile.ai_voice_enabled || false); } }, [profile]);
  const saveSettings = async () => { if (!profile) return; setSaving(true); const { error } = await supabase.from("profiles").update({ ai_persona: persona, ai_context: context, ai_voice_enabled: voiceEnabled }).eq("id", profile.id); if (error) toast.error("Failed to save"); else { toast.success("Settings updated"); refresh(); } setSaving(false); };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4 pb-12">
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Bot className="h-3 w-3" /> Persona</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PersonaOption active={persona === "concierge"} onClick={() => setPersona("concierge")} title="Concierge" />
            <PersonaOption active={persona === "engineer"} onClick={() => setPersona("engineer")} title="Engineer" />
            <PersonaOption active={persona === "executive"} onClick={() => setPersona("executive")} title="Executive" />
            <PersonaOption active={persona === "creative"} onClick={() => setPersona("creative")} title="Creative" />
          </div>
        </section>
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Database className="h-3 w-3" /> Knowledge</h3>
          <Textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Context injection..." className="min-h-[120px] bg-muted/5 border-glass-border/20 rounded-xl p-3 text-xs" />
        </section>
      </div>
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Zap className="h-3 w-3" /> Controls</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-glass-border/10">
              <span className="text-xs font-bold">Voice Synthesis</span>
              <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} className="h-4 w-4 accent-blue-500" />
            </div>
            <Button onClick={saveSettings} disabled={saving} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-xl font-bold text-[11px] w-full mt-4 shadow-xl shadow-blue-500/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile Settings"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function PersonaOption({ active, onClick, title }: { active: boolean; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} className={`text-left px-4 py-3 rounded-xl border transition-all text-xs font-bold ${active ? "bg-blue-500/10 border-blue-500 text-blue-500 shadow-sm" : "border-glass-border/20 hover:bg-muted/30"}`}>{title}</button>
  );
}

function StatusItem({ label, value, status }: { label: string; value: string; status?: "online" | "offline" }) {
  return (
    <div className="flex items-center justify-between py-1"><span className="text-[9px] font-bold text-muted-foreground/50">{label}</span><div className="flex items-center gap-1.5">{status && <span className={`h-1 w-1 rounded-full ${status === "online" ? "bg-green-500" : "bg-red-500"}`} />}<span className="text-xs font-bold">{value}</span></div></div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/60">
        {icon} {label}
      </div>
      <h4 className="text-3xl font-black tracking-tighter text-foreground">{value}</h4>
    </div>
  );
}

function StatDetailCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-4 border-b border-glass-border/20">
      <div className="text-blue-500">{icon}</div>
      <div>
        <p className="text-[9px] font-bold text-muted-foreground/40">{title}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>{icon}<span>{label}</span></button>
  );
}
