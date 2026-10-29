import { authClient } from "@/lib/auth-client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

export const authApi = {
  login: async (payload: LoginPayload) => {
    const result = await authClient.signIn.email({
      email: payload.email,
      password: payload.password,
      callbackURL: "/",
    });
    if (result.error) {
      throw new Error(result.error.message ?? "Could not sign in");
    }
    return result.data;
  },
  register: async (payload: RegisterPayload) => {
    const result = await authClient.signUp.email({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      callbackURL: "/",
    });
    if (result.error) {
      throw new Error(result.error.message ?? "Could not create the account");
    }
    return result.data;
  },
  logout: async () => {
    const result = await authClient.signOut();
    if (result.error) {
      throw new Error(result.error.message ?? "Could not sign out");
    }
  },
  me: async () => {
    const result = await authClient.getSession();
    if (result.error || !result.data?.user) {
      throw new Error(result.error?.message ?? "Not signed in");
    }
    return result.data.user;
  },
};
