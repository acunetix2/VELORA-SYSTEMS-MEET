import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { HelpCircle, Search, MessageSquare, MessageCircle, Book, Shield, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

function DashboardFAQComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/faq")({
  head: () => ({ meta: [{ title: "FAQ — Velora" }] }),
  component: DashboardFAQComponent,
});

function Page() {
  const [search, setSearch] = useState("");

  return (
    <DashboardShell title="Help & Support">
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-8">
        {/* Search */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">How can we help?</h2>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search help articles..." 
              className="pl-9 h-12 bg-input/60 border-glass-border rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid sm:grid-cols-3 gap-4">
          <SupportCard icon={<Zap className="h-5 w-5 text-yellow-500" />} title="Getting Started" />
          <SupportCard icon={<Shield className="h-5 w-5 text-blue-500" />} title="Privacy & Security" />
          <SupportCard icon={<MessageCircle className="h-5 w-5 text-brand-green" />} title="Troubleshooting" />
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Common Questions</h3>
          <div className="grid gap-3">
            {[
              "How do I record a meeting?",
              "Can I change my background?",
              "How to share my screen with audio?",
              "Setting up breakout rooms",
              "Inviting external guests",
            ].map((q) => (
              <button key={q} className="w-full text-left p-4 rounded-xl glass border-glass-border hover:border-brand-green/30 transition-smooth flex items-center justify-between group">
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">{q}</span>
                <Book className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-green/10 to-transparent border border-brand-green/20 text-center">
          <MessageSquare className="h-8 w-8 text-brand-green mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Can't find what you're looking for?</h3>
          <p className="text-sm text-muted-foreground mb-6">Our support team is available 24/7 to assist you with any technical issues.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="mailto:support@velora.app" className="rounded-xl bg-brand-green text-primary-foreground px-6 py-2.5 font-semibold text-sm shadow-brand hover:opacity-90 transition-smooth">
              Email Support
            </a>
            <button className="rounded-xl glass px-6 py-2.5 font-semibold text-sm hover:bg-card/60 transition-smooth">
              Live Chat
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function SupportCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="p-6 rounded-2xl glass border-glass-border hover:border-brand-green/30 cursor-pointer text-center group transition-smooth">
      <div className="h-10 w-10 rounded-xl bg-muted grid place-items-center mx-auto mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
    </div>
  );
}
