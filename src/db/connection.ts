import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getLocalDb } from "./local";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;

/**
 * Returns a Drizzle query builder.
 * - Production: Cloudflare D1 (via cloudflare context)
 * - Local dev: better-sqlite3 (stored in .local/dev.db)
 */
export function getDb(): Database {
  try {
    const ctx = getCloudflareContext();
    const d1 = ctx.env.DB as D1Database | undefined;
    if (d1) {
      return createDb(d1);
    }
  } catch {
    // Not running in Cloudflare — fall through to local
  }
  return getLocalDb() as unknown as Database;
}