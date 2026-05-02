import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-[#f4f1ea] py-12 px-4 font-mono text-[#2d2d2d]">
      <div className="max-w-xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 text-sm hover:opacity-70 transition-opacity">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] p-8 md:p-12 relative overflow-hidden">
          {/* Receipt Top Jagged Edge */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#f4f1ea]" style={{
            clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)"
          }} />

          {/* Receipt Header */}
          <div className="text-center mb-10 space-y-2 border-b-2 border-dashed border-gray-200 pb-8">
            <h1 className="text-2xl font-bold uppercase tracking-widest">Velora Systems</h1>
            <p className="text-xs opacity-60">Next-Gen Collaboration Protocol</p>
            <p className="text-xs opacity-60">Global Operations Center</p>
            <div className="pt-4 text-sm font-bold uppercase">
              Terms of Service & Privacy
            </div>
          </div>

          {/* Receipt Content */}
          <div className="space-y-8 text-sm leading-relaxed">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span>DOCUMENT NO:</span>
              <span>VST-2026-001</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span>ISSUED ON:</span>
              <span>{date}</span>
            </div>

            <section className="space-y-4 pt-4">
              <h3 className="font-bold border-b-2 border-gray-100 inline-block">1. ACCEPTANCE OF TERMS</h3>
              <p>
                BY ACCESSING OR USING VELORA, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE, PLEASE DISCONTINUE USE IMMEDIATELY.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="font-bold border-b-2 border-gray-100 inline-block">2. USER RESPONSIBILITY</h3>
              <p>
                USERS ARE RESPONSIBLE FOR MAINTAINING THE CONFIDENTIALITY OF THEIR PASSCODES AND ACCOUNTS. ALL ACTIVITY UNDER AN ACCOUNT IS THE RESPONSIBILITY OF THE USER.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="font-bold border-b-2 border-gray-100 inline-block">3. PRIVACY & DATA</h3>
              <p>
                VELORA PRIORITIZES END-TO-END SECURITY. WE DO NOT SELL YOUR PERSONAL DATA. MEETING TRANSCRIPTS AND RECORDINGS ARE STORED ENCRYPTED AND ACCESSIBLE ONLY BY AUTHORIZED USERS.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="font-bold border-b-2 border-gray-100 inline-block">4. PROHIBITED CONDUCT</h3>
              <p>
                USERS MAY NOT USE THE SERVICE FOR ILLEGAL PURPOSES, HARASSMENT, OR TO INTERFERE WITH THE NETWORK INTEGRITY OF VELORA SYSTEMS.
              </p>
            </section>

            <div className="border-t-2 border-dashed border-gray-200 pt-8 mt-12 text-center space-y-4">
              <div className="flex justify-center mb-4">
                <ShieldCheck className="h-12 w-12 opacity-20" />
              </div>
              <p className="text-xs italic opacity-70 italic font-medium uppercase tracking-tighter leading-tight">
                This document serves as a binding agreement between the user and Velora Systems.
              </p>
              <div className="flex items-center justify-center gap-2 py-4">
                <span className="h-10 w-1 bg-black opacity-10"></span>
                <span className="h-10 w-0.5 bg-black opacity-10"></span>
                <span className="h-10 w-2 bg-black opacity-10"></span>
                <span className="h-10 w-0.5 bg-black opacity-10"></span>
                <span className="h-10 w-1 bg-black opacity-10"></span>
                <span className="h-10 w-3 bg-black opacity-10"></span>
                <span className="h-10 w-0.5 bg-black opacity-10"></span>
                <span className="h-10 w-1 bg-black opacity-10"></span>
              </div>
              <p className="text-[10px] opacity-40">** END OF DOCUMENT **</p>
            </div>
          </div>

          {/* Receipt Bottom Jagged Edge */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#f4f1ea]" style={{
            clipPath: "polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)"
          }} />
        </div>

        <div className="mt-8 flex justify-center gap-4 no-print">
          <Button variant="outline" className="rounded-full border-gray-300 font-bold" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print Receipt
          </Button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .bg-white { box-shadow: none !important; }
        }
      `}} />
    </div>
  );
}
