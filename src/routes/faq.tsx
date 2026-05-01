import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Velora Meet™" },
      { name: "description", content: "Common questions about Velora Meet. Security, recording, participants, and more." },
    ],
  }),
  component: FAQPage,
});

const FAQS = [
  {
    q: "Do I need to install anything to join a meeting?",
    a: "No. Velora Meet runs entirely in your browser. Just click the link and you're in. We support all modern browsers (Chrome, Firefox, Safari, Edge).",
  },
  {
    q: "Is Velora Meet really free?",
    a: "During our beta period, all core features are free for everyone. Our Enterprise plans offer additional governance and dedicated infrastructure for large organizations.",
  },
  {
    q: "How many people can join a meeting?",
    a: "Currently, we support up to 100 participants per call in the standard version. Enterprise users can host up to 2,000 participants.",
  },
  {
    q: "Is my meeting data private?",
    a: "Yes. Every stream is encrypted end-to-end using DTLS-SRTP. We never store your video or audio data on our servers.",
  },
  {
    q: "Can I record my meetings?",
    a: "Yes. You can record locally to your device or, with an Enterprise plan, record to the cloud with automatic transcripts and summaries.",
  },
  {
    q: "How do I invite others?",
    a: "Once you create a meeting, just copy the URL from your address bar or click the 'Invite' button in the dashboard to share the link via email or message.",
  },
];

function FAQPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-3xl">
        <div className="text-center mb-12">
          <div className="h-12 w-12 rounded-2xl bg-brand-green/10 text-brand-green grid place-items-center mx-auto mb-4">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-semibold">Frequently Asked <span className="text-gradient">Questions</span></h1>
          <p className="mt-4 text-muted-foreground">Everything you need to know about the Velora experience.</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} question={f.q} answer={f.a} />
          ))}
        </div>

        <div className="mt-16 glass rounded-3xl p-8 text-center border border-brand-green/20">
          <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
          <p className="text-sm text-muted-foreground mb-6">We're here to help you get the most out of Velora.</p>
          <a 
            href="mailto:support@velora.app" 
            className="inline-flex items-center justify-center rounded-xl bg-brand-green text-primary-foreground px-6 py-3 font-semibold shadow-brand hover:opacity-90 transition-smooth"
          >
            Contact Support
          </a>
        </div>
      </main>
    </div>
  );
}

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-smooth ${open ? "glass border-brand-green/30" : "glass border-glass-border"}`}>
      <button 
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium text-sm sm:text-base">{question}</span>
        {open ? <Minus className="h-4 w-4 text-brand-green shrink-0" /> : <Plus className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}
