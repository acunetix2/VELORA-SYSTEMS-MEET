import React from "react";
import { BrainCircuit } from "lucide-react";

interface LoaderProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "inline";
}

export function Loader({ label = "Loading", className = "", size = "md", variant = "full", fullScreen = false }: LoaderProps & { fullScreen?: boolean }) {
  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce delay-150" />
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce delay-300" />
      </div>
    );
  }

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-28 w-28",
    xl: "h-40 w-40",
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[100] bg-background/80 backdrop-blur-md" 
    : "w-full py-12";

  return (
    <div className={`${containerClasses} flex flex-col items-center justify-center space-y-8 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Concentric Pulse Rings */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-brand-green/20 animate-ping duration-1000" />
        <div className="absolute inset-[-10px] rounded-[2.8rem] bg-primary/10 animate-pulse duration-1500 delay-300" />
        
        {/* Core AI Icon Container */}
        <div className="relative h-full w-full rounded-[2.2rem] bg-gradient-brand shadow-glow flex items-center justify-center overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]" />
          <div className="animate-float flex items-center justify-center">
             <BrainCircuit className="h-8 w-8 text-white brightness-125" />
          </div>
          
          {/* Shimmer Effect */}
          <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] animate-shimmer" />
        </div>
      </div>

      {label && (
        <div className="flex flex-col items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          <p className="text-[14px] font-medium tracking-tight text-foreground/70 uppercase tracking-widest">{label}</p>
          <div className="flex gap-1">
            <span className="h-1 w-1 rounded-full bg-brand-green animate-bounce" />
            <span className="h-1 w-1 rounded-full bg-brand-green animate-bounce delay-150" />
            <span className="h-1 w-1 rounded-full bg-brand-green animate-bounce delay-300" />
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
