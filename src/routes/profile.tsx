import { createFileRoute, redirect } from "@tanstack/react-router";

// Profile lives inside the dashboard now — keep this URL working with a redirect.
function ProfileComponent() {
  return null;
}

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/profile" });
  },
  component: ProfileComponent,
});
