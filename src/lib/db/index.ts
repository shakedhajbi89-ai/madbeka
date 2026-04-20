import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let cached: DrizzleDb | null = null;

function getDb(): DrizzleDb {
  if (cached) return cached;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Provision Neon via Vercel Marketplace and run `vercel env pull .env.local`.",
    );
  }

  const sql = neon(connectionString);
  cached = drizzle(sql, { schema });
  return cached;
}

/**
 * Proxy that defers connecting to Neon until the first property access.
 * This prevents `next build` (which imports server modules but doesn't run them)
 * from failing when DATABASE_URL is absent at build time on CI.
 */
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    const realDb = getDb();
    const value = realDb[prop as keyof DrizzleDb];
    return typeof value === "function" ? value.bind(realDb) : value;
  },
});

export * from "./schema";
