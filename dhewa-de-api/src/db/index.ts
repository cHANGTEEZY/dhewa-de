import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "./schema";

function connectionString(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url;
  }
}

export const pool = new Pool({
  connectionString: connectionString(env.DATABASE_URL),
});

export const db = drizzle(pool, { schema });
