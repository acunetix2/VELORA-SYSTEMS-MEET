import { Navigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader } from "./Loader";
import type { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" search={{ redirect: location.href, mode: "signup" }} />;
  }

  // Redirect to onboarding if terms not accepted yet
  if (profile && !profile.terms_accepted_at && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
}
