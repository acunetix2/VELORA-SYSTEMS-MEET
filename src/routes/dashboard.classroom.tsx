import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";

function ClassroomLayout() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard/classroom")({
  component: ClassroomLayout,
});
