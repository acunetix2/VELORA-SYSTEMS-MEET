import { cn } from "@/lib/utils";

export function EllaIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-full w-full grid place-items-center overflow-hidden rounded-full", className)}>
      {/* Deep Blue & Purple Dominant Base */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0066FF,#7C3AED,#000000)] animate-pulse" />
      
      {/* Saturated Blue & Purple Swirl */}
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#0066FF,#7C3AED,#FFFFFF,#0066FF)] animate-[spin_1.5s_linear_infinite] mix-blend-screen opacity-95" />
      
      {/* Intense Dual-Tone Edge Glow */}
      <div className="absolute inset-0 border-[3px] border-blue-400/60 rounded-full shadow-[0_0_20px_#0066FF,0_0_40px_rgba(0,102,255,0.4)]" />
      <div className="absolute inset-0 border-[3px] border-purple-400/40 rounded-full shadow-[0_0_25px_#7C3AED,0_0_50px_rgba(124,58,237,0.3)] animate-pulse" />
      
      {/* Glowing Core with Dual Aura */}
      <div className="relative h-[35%] w-[35%] bg-white rounded-full z-10 shadow-[0_0_30px_#FFFFFF,0_0_60px_#0066FF,0_0_90px_#7C3AED]" />
      
      {/* Extra Blue/Purple Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-purple-600/40 rounded-full" />
    </div>
  );
}
