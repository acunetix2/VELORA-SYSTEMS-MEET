import React from "react";

interface LoaderProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "inline";
}

export function Loader({ label = "Loading...", className = "", size = "md", variant = "full", fullScreen = false }: LoaderProps & { fullScreen?: boolean }) {
  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="h-1 w-1 rounded-full bg-current animate-bounce" />
        <span className="h-1 w-1 rounded-full bg-current animate-bounce delay-150" />
        <span className="h-1 w-1 rounded-full bg-current animate-bounce delay-300" />
      </div>
    );
  }

  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl" 
    : "w-full py-16";

  return (
    <div className={`${containerClasses} flex flex-col items-center justify-center space-y-6 ${className}`}>
      {/* Patient Monitor Console (Slimmer Profile) */}
      <div className="relative h-16 w-36 rounded-[1.2rem] bg-black border border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/5">
        {/* Electronic Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.15]" 
          style={{ 
            backgroundImage: `linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)`,
            backgroundSize: '12px 12px'
          }} 
        />

        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full animate-scanline" />

        {/* EKG Heartbeat Wave */}
        <svg
          viewBox="0 0 100 40"
          className="absolute inset-0 w-full h-full text-[#00ff88]"
          style={{ filter: "drop-shadow(0 0 4px #00ff88)" }}
        >
          <path
            d="M0 20 H20 L25 15 L30 25 L35 20 H45 L50 5 L55 35 L60 20 H100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="heartbeat-monitor-path"
          />
        </svg>

        {/* Animation Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          .heartbeat-monitor-path {
            stroke-dasharray: 200;
            stroke-dashoffset: 200;
            animation: monitor-beat 2.5s linear infinite;
          }
          @keyframes monitor-beat {
            0% { stroke-dashoffset: 200; opacity: 0; }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0; }
          }
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          .animate-scanline {
            animation: scanline 4s linear infinite;
          }
        `}} />
      </div>

      {label && (
        <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-1000">
          <p className="text-[13px] font-medium text-muted-foreground tracking-widest">{label}</p>
          <div className="flex gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[#00ff88]/40 animate-pulse" />
            <span className="h-1 w-1 rounded-full bg-[#00ff88]/40 animate-pulse delay-150" />
            <span className="h-1 w-1 rounded-full bg-[#00ff88]/40 animate-pulse delay-300" />
          </div>
        </div>
      )}
    </div>
  );
}

// Add these to your global CSS for the shimmer and float effects if not already present:
/*
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
.animate-shimmer {
  animation: shimmer 2s infinite linear;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
*/