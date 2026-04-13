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
    return NextResponse.json({
      period: { days: 0, from: "", to: "" },
      totals: { views: 0, requests: 0 },
      blogViews: {},
      topPaths: [],
      debug: "CF_API_TOKEN or CF_ZONE_ID not configured",
    });
  }

  const days = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("days") || "30") || 30, 1),
    90
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateGeq = startDate.toISOString().split("T")[0];

  // Query both zone-level analytics AND Workers analytics
  // Workers on custom domains populate workersInvocationsAdaptive,
  // not httpRequests1dGroups with paths
  const query = `{
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
          dimensions {
            date
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
      console.error("[analytics] CF API HTTP error:", response.status, errorText.slice(0, 500));
      return NextResponse.json({
        period: { days, from: dateGeq, to: new Date().toISOString().split("T")[0] },
        totals: { views: 0, requests: 0 },
        blogViews: {},
        topPaths: [],
        debug: `CF API returned ${response.status}`,
      });
    }

    const json = await response.json();

    // Check for GraphQL errors
    const gqlErrors = (json as any)?.errors;
    if (gqlErrors?.length) {
      const messages = gqlErrors.map((e: any) => e.message).join("; ");
      console.error("[analytics] GraphQL errors:", messages);
      return NextResponse.json({
        period: { days, from: dateGeq, to: new Date().toISOString().split("T")[0] },
        totals: { views: 0, requests: 0 },
        blogViews: {},
        topPaths: [],
        debug: `GraphQL error: ${messages}`,
      });
    }

    const zones = (json as any)?.data?.viewer?.zones;
    const httpGroups = zones?.[0]?.httpRequests1dGroups ?? [];

    const viewsByPath: Record<string, number> = {};
    const requestsByPath: Record<string, number> = {};
    let totalViews = 0;
    let totalRequests = 0;

    for (const group of httpGroups) {
      const path: string = group.dimensions?.clientRequestPath || "/";
      const pageViews: number = group.sum?.pageViews || 0;
      const reqs: number = group.sum?.requests || 0;

      viewsByPath[path] = (viewsByPath[path] || 0) + pageViews;
      requestsByPath[path] = (requestsByPath[path] || 0) + reqs;
      totalViews += pageViews;
      totalRequests += reqs;
    }

    // Add Workers invocations as fallback total if zone data is empty
    // (not currently queried, could add later)

    // Extract blog post views from /blog/{slug} paths
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

    const topPaths = Object.entries(viewsByPath)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([path, views]) => ({
        path,
        views,
        requests: requestsByPath[path] || 0,
      }));

    const hasZoneData = httpGroups.length > 0;


    return NextResponse.json({
      period: { days, from: dateGeq, to: new Date().toISOString().split("T")[0] },
      totals: { views: totalViews, requests: totalRequests },
      blogViews,
      topPaths,
      debug: !hasZoneData
        ? "No analytics data returned. Data can take 24-48h to appear on new deployments. Verify CF_API_TOKEN has Zone:Analytics:Read permission and CF_ZONE_ID is correct."
        : undefined,
    });
  } catch (err) {
    console.error("[analytics] Error:", err);
    return NextResponse.json({
      period: { days, from: dateGeq, to: new Date().toISOString().split("T")[0] },
      totals: { views: 0, requests: 0 },
      blogViews: {},
      topPaths: [],
      debug: `Error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}