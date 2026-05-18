import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

/** GET /api/analytics/stats?path=/blog/slug — get views + shares for a path */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const days = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("days") || "365") || 365, 1),
    365
  );
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateGeq = startDate.toISOString().split("T")[0];

  try {
    const { env } = getCloudflareContext();
    const db = env.DB;
    if (!db) {
      return NextResponse.json({ views: 0, uniqueViews: 0, shares: 0 });
    }

    const [viewRow, shareRow] = await Promise.all([
      db
        .prepare(
          `SELECT COALESCE(SUM(views), 0) as views, COALESCE(SUM(unique_views), 0) as unique_views FROM page_views WHERE path = ? AND date >= ?`
        )
        .bind(path, dateGeq)
        .first(),
      db
        .prepare(
          `SELECT COALESCE(SUM(shares), 0) as shares FROM page_shares WHERE path = ? AND date >= ?`
        )
        .bind(path, dateGeq)
        .first(),
    ]);

    return NextResponse.json({
      views: Number((viewRow as any)?.views ?? 0),
      uniqueViews: Number((viewRow as any)?.unique_views ?? 0),
      shares: Number((shareRow as any)?.shares ?? 0),
    });
  } catch (err) {
    console.error("[analytics/stats] Error:", err);
    return NextResponse.json({ views: 0, uniqueViews: 0, shares: 0 });
  }
}