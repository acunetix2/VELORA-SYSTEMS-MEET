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
    ? "fixed inset-0 z-[100] bg-background/80 backdrop-blur-md" 
    : "w-full py-12";

  return (
    <div className={`${containerClasses} flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative h-12 w-24 flex items-center justify-center">
        {/* Heartbeat SVG Wave */}
        <svg
          viewBox="0 0 100 40"
          className="w-full h-full text-primary"
          style={{ filter: "drop-shadow(0 0 8px rgba(var(--primary), 0.4))" }}
        >
          <path
            d="M0 20 H30 L35 10 L40 30 L45 20 H55 L60 0 L65 40 L70 20 H100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="heartbeat-path"
          />
        </svg>

        {/* CSS Animation for Heartbeat */}
        <style dangerouslySetInnerHTML={{ __html: `
          .heartbeat-path {
            stroke-dasharray: 200;
            stroke-dashoffset: 200;
            animation: heartbeat 2s linear infinite;
          }
          @keyframes heartbeat {
            0% { stroke-dashoffset: 200; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0; }
          }
        `}} />
      </div>

      {label && (
        <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <p className="text-[13px] font-medium text-muted-foreground tracking-tight">{label}</p>
          <div className="flex gap-1">
            <span className="h-1 w-1 rounded-full bg-primary/40 animate-bounce" />
            <span className="h-1 w-1 rounded-full bg-primary/40 animate-bounce delay-150" />
            <span className="h-1 w-1 rounded-full bg-primary/40 animate-bounce delay-300" />
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
