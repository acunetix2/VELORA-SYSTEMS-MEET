import { useState, useEffect, useRef } from "react";
import { 
  X, Send, Bot, User, Sparkles, Loader2, 
  MessageCircle, Headphones, Info, ShieldCheck,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { EllaIcon } from "@/components/EllaIcon";
import { supabase } from "@/integrations/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AiAssistant({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm Velora AI, your assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("velora-ai", {
        body: { 
          messages: [
            ...messages,
            { role: "user", content: userMsg }
          ] 
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }
      
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        setMessages(prev => [...prev, data.choices[0].message]);
      } else {
        console.error("Unexpected response format from AI:", data);
        throw new Error("Invalid response format from AI");
      }
    } catch (err) {
      toast.error("Velora AI is temporarily unavailable.");
      console.error("AI Assistant Error:", err);
      if (err instanceof Error) {
        console.error("Error Message:", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] sm:m-4 sm:h-[calc(100vh-32px)] bg-background/60 backdrop-blur-3xl border border-glass-border shadow-[0_0_50px_rgba(0,0,0,0.3)] z-[60] flex flex-col animate-in slide-in-from-right duration-500 ease-out sm:rounded-[32px] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-glass-border bg-sidebar/20 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 shadow-brand rounded-full overflow-hidden ring-2 ring-primary/20">
            <EllaIcon />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Velora AI
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground/60 leading-none">
              Powered by Velora Systems Inc
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onOpenChange(false)} 
          className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(circle_at_top_right,var(--primary-muted),transparent_40%)]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`} style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`group relative max-w-[85%] ${
              m.role === "user" ? "items-end" : "items-start"
            } flex flex-col gap-2`}>
              <div className={`flex items-center gap-2 px-1 opacity-40 group-hover:opacity-100 transition-opacity ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}>
                {m.role === "user" ? <User className="h-3 w-3" /> : (
                  <div className="h-3.5 w-3.5">
                    <EllaIcon />
                  </div>
                )}
                <span className="text-[10px] font-bold">
                  {m.role === "user" ? "You" : "Velora"}
                </span>
              </div>
              
              <div className={`px-5 py-3.5 text-sm leading-relaxed shadow-xl backdrop-blur-md transition-all duration-300 rounded-[22px] ${
                m.role === "user" 
                  ? "bg-primary text-primary-foreground hover:shadow-glow shadow-primary/10" 
                  : "bg-card/40 border border-glass-border text-foreground hover:bg-card/60 shadow-black/5"
              }`}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-card/30 border border-glass-border rounded-[22px] px-5 py-3.5 backdrop-blur-md">
              <div className="flex gap-1.5">
                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-glass-border bg-sidebar/10 backdrop-blur-xl">
        <form onSubmit={sendMessage} className="relative group">
          <Input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="How can I help you today?"
            className="h-14 bg-card/30 border-glass-border rounded-[20px] pl-5 pr-14 focus:ring-primary/20 focus:bg-card/50 transition-all placeholder:text-muted-foreground/40 text-sm shadow-inner"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-1.5 top-1.5 h-11 w-11 rounded-[16px] bg-gradient-brand text-primary-foreground shadow-brand hover:scale-105 active:scale-95 transition-all duration-300 border-0"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-3 opacity-30">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-muted-foreground" />
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">
            Powered by Velora Systems
          </p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
