import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

function authBaseUrl() {
  if (typeof window !== "undefined") {
    return import.meta.env.VITE_AUTH_URL ?? window.location.origin;
  }
  return process.env.API_ORIGIN ?? "http://localhost:3001";
}

export const authClient = createAuthClient({
  baseURL: authBaseUrl(),
  plugins: [
    inferAdditionalFields({
      user: {
        username: {
          type: "string",
          required: false,
        },
      },
    }),
  ],
});

export function authErrorMessage(error: { message?: string } | null | undefined) {
  return error?.message || "Something went wrong. Try again.";
}
