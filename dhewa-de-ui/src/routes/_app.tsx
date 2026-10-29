import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import AppShell from "@/features/app/components/app-shell";
import { readSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const session = await readSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
