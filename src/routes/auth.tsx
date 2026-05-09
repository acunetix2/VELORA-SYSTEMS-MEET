import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { setStoredName } from "@/lib/meeting";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { Loader } from "@/components/Loader";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
  mode: z.enum(["signin", "signup"]).optional().catch(undefined),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Velora Meet" },
      { name: "description", content: "Create your Velora Meet account or sign in to start a meeting." },
    ],
  }),
  component: AuthPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});
const signupSchema = credSchema.extend({
  displayName: z.string().trim().min(1, "Display name required").max(40, "Max 40 characters"),
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signup");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [show2fa, setShow2fa] = useState(false);
  const [busy, setBusy] = useState(false);

  // Already signed in → bounce to redirect target or dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: search.redirect ?? "/dashboard" });
    }
  }, [user, loading, navigate, search.redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ displayName, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        setBusy(true);
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: { display_name: parsed.data.displayName },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        setStoredName(parsed.data.displayName);
        toast.success("Account created — welcome to Velora!");
        // auto-confirm is on, so a session is created immediately; the effect above will redirect
      } else {
        const parsed = credSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        setBusy(true);
        const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }

        // Check if 2FA is enabled for this user
        const { data: prof } = await supabase
          .from("profiles")
          .select("mfa_enabled")
          .eq("user_id", authUser?.id)
          .single();

        if (prof?.mfa_enabled) {
          // Trigger OTP and switch to 2FA view
          await supabase.auth.signOut();
          const { error: otpErr } = await supabase.auth.signInWithOtp({ email: parsed.data.email });
          if (otpErr) throw otpErr;
          
          setShow2fa(true);
          toast.info("Security verification required", {
            description: "A 6-digit code has been sent to your email."
          });
        } else {
          toast.success("Welcome back");
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup' // or 'signin' - Supabase uses 'signup' for email OTP often but 'magiclink' works too
      });
      if (error) {
        // Try magiclink type if signup fails
        const { error: err2 } = await supabase.auth.verifyOtp({
          email,
          token: otpCode,
          type: 'magiclink'
        });
        if (err2) throw err2;
      }
      toast.success("Identity verified");
      navigate({ to: search.redirect ?? "/dashboard" });
    } catch (e) {
      toast.error("Invalid or expired verification code");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=signin`,
      });
      if (error) throw error;
      toast.success("Reset link sent to your email");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  const signInWithSocial = async (provider: "google" | "github") => {
    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Couldn't sign in with ${provider}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground selection:bg-primary/30 transition-smooth">
      {/* Left visual: Brand Experience */}
      <aside className="hidden lg:flex flex-col justify-between p-16 relative overflow-hidden bg-sidebar/40 border-r border-glass-border">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] h-[60%] w-[60%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] bg-success/15 blur-[100px] rounded-full" />
        
        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-[10px] uppercase tracking-widest text-primary font-bold mb-6">
            <span className="h-1 w-1 rounded-full bg-primary shadow-glow animate-ping" /> v2.4 Enterprise Edition
          </div>
          <h2 className="font-display text-5xl font-semibold leading-[1.1] tracking-tight text-foreground">
            Where teams <br />
            <span className="text-gradient">actually connect.</span>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg max-w-md leading-relaxed">
            Experience the next generation of video collaboration. No installs, just pure performance.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-8 border-t border-foreground/10 pt-8">
            <div>
              <p className="text-2xl font-bold text-foreground">100%</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">E2E Encrypted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">&lt;50ms</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Global Latency</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <p className="text-xs text-muted-foreground italic">Crafted by Velora Systems</p>
          <div className="flex gap-4">
             <div className="h-1 w-8 rounded-full bg-foreground/20" />
             <div className="h-1 w-4 rounded-full bg-foreground/10" />
             <div className="h-1 w-4 rounded-full bg-foreground/10" />
          </div>
        </div>
      </aside>

      {/* Right side: Modern Auth Form */}
      <main className="flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Mobile Background Accent */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent -z-10" />
        
        <div className="w-full max-w-[420px] space-y-8">
          <div className="lg:hidden flex justify-center mb-12"><Logo /></div>
          
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === "signup" ? "Start your journey with Velora Meet." : "Sign in to your enterprise workspace."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => signInWithSocial("google")}
                disabled={busy}
                className="h-12 rounded-xl glass border-glass-border hover:bg-card/80 gap-2 font-medium"
              >
                <GoogleLogo />
                <span className="hidden sm:inline">Google</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => signInWithSocial("github")}
                disabled={busy}
                className="h-12 rounded-xl glass border-glass-border hover:bg-card/80 gap-2 font-medium"
              >
                <GitHubLogo />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
            </div>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-glass-border" />
              <span className="flex-shrink mx-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Or continue with email</span>
              <div className="flex-grow border-t border-glass-border" />
            </div>

            {show2fa ? (
              <form onSubmit={verifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Verification Code</Label>
                  <Input
                    id="otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="bg-card/40 border-glass-border h-12 rounded-xl text-center font-mono text-xl tracking-[0.5em] focus:ring-primary/20"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-[10px] text-muted-foreground text-center mt-2">Enter the code sent to <span className="font-bold text-foreground">{email}</span></p>
                </div>
                <Button
                  type="submit"
                  disabled={busy || otpCode.length < 6}
                  className="w-full h-12 bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-95 rounded-xl font-bold text-base mt-2"
                >
                  {busy ? <Loader variant="inline" /> : "Verify & Sign In"}
                </Button>
                <button 
                  type="button" 
                  onClick={() => setShow2fa(false)}
                  className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="dn" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Display Name</Label>
                    <Input
                      id="dn"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Maya Chen"
                      className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-primary/20"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="em" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Email Address</Label>
                  <Input
                    id="em"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="pw" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Password</Label>
                    {mode === "signin" && <button type="button" onClick={resetPassword} className="text-[11px] text-primary hover:underline font-bold">Forgot?</button>}
                  </div>
                  <Input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-card/40 border-glass-border h-12 rounded-xl focus:ring-primary/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full h-12 bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-95 rounded-xl font-bold text-base mt-2"
                >
                  {busy ? <Loader variant="inline" /> : (
                    <>{mode === "signup" ? "Create Account" : "Sign In"}</>
                  )}
                </Button>
              </form>
            )}
          </div>

          <p className="text-sm text-center text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-primary hover:underline font-bold"
            >
              {mode === "signup" ? "Sign in" : "Sign up free"}
            </button>
          </p>

          <div className="pt-8 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to landing page
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  );
}
