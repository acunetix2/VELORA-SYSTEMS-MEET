import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";

/**
 * Wraps a public-marketing page. If the user is signed in we send them to the
 * matching in-app destination instead of showing the marketing version.
 */
export function RedirectIfAuthed({
  to,
  children,
}: {
  to: "/dashboard" | "/dashboard/settings" | "/dashboard/faq";
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={to} />;
  return <>{children}</>;
}