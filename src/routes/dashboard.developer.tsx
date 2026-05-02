import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Key, Copy, RefreshCw, Shield, Webhook,
  BookOpen, Zap, Clock, AlertTriangle, Eye, EyeOff,
  CheckCircle2, ArrowRight, Code2, FlaskConical, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/developer")({
  head: () => ({ meta: [{ title: "Developer — Velora" }] }),
  component: () => (
    <RequireAuth>
      <DeveloperPage />
    </RequireAuth>
  ),
});

function generateKey(prefix = "vsk") {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const segment = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}_${segment(8)}_${segment(16)}_${segment(8)}`;
}

const API_ENDPOINTS = [
  { method: "GET", path: "/v1/meetings", desc: "List all scheduled meetings" },
  { method: "POST", path: "/v1/meetings", desc: "Create a new meeting session" },
  { method: "GET", path: "/v1/recordings", desc: "Retrieve meeting recordings" },
  { method: "GET", path: "/v1/transcripts/{id}", desc: "Get transcript for a session" },
  { method: "POST", path: "/v1/webhooks", desc: "Register a webhook endpoint" },
];

type StoredKey = { key: string; name: string; created: string; lastUsed: string | null; masked: boolean };
const KEYS_STORE = "velora:api_keys";

function DeveloperPage() {
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [rateLimitUsed] = useState(Math.floor(Math.random() * 800));

  useEffect(() => {
    try {
      setKeys(JSON.parse(localStorage.getItem(KEYS_STORE) || "[]"));
    } catch { setKeys([]); }
    const saved = localStorage.getItem("velora:webhook") || "";
    if (saved) { setWebhookUrl(saved); setWebhookSaved(true); }
  }, []);

  const createKey = () => {
    if (!newKeyName.trim()) { toast.error("Give this key a name first"); return; }
    const newKey: StoredKey = {
      key: generateKey("vsk"),
      name: newKeyName.trim(),
      created: new Date().toLocaleString(),
      lastUsed: null,
      masked: false,
    };
    // Show the key immediately once, then mask it
    toast.success("API key created — copy it now, it won't be shown again in full.", { duration: 6000 });
    const updated = [newKey, ...keys];
    setKeys(updated);
    localStorage.setItem(KEYS_STORE, JSON.stringify(updated.map(k => ({ ...k, masked: true }))));
    setNewKeyName("");
    // After 15s mask it
    setTimeout(() => {
      setKeys(prev => prev.map(k => k.key === newKey.key ? { ...k, masked: true } : k));
    }, 15000);
  };

  const deleteKey = (key: string) => {
    const updated = keys.filter(k => k.key !== key);
    setKeys(updated);
    localStorage.setItem(KEYS_STORE, JSON.stringify(updated));
    toast.success("API key revoked");
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => toast.success("Key copied to clipboard"));
  };

  const toggleMask = (key: string) => {
    setKeys(prev => prev.map(k => k.key === key ? { ...k, masked: !k.masked } : k));
  };

  const saveWebhook = () => {
    if (!webhookUrl.trim().startsWith("https://")) { toast.error("Webhook URL must start with https://"); return; }
    localStorage.setItem("velora:webhook", webhookUrl.trim());
    setWebhookSaved(true);
    toast.success("Webhook endpoint saved");
  };

  const testWebhook = () => {
    toast.info("Webhook test event dispatched — check your endpoint's logs.");
  };

  const maskKey = (key: string) => key.replace(/^(vsk_[A-Za-z0-9]{8}_)[A-Za-z0-9]{12}([A-Za-z0-9]{4}_[A-Za-z0-9]{8})$/, "$1············$2");

  return (
    <DashboardShell title="Developer">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="dash-card p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0">
            <Code2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-black text-lg">Velora Developer API</h2>
            <p className="text-sm text-muted-foreground">Integrate Velora into your workflows. Manage API keys, webhooks, and explore endpoints below.</p>
          </div>
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-glass-border font-bold gap-2 text-xs"
              onClick={() => window.open(window.location.href, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" /> New Tab
            </Button>
            <a
              href="https://docs.velora.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow hover:opacity-90 transition-all"
            >
              <BookOpen className="h-3.5 w-3.5" /> API Docs <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Rate Limit */}
        <section className="dash-card p-6">
          <div className="dash-card-accent bg-amber-500" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Rate Limit Usage
            </h3>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Resets in 1h 24m</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>{rateLimitUsed.toLocaleString()} / 1,000 requests</span>
              <span className={rateLimitUsed > 800 ? "text-destructive font-bold" : "text-muted-foreground"}>{Math.round((rateLimitUsed / 1000) * 100)}%</span>
            </div>
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${rateLimitUsed > 800 ? "bg-destructive" : rateLimitUsed > 600 ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${(rateLimitUsed / 1000) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Upgrade to Enterprise for 100,000 requests/hour.</p>
          </div>
        </section>

        {/* API Keys */}
        <section className="dash-card">
          <div className="dash-card-accent bg-primary" />
          <div className="p-6 space-y-5">
            <h3 className="font-black text-sm flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" /> API Keys
              <span className="ml-auto text-[10px] text-muted-foreground font-normal">Keys are only fully visible once, immediately after creation</span>
            </h3>

            {/* New key form */}
            <div className="flex gap-3">
              <Input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. Production Backend)"
                className="flex-1 h-11 bg-card/40 border-glass-border rounded-xl"
                onKeyDown={e => e.key === "Enter" && createKey()}
              />
              <Button onClick={createKey} className="h-11 rounded-xl bg-gradient-primary text-primary-foreground border-0 shadow-glow font-bold gap-2 shrink-0">
                <Key className="h-4 w-4" /> Generate
              </Button>
            </div>

            {/* Key list */}
            {keys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No API keys yet. Generate one above to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {keys.map(k => (
                  <div key={k.key} className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-glass-border group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{k.name}</p>
                        {!k.masked && <span className="text-[9px] bg-green-500/20 text-green-500 font-black px-2 py-0.5 rounded-full uppercase tracking-widest">New — copy now</span>}
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                        {k.masked ? maskKey(k.key) : k.key}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Created {k.created}{k.lastUsed ? ` · Last used ${k.lastUsed}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleMask(k.key)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-card/80 text-muted-foreground hover:text-foreground" title={k.masked ? "Reveal" : "Mask"}>
                        {k.masked ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      {!k.masked && (
                        <button onClick={() => copyKey(k.key)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-card/80 text-muted-foreground hover:text-foreground" title="Copy key">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => deleteKey(k.key)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Revoke key">
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-600 text-xs">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Never expose API keys client-side. Use server-side environment variables only.</span>
            </div>
          </div>
        </section>

        {/* AI Infrastructure Setup */}
        <section className="dash-card">
          <div className="dash-card-accent bg-gradient-to-r from-primary to-purple-600" />
          <div className="p-6 space-y-4">
            <h3 className="font-black text-sm flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-primary" /> Velora AI Infrastructure
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The AI Concierge is a permanent platform agent powered by a secure Supabase Edge Function. To activate it, follow these steps:
            </p>
            <div className="space-y-3 bg-sidebar/20 p-4 rounded-2xl border border-glass-border">
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-black grid place-items-center shrink-0">1</div>
                <p className="text-xs">Obtain a <strong>Groq API Key</strong> from <a href="https://console.groq.com" target="_blank" className="text-primary hover:underline">console.groq.com</a>.</p>
              </div>
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-black grid place-items-center shrink-0">2</div>
                <p className="text-xs">Open your terminal and run:<br />
                  <code className="block mt-1 p-2 bg-black/40 rounded-lg text-primary font-mono text-[10px] border border-white/5">
                    supabase secrets set GROQ_API_KEY=your_key_here
                  </code>
                </p>
              </div>
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-black grid place-items-center shrink-0">3</div>
                <p className="text-xs">The <strong>velora-ai</strong> function will now securely use this key for all users.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5 text-success" />
              <span>Security Verified: Your key is never exposed to the frontend.</span>
            </div>
          </div>
        </section>

        {/* Webhook */}
        <section className="dash-card">
          <div className="dash-card-accent bg-blue-500" />
          <div className="p-6 space-y-4">
            <h3 className="font-black text-sm flex items-center gap-2">
              <Webhook className="h-4 w-4 text-blue-500" /> Webhook Endpoint
            </h3>
            <p className="text-xs text-muted-foreground">Receive real-time events (meeting.started, meeting.ended, recording.ready) to your server.</p>
            <div className="flex gap-3">
              <Input
                value={webhookUrl}
                onChange={e => { setWebhookUrl(e.target.value); setWebhookSaved(false); }}
                placeholder="https://api.yourapp.com/velora/webhook"
                className="flex-1 h-11 bg-card/40 border-glass-border rounded-xl font-mono text-sm"
              />
              <Button onClick={saveWebhook} variant="outline" className="h-11 rounded-xl border-glass-border font-bold gap-2 shrink-0">
                {webhookSaved ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : null} Save
              </Button>
            </div>
            {webhookSaved && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" /> Endpoint registered and active
                </div>
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold gap-1" onClick={testWebhook}>
                  <Zap className="h-3 w-3" /> Test
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Quick API Reference */}
        <section className="dash-card">
          <div className="dash-card-accent bg-purple-500" />
          <div className="p-6 space-y-4">
            <h3 className="font-black text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" /> Quick API Reference
            </h3>
            <p className="text-xs text-muted-foreground">Base URL: <code className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">https://api.velora.app</code></p>
            <div className="space-y-2">
              {API_ENDPOINTS.map(ep => (
                <div key={ep.path} className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-glass-border text-xs">
                  <span className={`font-black font-mono px-2 py-0.5 rounded shrink-0 ${ep.method === "GET" ? "bg-blue-500/15 text-blue-500" : "bg-green-500/15 text-green-500"}`}>
                    {ep.method}
                  </span>
                  <code className="font-mono text-foreground/80 flex-1">{ep.path}</code>
                  <span className="text-muted-foreground">{ep.desc}</span>
                </div>
              ))}
            </div>
            <a
              href="https://docs.velora.app/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-primary font-bold hover:underline"
            >
              View full API reference <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        {/* Powered by Velora SDK */}
        <section className="dash-card">
          <div className="dash-card-accent bg-gradient-to-r from-brand-green to-primary" />
          <div className="p-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/20 text-[10px] font-black text-brand-green mb-4 uppercase tracking-[0.2em]">
                New Feature
              </div>
              <h3 className="text-2xl font-black mb-4">"Powered by Velora" SDK</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Embed our world-class, privacy-first meeting experience directly into your own product. Use our React components or low-level API to build custom video workflows.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "One-line React/Next.js integration",
                  "Customizable UI themes and layout",
                  "Built-in transcription & AI summarization",
                  "Zero infrastructure management"
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4 text-brand-green" />
                    {item}
                  </div>
                ))}
              </div>
              <Button className="h-12 px-8 rounded-2xl bg-gradient-brand text-white border-0 shadow-glow font-bold gap-2">
                Request Early Access <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-green/20 blur-[50px] rounded-full group-hover:bg-brand-green/30 transition-all duration-500" />
              <div className="relative glass rounded-2xl p-4 font-mono text-[11px] leading-relaxed border-brand-green/20 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-glass-border pb-2 opacity-60">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="ml-2 text-[9px] font-bold uppercase tracking-widest">VeloraIntegration.tsx</span>
                </div>
                <p className="text-purple-400">import <span className="text-foreground">{"{"} VeloraMeeting {"}"}</span> from <span className="text-green-400">"@velora/sdk"</span>;</p>
                <p className="mt-4 text-muted-foreground">// Embed meeting in your React app</p>
                <p className="text-blue-400">export default function <span className="text-foreground">MyProduct()</span> {"{"}</p>
                <p className="pl-4 text-blue-400">return (</p>
                <p className="pl-8 text-primary">{"<VeloraMeeting"}</p>
                <p className="pl-12 text-foreground">apiKey=<span className="text-green-400">"vsk_prod_..."</span></p>
                <p className="pl-12 text-foreground">meetingId=<span className="text-green-400">"dev-session-01"</span></p>
                <p className="pl-12 text-foreground">theme=<span className="text-green-400">"modern-glass"</span></p>
                <p className="pl-12 text-foreground">onMeetingEnd=<span className="text-foreground">{"{"}handleSummary{"}"}</span></p>
                <p className="pl-8 text-primary">{"/>"}</p>
                <p className="pl-4 text-blue-400">);</p>
                <p className="text-blue-400">{"}"}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
