import { Link } from "@tanstack/react-router";

export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={`flex items-center gap-2 group ${className}`} aria-label="Velora Meet">
      {/* Multi-color Google-Meet style camera mark */}
      <span className="relative h-11 w-11 grid place-items-center rounded-xl bg-transparent border border-primary/15 transition-all duration-300 group-hover:bg-primary/5 group-hover:border-primary/30 group-hover:shadow-glow group-hover:scale-105 group-hover:-translate-y-0.5 overflow-hidden">
        <img src="/logo.png" alt="Velora Logo" className="h-full w-full object-contain p-1" />
      </span>
      {!compact && (
        <div className="flex items-baseline gap-0.5 leading-none">
          <span className="font-display font-bold text-[20px] tracking-tight text-foreground">
            Velora
          </span>
          <sup className="text-[10px] text-muted-foreground font-medium">™</sup>
          <span className="font-display text-[17px] tracking-tight text-muted-foreground ml-1">Meet</span>
        </div>
      )}
    </Link>
  );
}
