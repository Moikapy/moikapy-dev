import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

function getCloudflareEnv(): {
  cfApiToken?: string;
  cfZoneId?: string;
  cfAccountId?: string;
} {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    return {
      cfApiToken: ctx.env?.CF_API_TOKEN as string | undefined,
      cfZoneId: ctx.env?.CF_ZONE_ID as string | undefined,
      cfAccountId: ctx.env?.CF_ACCOUNT_ID as string | undefined,
    };
  } catch {
    return {
      cfApiToken: process.env.CF_API_TOKEN,
      cfZoneId: process.env.CF_ZONE_ID,
      cfAccountId: process.env.CF_ACCOUNT_ID,
    };
  }
}

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/views
 *
 * Returns page view counts from Cloudflare Analytics API.
 * Requires admin auth. Queries the last N days of httpRequests data
 * grouped by URL path, then maps to blog post slugs.
 *
 * Query params:
 *   days - number of days to look back (default: 30, max: 90)
 */
export async function GET(request: NextRequest) {
  const authed = await isAuthenticated(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cfApiToken, cfZoneId } = getCloudflareEnv();

  if (!cfApiToken || !cfZoneId) {
    return NextResponse.json(
      {
        error: "Analytics not configured",
        hint: "Set CF_API_TOKEN and CF_ZONE_ID secrets. Run: wrangler secret put CF_API_TOKEN && wrangler secret put CF_ZONE_ID",
      },
      { status: 500 }
    );
  }

  const days = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("days") || "30") || 30, 1),
    90
  );

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);
  const dateFilter = startDate.toISOString().split("T")[0];

  const query = `
    query($zoneTag: string!, $dateFilter: string!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(
            limit: 10000
            filter: { date_gt: $dateFilter }
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
    }
  `;

  try {
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfApiToken}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          zoneTag: cfZoneId,
          dateFilter,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CF Analytics API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Cloudflare Analytics API returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json() as {
      data?: {
        viewer?: {
          zones?: Array<{
            httpRequests1dGroups?: Array<{
              sum: { requests: number; pageViews: number };
              dimensions: {
                date: string;
                clientRequestHTTPHost: string;
                clientRequestPath: string;
              };
            }>;
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (data.errors?.length) {
      console.error("CF Analytics GraphQL errors:", data.errors);
      return NextResponse.json(
        { error: data.errors[0].message },
        { status: 502 }
      );
    }

    const groups = data.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? [];

    // Aggregate page views by path
    const viewsByPath: Record<string, number> = {};
    const requestsByPath: Record<string, number> = {};

    for (const group of groups) {
      const path = group.dimensions.clientRequestPath;
      const pageViews = group.sum.pageViews || 0;
      const requests = group.sum.requests || 0;

      viewsByPath[path] = (viewsByPath[path] || 0) + pageViews;
      requestsByPath[path] = (requestsByPath[path] || 0) + requests;
    }

    // Extract blog post views - paths like /blog/{slug}
    const blogViews: Record<string, { views: number; requests: number }> = {};
    const blogPathRegex = /^\/blog\/([^/]+)\/?$/;

    for (const [path, views] of Object.entries(viewsByPath)) {
      const match = path.match(blogPathRegex);
      if (match) {
        const slug = match[1];
        blogViews[slug] = {
          views: views,
          requests: requestsByPath[path] || 0,
        };
      }
    }

    // Calculate totals
    const totalViews = Object.values(viewsByPath).reduce((a, b) => a + b, 0);
    const totalRequests = Object.values(requestsByPath).reduce((a, b) => a + b, 0);

    // Top paths overall
    const topPaths = Object.entries(viewsByPath)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([path, views]) => ({
        path,
        views,
        requests: requestsByPath[path] || 0,
      }));

    return NextResponse.json({
      period: { days, from: dateFilter, to: endDate.toISOString().split("T")[0] },
      totals: { views: totalViews, requests: totalRequests },
      blogViews,
      topPaths,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}