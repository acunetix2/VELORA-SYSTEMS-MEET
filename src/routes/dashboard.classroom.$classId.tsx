import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Loader } from "@/components/Loader";

function ClassRedirectComponent() {
  return (
    <RequireAuth>
      <Page />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/classroom/$classId")({
  head: () => ({ meta: [{ title: "Redirecting — Velora" }] }),
  component: ClassRedirectComponent,
});

function Page() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Automatically redirect to the new /class hub path
    // We pass classId as the slug parameter since our new route handles ID fallbacks
    navigate({ 
      to: "/dashboard/classroom/$slug/class", 
      params: { slug: classId },
      replace: true // Replace history so back button works correctly
    });
  }, [classId, navigate]);

  return (
    <DashboardShell title="Redirecting...">
      <div className="h-[60vh] flex items-center justify-center">
        <Loader label="Synchronizing with the new Class Hub..." />
      </div>
    </DashboardShell>
  );
}
