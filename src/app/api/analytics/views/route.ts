import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getEnv(key: string): string | undefined {
  try {
    const ctx = getCloudflareContext();
    return (ctx.env as Record<string, string | undefined>)[key];
  } catch {
    return process.env[key];
  }
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authed = await isAuthenticated(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("days") || "30") || 30, 1),
    90
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateGeq = startDate.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  try {
    const { env } = getCloudflareContext();
    const db = env.DB;
    if (!db) {
      return NextResponse.json({
        period: { days, from: dateGeq, to: today },
        totals: { views: 0, requests: 0 },
        blogViews: {},
        topPaths: [],
        debug: "D1 database not available",
      });
    }

    // Total views in the period
    const totalResult = await db!
      .prepare(
        `SELECT COALESCE(SUM(views), 0) as total_views, COALESCE(SUM(views), 0) as total_requests
         FROM page_views WHERE date >= ?`
      )
      .bind(dateGeq)
      .first();

    // Per-path totals in the period (top 50 by views)
    const pathRows = await db!
      .prepare(
        `SELECT path, SUM(views) as views FROM page_views WHERE date >= ? GROUP BY path ORDER BY views DESC LIMIT 50`
      )
      .bind(dateGeq)
      .all();

    // Per-blog-slug totals in the period
    const blogRows = await db!
      .prepare(
        `SELECT path, SUM(views) as views FROM page_views WHERE date >= ? AND path LIKE '/blog/%' GROUP BY path ORDER BY views DESC`
      )
      .bind(dateGeq)
      .all();

    const totalViews = Number(totalResult?.total_views ?? 0);

    const topPaths = (pathRows.results as { path: string; views: number }[]).map((r) => ({
      path: r.path,
      views: r.views,
      requests: r.views, // Same as views for D1-tracked data
    }));

    const blogViews: Record<string, { views: number; requests: number }> = {};
    const blogRegex = /^\/blog\/([^/]+)\/?$/;
    for (const row of blogRows.results as { path: string; views: number }[]) {
      const match = row.path.match(blogRegex);
      if (match) {
        blogViews[match[1]] = { views: row.views, requests: row.views };
      }
    }

    // Also try CF Analytics for aggregate totals (supplements D1 data)
    let cfTotalViews: number | null = null;
    const cfApiToken = getEnv("CF_API_TOKEN");
    const cfZoneId = getEnv("CF_ZONE_ID");

    if (cfApiToken && cfZoneId) {
      try {
        const cfQuery = `{
          viewer {
            zones(filter: { zoneTag: ${JSON.stringify(cfZoneId)} }) {
              httpRequests1dGroups(
                limit: 10000
                filter: { date_geq: ${JSON.stringify(dateGeq)} }
              ) {
                sum {
                  requests
                  pageViews
                }
                dimensions { date }
              }
            }
          }
        }`;

        const cfRes = await fetch("https://api.cloudflare.com/client/v4/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfApiToken}`,
          },
          body: JSON.stringify({ query: cfQuery }),
        });

        if (cfRes.ok) {
          const cfJson = await cfRes.json();
          const zones = (cfJson as any)?.data?.viewer?.zones;
          const groups = zones?.[0]?.httpRequests1dGroups ?? [];
          cfTotalViews = groups.reduce(
            (sum: number, g: any) => sum + (g.sum?.pageViews ?? 0),
            0
          );
        }
      } catch {
        // CF API not critical, skip
      }
    }

    return NextResponse.json({
      period: { days, from: dateGeq, to: today },
      totals: {
        views: cfTotalViews ?? totalViews,
        requests: cfTotalViews ?? totalViews,
      },
      d1Views: totalViews,
      blogViews,
      topPaths,
    });
  } catch (err) {
    console.error("[analytics/views] Error:", err);
    return NextResponse.json({
      period: { days, from: dateGeq, to: today },
      totals: { views: 0, requests: 0 },
      blogViews: {},
      topPaths: [],
      debug: `Error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}