import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { env, trustedFrontendOrigins } from "../../config/env";
import { db } from "../../db";

const google = socialProvider(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
const twitch = socialProvider(env.TWITCH_CLIENT_ID, env.TWITCH_CLIENT_SECRET);

const issuedVerificationUrls = new Map<string, string>();

export function takeIssuedVerificationUrl(userId: string) {
  const url = issuedVerificationUrls.get(userId);
  issuedVerificationUrls.delete(userId);
  return url;
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: trustedFrontendOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        input: false,
        unique: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      issuedVerificationUrls.set(user.id, url);
    },
  },
  socialProviders: {
    ...(google ? { google } : {}),
    ...(twitch ? { twitch } : {}),
  },
});

function socialProvider(clientId: string | undefined, clientSecret: string | undefined) {
  if (!clientId || !clientSecret) return undefined;
  return { clientId, clientSecret };
}
