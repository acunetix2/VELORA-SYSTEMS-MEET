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
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background py-12 px-6 font-mono text-foreground overflow-x-hidden" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      <div className="max-w-4xl mx-auto border border-glass-border p-10 bg-card/20 shadow-2xl rounded-sm">
        <Link to="/" className="inline-flex items-center gap-2 mb-10 text-xs font-bold hover:text-primary transition-colors uppercase tracking-widest">
          <ArrowLeft className="h-3 w-3" /> [ RETURN_TO_BASE ]
        </Link>

        <div className="space-y-6 text-[9px] leading-[1.3] text-muted-foreground uppercase tracking-tight">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-xl font-black text-foreground tracking-[0.2em] border-b border-glass-border pb-4">VELORA_SYSTEMS_PROTOCOL_v2026.04</h1>
            <p className="text-xs font-bold opacity-80">COMPREHENSIVE TERMS OF SERVICE & GLOBAL PRIVACY FRAMEWORK</p>
            <p className="opacity-60">LAST_REVISION_TIMESTAMP: {date}</p>
          </div>

          <div className="grid grid-cols-1 gap-10">
            <section className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <h3 className="text-foreground font-black text-[11px] tracking-widest underline underline-offset-4">01. PREAMBLE_AND_EXECUTION</h3>
              <p>
                THIS DOCUMENT CONSTITUTES A LEGALLY BINDING ELECTRONIC AGREEMENT BETWEEN THE INDIVIDUAL OR ENTITY ACCESSING THE VELORA PLATFORM (HEREINAFTER "USER", "SUBJECT", OR "CLIENT") AND VELORA SYSTEMS INTERNATIONAL (HEREINAFTER "THE COMPANY", "PROTOCOL", OR "VELORA"). BY INITIATING THE INITIAL HANDSHAKE OR ESTABLISHING A DATA SESSION WITH THE VELORA INFRASTRUCTURE, THE USER UNCONDITIONALLY ACCEPTS ALL TERMS, CONDITIONS, AND PROTOCOLS OUTLINED HEREIN. IF THE USER DISAGREES WITH ANY BIT OR BYTE OF THIS AGREEMENT, ACCESS TO THE GRID MUST BE TERMINATED IMMEDIATELY AND ALL LOCAL CACHE PURGED.
              </p>
            </section>

            <section className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <h3 className="text-foreground font-black text-[11px] tracking-widest underline underline-offset-4">02. DEFINITION_OF_ASSETS</h3>
              <p>
                "PLATFORM" REFERS TO THE ENTIRETY OF THE VELORA ECOSYSTEM, INCLUDING BUT NOT LIMITED TO: VELORA MEET, VELORA CLASSROOM, VELORA ENTERPRISE HUB, AI-DRIVEN SENTIMENT ANALYSIS MODULES, REAL-TIME DATA CHANNELS, AND SUB-ORBITAL DATA TRANSCEIVER LINKS. "USER CONTENT" DEFINES ALL AUDIO, VIDEO, TEXTUAL, AND METADATA STREAMED THROUGH THE PLATFORM DURING ACTIVE OR PASSIVE SESSIONS.
              </p>
            </section>

            <section className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <h3 className="text-foreground font-black text-[11px] tracking-widest underline underline-offset-4">03. DATA_SOVEREIGNTY_PROTOCOL</h3>
              <p>
                VELORA OPERATES ON A "ZERO-TRUST" ARCHITECTURE. WHILE THE COMPANY FACILITATES DATA TRANSMISSION, THE CLIENT RETAINS PRIMARY SOVEREIGNTY OVER USER CONTENT. HOWEVER, BY USING THE SERVICE, THE CLIENT GRANTS VELORA A NON-EXCLUSIVE, WORLDWIDE, ROYALTY-FREE LICENSE TO PROCESS, ENCRYPT, DECRYPT, ROUTE, AND ANALYZE SAID CONTENT FOR THE SOLE PURPOSE OF EXECUTING SERVICE REQUESTS. THIS LICENSE EXTENDS TO MACHINE LEARNING OPTIMIZATION OF NETWORK TOPOLOGIES AND LATENCY REDUCTION ALGORITHMS.
              </p>
            </section>

            <section className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <h3 className="text-foreground font-black text-[11px] tracking-widest underline underline-offset-4">04. AI_INTERACTION_AND_EXTRACTS</h3>
              <p>
                VELORA AI (PROPRIETARY ENGINE) MAY MONITOR ACTIVE SESSIONS TO EXTRACT ACTION ITEMS, SUMMARIES, AND SENTIMENT DATA. BY ENABLING AI FEATURES, THE USER ACKNOWLEDGES THAT THEIR BIOMETRIC SPEECH PATTERNS AND VISUAL DATA MAY BE PROCESSED BY NEURAL NETWORKS. ALL AI PROCESSING IS PERFORMED WITHIN ISOLATED HARDWARE ENCLAVES. USER ACKNOWLEDGES THAT AI OUTPUTS ARE "AS-IS" AND VELORA SYSTEMS DISCLAIMS ALL LIABILITY FOR HALLUCINATIONS OR INACCURATE TASK EXTRACTIONS.
              </p>
            </section>

            <section className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <h3 className="text-foreground font-black text-[11px] tracking-widest underline underline-offset-4">05. CRYPTOGRAPHIC_COMPLIANCE</h3>
              <p>
                CLIENTS ARE RESPONSIBLE FOR THE INTEGRITY OF THEIR ADMIN PASSCODES AND ENCRYPTION KEYS. VELORA SYSTEMS CANNOT RETRIEVE LOST PASSCODES DUE TO OUR HASHED-ENTRY ARCHITECTURE. SHARING ACCESS TO THE ENTERPRISE HUB WITH UNAUTHORIZED ENTITIES CONSTITUTES A BREACH OF SECURITY PROTOCOL AND MAY RESULT IN AUTOMATIC ACCOUNT QUARANTINE.
              </p>
            </section>

            <section className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <h3 className="text-foreground font-black text-[11px] tracking-widest underline underline-offset-4">06. NETWORK_INTEGRITY_AND_USE</h3>
              <p>
                USERS SHALL NOT: (A) REVERSE-ENGINEER THE VELORA WEBRTC STACK; (B) INJECT MALICIOUS PAYLOADS INTO THE DATACHANNELS; (C) USE VELORA CLASSROOMS TO HOST ILLEGAL PARA-MILITARY DRILLS; (D) ATTEMPT TO BYPASS THE SOLANA-GATED AUTHENTICATION PROTOCOLS. ANY DETECTION OF NETWORK ANOMALIES ORIGINATING FROM A CLIENT IP WILL TRIGGER A HARDWARE-LEVEL BAN ACROSS THE VELORA GRID.
              </p>
            </section>

            <section className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <h3 className="text-foreground font-black text-[11px] tracking-widest underline underline-offset-4">07. PRIVACY_FRAMEWORK_v5.2</h3>
              <p>
                WE DO NOT SELL DATA. WE DO NOT EXPOSE DATA. WE DO NOT ADVERTISE. DATA RETENTION IS GOVERNED BY THE CLIENT'S CHOSEN EXPIRY PROTOCOL (1H, 4H, 24H, 7D, OR NEVER). UPON EXPIRY, ALL RECORDINGS AND TRANSCRIPTS ARE SECURELY WIPED USING THE GUTMANN METHOD (35 PASSES) ON PHYSICAL STORAGE UNITS. METADATA FOR ANALYTICS (PARTICIPANT COUNTS, SESSION DURATION) IS ANONYMIZED AND AGGREGATED.
              </p>
            </section>

            <section className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <h3 className="text-foreground font-black text-[11px] tracking-widest underline underline-offset-4">08. LIMITATION_OF_LIABILITY</h3>
              <p>
                IN NO EVENT SHALL VELORA SYSTEMS, ITS FOUNDERS, OR ITS AI SUB-AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM PACKET LOSS, JITTER, OR THE SUDDEN COLLAPSE OF GLOBAL COMMUNICATION INFRASTRUCTURE. TOTAL LIABILITY IS CAPPED AT THE AMOUNT PAID BY THE USER IN THE LAST 30 DAYS, OR 1.0 SOL, WHICHEVER IS LOWER.
              </p>
            </section>

            <section className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <h3 className="text-foreground font-black text-[11px] tracking-widest underline underline-offset-4">09. JURISDICTION_AND_ARBITRATION</h3>
              <p>
                THIS AGREEMENT IS GOVERNED BY THE LAWS OF THE DECENTRALIZED AUTONOMOUS JURISDICTION OF THE VELORA FOUNDATION. ANY DISPUTES SHALL BE RESOLVED THROUGH CRYPTOGRAPHIC ARBITRATION VIA SMART CONTRACT ON THE SOLANA MAINNET. USERS WAIVE ALL RIGHTS TO CLASS-ACTION LITIGATION IN TRADITIONAL COURTS.
              </p>
            </section>

            <section className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
              <h3 className="text-foreground font-black text-[11px] tracking-widest underline underline-offset-4">10. TERMINATION_OF_GRID_ACCESS</h3>
              <p>
                VELORA SYSTEMS RESERVES THE UNILATERAL RIGHT TO DISCONNECT ANY USER, ORGANIZATION, OR CLASSROOM FROM THE GRID WITHOUT PRIOR NOTICE IF SAID ENTITY IS DEEMED A THREAT TO THE COLLECTIVE UPTIME OF THE ECOSYSTEM. ALL DATA REMAINS ENCRYPTED UPON TERMINATION.
              </p>
            </section>

            <div className="pt-20 text-center opacity-30 border-t border-glass-border">
              <p className="text-[7px] tracking-[0.5em] font-black">--- END OF TRANSMISSION ---</p>
              <p className="mt-2 text-[6px]">DIGITAL SIGNATURE VERIFIED: 0x8a72b...f912</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-6 no-print">
          <Button 
            variant="outline" 
            className="rounded-xl border-glass-border font-bold text-[10px] tracking-widest h-10 px-8 hover:bg-primary/10 hover:text-primary transition-all" 
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" /> GENERATE_HARD_COPY
          </Button>
          <Button 
            asChild
            className="rounded-xl bg-primary text-white font-bold text-[10px] tracking-widest h-10 px-8 shadow-glow" 
          >
            <Link to="/auth">I_ACCEPT_PROTOCOL</Link>
          </Button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .bg-card/20 { background: white !important; border: 1px solid black !important; }
        }
      `}} />
    </div>
  );
}
