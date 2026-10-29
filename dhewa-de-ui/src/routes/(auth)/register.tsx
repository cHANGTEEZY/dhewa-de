import { createFileRoute, redirect } from "@tanstack/react-router";
import RegisterPage from "@/features/auth/register";
import { authHead } from "@/features/auth/lib/head";
import { readSession } from "@/lib/auth-client";

const TITLE = "Create account";
const DESCRIPTION = "Create a Dhewa account.";

export const Route = createFileRoute("/(auth)/register")({
  beforeLoad: async () => {
    const session = await readSession();
    if (session) {
      throw redirect({ to: "/" });
    }
  },
  component: RegisterPage,
  head: () => authHead(TITLE, DESCRIPTION, "/register"),
});
