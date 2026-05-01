import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";

function DashboardLayout() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Velora Meet™" },
      { name: "description", content: "Your Velora Meet workspace." },
    ],
  }),
  component: DashboardLayout,
});
