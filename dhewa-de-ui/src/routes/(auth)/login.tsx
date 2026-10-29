import { createFileRoute, redirect } from "@tanstack/react-router";
import LoginPage from "@/features/auth/login";
import { authHead } from "@/features/auth/lib/head";
import { readSession } from "@/lib/read-session";

const TITLE = "Sign in";
const DESCRIPTION = "Sign in to Dhewa.";

export const Route = createFileRoute("/(auth)/login")({
  beforeLoad: async () => {
    const session = await readSession();
    if (session) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
  head: () => authHead(TITLE, DESCRIPTION, "/login"),
});
