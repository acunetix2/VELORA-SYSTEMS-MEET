import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        <div className="h-16 flex items-center justify-between gap-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {[
              { to: "/", label: "Home" },
              { to: "/about", label: "About" },
              { to: "/enterprise", label: "Enterprise" },
              { to: "/academy", label: "Academy" },
              { to: "/faq", label: "FAQ" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-smooth"
                activeProps={{ className: "px-3 py-2 rounded-md text-foreground bg-muted/60 font-medium" }}
                activeOptions={{ exact: true }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth" search={{ mode: "signin" }}>Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
