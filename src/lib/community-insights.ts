/**
 * Community-driven insights for the blog homepage.
 *
 * Reads analytics from D1 (page_views + post_tags), uses Origen to
 * interpret community interests, caches results in KV.
 *
 * The homepage and blog pages read from KV — zero LLM latency in
 * the render path. The cron endpoint refreshes insights every 30 min.
 */

import { getDb } from "@/db/connection";
import { sql } from "drizzle-orm";
import { pageViews, postTags } from "@/db/schema";

// ── Types ──────────────────────────────────────────────────────────

export interface CommunityInsights {
  trending_slugs: string[];
  trending_tags: string[];
  spotlight_tag: string;
  spotlight_slugs: string[];
  related: Record<string, string[]>;
  content_advice: string;
  updated_at: string;
}

const KV_KEY = "community_insights";

// ── KV Access ──────────────────────────────────────────────────────

function getKV(): KVNamespace | null {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    return ctx.env?.COMMUNITY_INSIGHTS as KVNamespace | undefined ?? null;
  } catch {
    return null;
  }
}

/** Read cached insights from KV. */
export async function getCommunityInsights(): Promise<CommunityInsights | null> {
  const kv = getKV();
  if (!kv) return null;

  try {
    const data = await kv.get(KV_KEY, "json") as CommunityInsights | null;
    if (!data) return null;

    // Check freshness (2x TTL = 1 hour)
    const age = Date.now() - new Date(data.updated_at).getTime();
    if (age > 60 * 60 * 1000) return null;

    return data;
  } catch {
    return null;
  }
}

/** Write insights to KV cache. */
export async function setCommunityInsights(insights: CommunityInsights): Promise<void> {
  const kv = getKV();
  if (!kv) return;

  await kv.put(KV_KEY, JSON.stringify(insights), {
    expirationTtl: 3600,
  });
}

// ── D1 Direct Access ──────────────────────────────────────────────

/** Get raw D1 client from Drizzle. */
function getD1(): D1Database {
  const db = getDb();
  return (db as any).$client as D1Database;
}

// ── D1 Analytics Queries ──────────────────────────────────────────

/** Get trending tags by total page views (last 30 days).
 *  Two-step approach: first get blog paths with view counts,
 *  then match slugs to tags manually.
 */
export async function getTrendingTags(days = 30): Promise<Array<{ tag: string; views: number }>> {
  const d1 = getD1();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Step 1: Get blog paths with view counts
  const pathResult = await d1.prepare(`
    SELECT path, SUM(views) as total_views
    FROM page_views
    WHERE date > ?1 AND path LIKE '/blog/%'
    GROUP BY path
    ORDER BY total_views DESC
    LIMIT 50
  `).bind(since).all();

  // Step 2: Extract slugs and sum views per slug
  const slugViews = new Map<string, number>();
  for (const row of pathResult.results as any[]) {
    const slug = (row.path as string).replace(/^\/blog\//, "").replace(/\/$/, "");
    if (slug && slug.length > 0) {
      slugViews.set(slug, (slugViews.get(slug) ?? 0) + Number(row.total_views));
    }
  }

  if (slugViews.size === 0) return [];

  // Step 3: Get tags for those slugs
  const slugs = Array.from(slugViews.keys());
  const placeholders = slugs.map(() => "?").join(",");
  const tagResult = await d1.prepare(
    `SELECT slug, tag FROM post_tags WHERE slug IN (${placeholders})`
  ).bind(...slugs).all();

  // Step 4: Aggregate views per tag
  const tagViewsMap = new Map<string, number>();
  for (const row of tagResult.results as any[]) {
    const s = row.slug as string;
    const t = row.tag as string;
    const views = slugViews.get(s) ?? 0;
    tagViewsMap.set(t, (tagViewsMap.get(t) ?? 0) + views);
  }

  return Array.from(tagViewsMap.entries())
    .map(([tag, views]) => ({ tag, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
}

/** Get trending posts by page views (last 7 days). */
export async function getTrendingPosts(days = 7): Promise<Array<{ slug: string; views: number }>> {
  const d1 = getD1();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const result = await d1.prepare(`
    SELECT REPLACE(path, '/blog/', '') as slug, SUM(views) as total_views
    FROM page_views
    WHERE date > ?1 AND path LIKE '/blog/%'
    GROUP BY path
    ORDER BY total_views DESC
    LIMIT 10
  `).bind(since).all();

  return result.results.map((row: any) => ({
    slug: (row.slug as string).replace(/\/$/, ""),
    views: Number(row.total_views),
  }));
}

/** Get posts for a specific tag. */
export async function getPostsByTag(tag: string): Promise<string[]> {
  const d1 = getD1();
  const result = await d1.prepare("SELECT slug FROM post_tags WHERE tag = ?1").bind(tag).all();
  return result.results.map((row: any) => row.slug as string);
}

/** Compute co-occurrence: "readers of X also read Y". */
export async function getCoOccurrence(slug: string, limit = 3): Promise<string[]> {
  const d1 = getD1();
  const result = await d1.prepare(`
    SELECT b.slug, COUNT(*) as shared_tags
    FROM post_tags a
    JOIN post_tags b ON a.tag = b.tag AND b.slug != ?1
    WHERE a.slug = ?1
    GROUP BY b.slug
    ORDER BY shared_tags DESC, RANDOM()
    LIMIT ?2
  `).bind(slug, limit).all();

  return result.results.map((row: any) => row.slug as string);
}

// ── Fallback (no KV / first deploy) ─────────────────────────────

/** Generate basic insights from D1 without Origen (for KV miss / first deploy). */
export async function getFallbackInsights(): Promise<CommunityInsights> {
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

  return {
    trending_slugs: trendingPosts.map((p) => p.slug),
    trending_tags: trendingTags.map((t) => t.tag),
    spotlight_tag: spotlightTag,
    spotlight_slugs: spotlightSlugs,
    related,
    content_advice: "",
    updated_at: new Date().toISOString(),
  };
}