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
      <div className="relative h-10 w-10 flex items-center justify-center">
        {/* Subtle Pulse Ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping duration-1000" />
        
        {/* AI Icon Image (Circular) */}
        <div className="relative h-10 w-10 rounded-full bg-black shadow-glow flex items-center justify-center overflow-hidden border border-white/10">
          <img 
            src="/loader-icon.png" 
            alt="AI Loading" 
            className="h-full w-full object-cover animate-float"
          />
          {/* Shimmer Effect */}
          <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] animate-shimmer" />
        </div>
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
