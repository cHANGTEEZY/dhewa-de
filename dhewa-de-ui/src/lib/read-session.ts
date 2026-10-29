import { createServerFn } from "@tanstack/react-start";
import { authClient } from "@/lib/auth-client";

export const readSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequest } = await import("@tanstack/react-start/server");
  const cookie = getRequest().headers.get("cookie");

  try {
    const result = await authClient.getSession({
      fetchOptions: cookie ? { headers: { cookie } } : undefined,
    });
    return result.data?.session ? result.data : null;
  } catch {
    return null;
  }
});
