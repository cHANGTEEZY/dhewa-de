import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;

    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFiles();

/** Common local SPA ports (Vite default 5173; some setups use 3000). */
const LOCAL_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development")
    .transform((val) =>
      val === "production"
        ? "production"
        : val === "test"
          ? "test"
          : "development",
    ),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGIN: z.string().default("*"),
  FRONTEND_ORIGIN: z.string(),
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: optionalEnv(),
  GOOGLE_CLIENT_SECRET: optionalEnv(),
  TWITCH_CLIENT_ID: optionalEnv(),
  TWITCH_CLIENT_SECRET: optionalEnv(),
  ARCJET_KEY: z.string().min(1),
  ARCJET_ENV: z.enum(["development", "production"]).default("development"),
}).superRefine((value, ctx) => {
  requirePair(
    value.GOOGLE_CLIENT_ID,
    value.GOOGLE_CLIENT_SECRET,
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    ctx,
  );
  requirePair(
    value.TWITCH_CLIENT_ID,
    value.TWITCH_CLIENT_SECRET,
    "TWITCH_CLIENT_ID",
    "TWITCH_CLIENT_SECRET",
    ctx,
  );
});

function optionalEnv() {
  return z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    });
}

function requirePair(
  id: string | undefined,
  secret: string | undefined,
  idKey: string,
  secretKey: string,
  ctx: z.RefinementCtx,
) {
  if (Boolean(id) === Boolean(secret)) return;
  ctx.addIssue({
    code: "custom",
    message: `${idKey} and ${secretKey} must both be set, or both left empty`,
    path: [id ? secretKey : idKey],
  });
}

const raw = envSchema.parse(process.env);

function normalizeOrigin(url: string): string {
  let u = url
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/$/, "");
  if (u === "*") return "*";
  if (!u) return u;
  if (!/^https?:\/\//i.test(u)) {
    u = `http://${u}`;
  }
  return u;
}

export const trustedFrontendOrigins: string[] = (() => {
  if (normalizeOrigin(raw.CORS_ORIGIN) === "*") {
    return [...LOCAL_DEV_ORIGINS];
  }
  const fromEnv = raw.CORS_ORIGIN.split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
  return [...new Set([...LOCAL_DEV_ORIGINS, ...fromEnv])];
})();

export const corsCredentialsEnabled = normalizeOrigin(raw.CORS_ORIGIN) !== "*";

export const env = raw;
