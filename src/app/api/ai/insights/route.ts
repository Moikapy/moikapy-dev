import { NextRequest, NextResponse } from "next/server";
import { callOrigen } from "@moikapy/origen";
import { blogConfig } from "@/lib/origen";
import { getCommunityInsights, setCommunityInsights, getFallbackInsights } from "@/lib/community-insights";
import { getTrendingTags, getTrendingPosts, getPostsByTag, getCoOccurrence } from "@/lib/community-insights";

export const dynamic = "force-dynamic";

/**
 * Compute community insights and cache in KV.
 *
 * Called by Cloudflare Cron Trigger every 30 minutes.
 * Also callable manually by admin via GET /api/ai/insights.
 *
 * Two modes:
 *  1. Fresh compute: reads D1 analytics → calls Origen → caches in KV
 *  2. Fallback: if Origen fails, uses pure D1 queries (no LLM)
 */
export async function GET(request: NextRequest) {
  // Auth check — only admin or cron can refresh
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Cron triggers pass a Cf-Auth-Token header
  const isCron = request.headers.get("Cf-Auth-Token") === cronSecret;
  const isAdmin = authHeader?.startsWith("Bearer "); // Admin auth handled by middleware

  // Allow cron triggers and admin requests
  if (!isCron && !isAdmin) {
    // Also allow unauthenticated for now (will add auth later)
    // TODO: Add proper admin auth check
  }

  try {
    // Step 1: Read D1 analytics
    const [trendingTags, trendingPosts] = await Promise.all([
      getTrendingTags(30),
      getTrendingPosts(7),
    ]);

    const spotlightTag = trendingTags[0]?.tag ?? "ai";
    const spotlightSlugs = await getPostsByTag(spotlightTag);

    // Build related map for trending posts
    const related: Record<string, string[]> = {};
    for (const post of trendingPosts.slice(0, 5)) {
      related[post.slug] = await getCoOccurrence(post.slug, 3);
    }

    // Step 2: Ask Origen for content strategy advice
    const analyticsContext = `
Trending tags (last 30 days): ${trendingTags.map((t) => `${t.tag} (${t.views} views)`).join(", ")}
Trending posts (last 7 days): ${trendingPosts.map((p) => `${p.slug} (${p.views} views)`).join(", ")}
Top category: ${spotlightTag}

Available post tags and their counts are listed above.
Based on this data, which topics should the blogger write more about? Be specific and concise.`;

    let contentAdvice = "";
    try {
      const response = await callOrigen(
        [
          {
            role: "user",
            content: analyticsContext,
          },
        ],
        undefined,
        {
          ...blogConfig("You are a content strategy advisor for a solo tech blogger. Analyze the analytics data and give brief, actionable advice on what to write next. Be concise — 2-3 sentences max."),
          maxSteps: 1, // Single turn, no tool calls needed
        },
      );
      contentAdvice = response.message;
    } catch (err) {
      console.error("[ai/insights] Origen call failed, using fallback:", err);
      contentAdvice = `${spotlightTag} content is trending. Consider writing more about it.`;
    }

    // Step 3: Cache in KV
    const insights = {
      trending_slugs: trendingPosts.map((p) => p.slug),
      trending_tags: trendingTags.map((t) => t.tag),
      spotlight_tag: spotlightTag,
      spotlight_slugs: spotlightSlugs,
      related,
      content_advice: contentAdvice,
      updated_at: new Date().toISOString(),
    };

    await setCommunityInsights(insights);

    return NextResponse.json({
      status: "ok",
      insights,
      source: "computed",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ai/insights] Error computing insights:", message);

    // Fallback: return D1-only insights without LLM
    try {
      const fallback = await getFallbackInsights();
      return NextResponse.json({
        status: "fallback",
        insights: fallback,
        source: "fallback",
        error: message,
      });
    } catch (fallbackErr) {
      return NextResponse.json(
        { status: "error", error: message },
        { status: 500 },
      );
    }
  }
}