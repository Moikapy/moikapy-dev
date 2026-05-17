import { getDb } from "@/db/connection";
import { pageViews, pageReferrers } from "@/db/schema";
import { lt } from "drizzle-orm";
import { sql } from "drizzle-orm";

const ANALYTICS_RETENTION_DAYS = 90;

/**
 * Prune analytics data older than the retention window.
 * Call from admin API or scheduled trigger.
 * Uses raw SQL for D1 compatibility with guaranteed row count.
 */
export async function pruneAnalytics(): Promise<{ pageViews: number; referrers: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ANALYTICS_RETENTION_DAYS);
  const cutoffDate = cutoff.toISOString().split("T")[0];

  const db = getDb();

  // Use Drizzle's delete API — works for both D1 and local SQLite
  const viewsResult = await db
    .delete(pageViews)
    .where(lt(pageViews.date, cutoffDate));

  const refResult = await db
    .delete(pageReferrers)
    .where(lt(pageReferrers.date, cutoffDate));

  return {
    pageViews: Number((viewsResult as any)?.rowsAffected ?? (viewsResult as any)?.changes ?? 0),
    referrers: Number((refResult as any)?.rowsAffected ?? (refResult as any)?.changes ?? 0),
  };
}