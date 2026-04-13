import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

function getEnv(key: string): string | undefined {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
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

  const cfApiToken = getEnv("CF_API_TOKEN");
  const cfZoneId = getEnv("CF_ZONE_ID");

  if (!cfApiToken || !cfZoneId) {
    return NextResponse.json(
      {
        error: "Analytics not configured",
        blogViews: {},
        topPaths: [],
        totals: { views: 0, requests: 0 },
        period: { days: 0, from: "", to: "" },
      },
      { status: 200 }
    );
  }

  const days = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("days") || "30") || 30, 1),
    90
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateFilter = startDate.toISOString().split("T")[0];

  // Try the zone-level httpRequests1dGroups query
  const query = `{
    viewer {
      zones(filter: { zoneTag: "${cfZoneId}" }) {
        httpRequests1dGroups(
          limit: 10000
          filter: { date_gt: "${dateFilter}" }
        ) {
          sum {
            requests
            pageViews
          }
          dimensions {
            date
            clientRequestHTTPHost
            clientRequestPath
          }
        }
      }
    }
  }`;

  try {
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfApiToken}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CF Analytics API HTTP error:", response.status, errorText.slice(0, 500));
      // Return empty data rather than 502 — the admin UI handles missing data gracefully
      return NextResponse.json({
        error: `Cloudflare API returned ${response.status}`,
        blogViews: {},
        topPaths: [],
        totals: { views: 0, requests: 0 },
        period: { days, from: dateFilter, to: new Date().toISOString().split("T")[0] },
      }, { status: 200 });
    }

    const json = await response.json();

    // Check for GraphQL errors
    const gqlErrors = (json as any)?.errors;
    if (gqlErrors?.length) {
      const messages = gqlErrors.map((e: any) => e.message).join("; ");
      console.error("CF Analytics GraphQL errors:", messages);
      return NextResponse.json({
        error: messages,
        blogViews: {},
        topPaths: [],
        totals: { views: 0, requests: 0 },
        period: { days, from: dateFilter, to: new Date().toISOString().split("T")[0] },
      }, { status: 200 });
    }

    const zones = (json as any)?.data?.viewer?.zones;
    if (!zones || zones.length === 0) {
      console.error("CF Analytics: no zones returned for zoneTag:", cfZoneId);
      return NextResponse.json({
        error: "No zone found. Check CF_ZONE_ID and CF_API_TOKEN permissions.",
        blogViews: {},
        topPaths: [],
        totals: { views: 0, requests: 0 },
        period: { days, from: dateFilter, to: new Date().toISOString().split("T")[0] },
      }, { status: 200 });
    }

    const groups = zones[0]?.httpRequests1dGroups ?? [];

    // Aggregate page views by path
    const viewsByPath: Record<string, number> = {};
    const requestsByPath: Record<string, number> = {};

    for (const group of groups) {
      const path: string = group.dimensions.clientRequestPath || "/";
      const pageViews: number = group.sum.pageViews || 0;
      const requests: number = group.sum.requests || 0;

      viewsByPath[path] = (viewsByPath[path] || 0) + pageViews;
      requestsByPath[path] = (requestsByPath[path] || 0) + requests;
    }

    // Extract blog post views — paths like /blog/{slug}
    const blogViews: Record<string, { views: number; requests: number }> = {};
    const blogPathRegex = /^\/blog\/([^/]+)\/?$/;

    for (const [path, views] of Object.entries(viewsByPath)) {
      const match = path.match(blogPathRegex);
      if (match) {
        blogViews[match[1]] = {
          views,
          requests: requestsByPath[path] || 0,
        };
      }
    }

    const totalViews = Object.values(viewsByPath).reduce((a, b) => a + b, 0);
    const totalRequests = Object.values(requestsByPath).reduce((a, b) => a + b, 0);

    const topPaths = Object.entries(viewsByPath)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([path, views]) => ({
        path,
        views,
        requests: requestsByPath[path] || 0,
      }));

    return NextResponse.json({
      period: { days, from: dateFilter, to: new Date().toISOString().split("T")[0] },
      totals: { views: totalViews, requests: totalRequests },
      blogViews,
      topPaths,
    });
  } catch (err) {
    console.error("Analytics fetch error:", err);
    return NextResponse.json({
      error: "Failed to fetch analytics data",
      blogViews: {},
      topPaths: [],
      totals: { views: 0, requests: 0 },
      period: { days, from: dateFilter, to: new Date().toISOString().split("T")[0] },
    }, { status: 200 });
  }
}