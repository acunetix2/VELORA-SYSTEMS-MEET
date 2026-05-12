import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

function NotFoundComponent() {
  const { user } = useAuth();
  const homePath = user ? "/dashboard" : "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Logo className="scale-150" />
        </div>
        <h1 className="text-7xl font-black text-primary tracking-tighter">404</h1>
        <h2 className="mt-4 text-xl font-bold text-foreground uppercase tracking-widest">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
          The link you followed might be broken or the room has been closed.
        </p>
        <div className="mt-6">
          <Link
            to={homePath}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 shadow-glow"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const { user } = useAuth();
  const homePath = user ? "/dashboard" : "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Logo className="scale-150" />
        </div>
        <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl grid place-items-center mx-auto mb-6 border border-red-500/20 shadow-glow shadow-red-500/20">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-foreground uppercase tracking-wider">Something went wrong</h1>
        <p className="mt-4 text-xs font-bold text-muted-foreground leading-relaxed uppercase tracking-widest max-w-[300px] mx-auto">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 shadow-glow"
          >
            Try again
          </button>
          <Link
            to={homePath}
            className="inline-flex items-center justify-center rounded-xl bg-card border border-glass-border px-6 py-3 text-sm font-bold text-foreground transition-all hover:bg-muted"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Velora Meet — Next-gen video conferencing" },
      { name: "description", content: "Velora Meet" },
      { name: "author", content: "Velora Systems" },
      { property: "og:title", content: "Velora Meet — Next-gen video conferencing" },
      { property: "og:description", content: "Velora Meet" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Velora Meet — Next-gen video conferencing" },
      { name: "twitter:description", content: "Velora Meet" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/5690996d-f7b5-46b3-98f3-5cacd5111d20" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/5690996d-f7b5-46b3-98f3-5cacd5111d20" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/logo.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/logo.png",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </ThemeProvider>
  );
}
