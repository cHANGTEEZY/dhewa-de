import { createAuthClient } from "better-auth/react";

function authBaseUrl() {
  if (typeof window !== "undefined") {
    return import.meta.env.VITE_AUTH_URL ?? window.location.origin;
  }
  return process.env.API_ORIGIN ?? "http://localhost:3001";
}

export const authClient = createAuthClient({
  baseURL: authBaseUrl(),
});

export async function readSession() {
  try {
    const result = await authClient.getSession({
      fetchOptions:
        typeof window === "undefined"
          ? { headers: await serverCookieHeader() }
          : undefined,
    });
    return result.data?.session ? result.data : null;
  } catch {
    return null;
  }
}

async function serverCookieHeader(): Promise<HeadersInit> {
  const { getRequest } = await import("@tanstack/react-start/server");
  const cookie = getRequest().headers.get("cookie");
  if (!cookie) return new Headers();
  return { cookie };
}

export function authErrorMessage(error: { message?: string } | null | undefined) {
  return error?.message || "Something went wrong. Try again.";
}
