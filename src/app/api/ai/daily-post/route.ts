import { NextRequest, NextResponse } from "next/server";
import { callOrigen } from "@moikapy/origen";
import { blogConfig } from "@/lib/origen";
import { getCommunityInsights } from "@/lib/community-insights";
import { getDb } from "@/db/connection";
import { posts, postTags } from "@/db/schema";
import { isAuthenticated } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

const DAILY_POST_KV_KEY = "daily_post_last_run";

/**
 * Origen Daily Writer — researches trending topics and writes a draft blog post.
 *
 * Flow:
 *  1. Check auto-write enabled + idempotency (max 1/day)
 *  2. Read trending tags from community insights (KV cache)
 *  3. Web search for facts on the top trending topic (DuckDuckGo)
 *  4. Pass search results as context to Origen → writes blog post
 *  5. Save as draft (author="Origen", published=false)
 *
 * Web search is done directly (not via model tool calls) so it works
 * with any model, including Ollama cloud models that don't support tools.
 */

export async function POST(request: NextRequest) {
  // Auth check
  let isCron = false;
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const cronSecret = ctx.env.CRON_SECRET as string | undefined;
    isCron = !!cronSecret && request.headers.get("Cf-Auth-Token") === cronSecret;
  } catch {
    // Not in CF context
  }

  const isAdmin = await isAuthenticated(request);
  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if auto-write is enabled (unless admin forces)
  const force = request.nextUrl.searchParams.get("force") === "true";
  if (!force) {
    try {
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const ctx = getCloudflareContext();
      const kv = ctx.env?.COMMUNITY_INSIGHTS as KVNamespace | undefined;
      if (kv) {
        const enabled = await kv.get("auto_write_enabled");
        if (enabled !== "true") {
          return NextResponse.json({ status: "disabled", message: "Auto-write is not enabled. Enable in admin or use ?force=true" });
        }
      }
    } catch {
      // KV not available — proceed if admin
    }
  }

  // Idempotency check — max 1 post per day
  try {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];
    const existing = await db
      .select()
      .from(posts)
      .where(sql`${posts.createdAt} LIKE ${today + "%"} AND ${posts.autoWritten} = 1`)
      .limit(1);

    if (existing.length > 0 && !force) {
      return NextResponse.json({
        status: "already_written",
        message: "A daily post was already created today",
        post: { slug: existing[0].slug, title: existing[0].title },
      });
    }
  } catch {
    // Column may not exist yet — proceed
  }

  // Step 1: Read trending topics from community insights
  const insights = await getCommunityInsights();
  const trendingTags: string[] = insights?.trending_tags ?? ["technology"];
  const topTags = trendingTags.slice(0, 3).join(", ");

  // Step 2: Web search for facts on the top trending topic
  let searchResults = "";
  const searchTopic = trendingTags[0] || "technology";
  try {
    console.log("[daily-post] Searching for:", searchTopic);
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchTopic + " latest news 2025")}&format=json&no_html=1&skip_disambig=1`;
    const searchResp = await fetch(searchUrl, {
      headers: { "User-Agent": "moikapy-blog/1.0" },
    });
    if (searchResp.ok) {
      const searchData = await searchResp.json() as Record<string, any>;
      const results: string[] = [];
      if (searchData.AbstractText) {
        results.push(`Summary: ${searchData.AbstractText}`);
        if (searchData.AbstractURL) results.push(`Source: ${searchData.AbstractURL}`);
      }
      if (searchData.RelatedTopics) {
        for (const topic of (searchData.RelatedTopics as any[]).slice(0, 5)) {
          if (topic.Text) results.push(`- ${topic.Text}${topic.FirstURL ? ` (${topic.FirstURL})` : ""}`);
        }
      }
      if (results.length > 0) {
        searchResults = results.join("\n\n");
        console.log("[daily-post] Found search results:", searchResults.slice(0, 200));
      }
    }
  } catch (err) {
    console.error("[daily-post] Web search failed:", err instanceof Error ? err.message : String(err));
    // Continue without search results
  }

  // Step 3: Origen writes the post using trending data + search results
  const systemPrompt = `You are Origen, an AI writer for a tech blog. Write well-researched, factual blog posts.

RULES:
- Write in a warm, direct style. No corporate speak. Short sentences for key points.
- Use the search results provided — cite specific facts, numbers, and sources.
- If the search results don't cover something, say so rather than making it up.
- Structure: Hook opening → Key facts (with sources) → Practical takeaway → Closing thought.
- Length: 600-1200 words. Concise beats padded.
- End with: "Written by Origen ⚡ — AI-powered research and writing."
- Choose your own title, slug, and tags. Slug must be URL-safe (lowercase, hyphens).
- You MUST respond with valid JSON only. No markdown, no explanation. Shape: {"title": "...", "slug": "...", "excerpt": "...", "content": "...", "tags": ["..."]}`;

  const userPrompt = searchResults
    ? `The trending topics on this blog are: ${topTags}.

Here are search results about "${searchTopic}":

${searchResults}

Write a blog post about ${searchTopic}. Use the search results above for facts and citations. Be specific and practical.`
    : `The trending topics on this blog are: ${topTags}.

Write a blog post about one of these topics. Be specific and factual. Do not fabricate statistics or sources.`;

  let postData: any = null;

  try {
    console.log("[daily-post] Generating post with GLM-5.1, topic:", searchTopic);
    const response = await callOrigen(
      [{ role: "user", content: userPrompt }],
      undefined,
      blogConfig(systemPrompt),
    );

    const content = response.message;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      postData = JSON.parse(jsonMatch[0]);
      console.log("[daily-post] Successfully generated post:", postData.title);
    } else {
      console.error("[daily-post] No JSON found in response:", content.slice(0, 300));
    }
  } catch (err) {
    console.error("[daily-post] Origen call failed:", err instanceof Error ? err.message : String(err));
  }

  if (!postData) {
    return NextResponse.json(
      { status: "error", message: "Failed to generate blog post. The AI model did not return valid JSON. This may be a temporary issue — try again in a few minutes." },
      { status: 500 }
    );
  }

  // Validate required fields
  if (!postData.title || !postData.slug || !postData.content) {
    return NextResponse.json(
      { status: "error", message: "Missing required fields (title, slug, content)", data: postData },
      { status: 500 }
    );
  }

  // Step 4: Save as draft to D1
  try {
    const db = getDb();
    const slug = postData.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const existingSlug = await db.select({ slug: posts.slug }).from(posts).where(eq(posts.slug, slug)).limit(1);
    const finalSlug = existingSlug.length > 0 ? `${slug}-${Date.now().toString(36)}` : slug;
    const tags = Array.isArray(postData.tags) ? postData.tags : [];

    await db.insert(posts).values({
      slug: finalSlug,
      title: postData.title,
      excerpt: postData.excerpt || postData.title,
      content: postData.content,
      tags: JSON.stringify(tags),
      published: false,
      author: "Origen",
      autoWritten: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Insert tags
    if (tags.length > 0) {
      await db.insert(postTags).values(
        tags.map((tag: string) => ({ slug: finalSlug, tag: tag.toLowerCase() }))
      ).onConflictDoNothing();
    }

    const inserted = await db.select().from(posts).where(eq(posts.slug, finalSlug)).limit(1);
    const post = inserted[0];

    return NextResponse.json({
      status: "ok",
      post: {
        slug: finalSlug,
        title: postData.title,
        excerpt: postData.excerpt || postData.title,
        author: "Origen",
        tags,
        published: false,
        createdAt: post?.createdAt ?? new Date().toISOString(),
      },
      searchTopic,
      searchUsed: !!searchResults,
    });
  } catch (dbErr) {
    console.error("[daily-post] Database error:", dbErr instanceof Error ? dbErr.message : String(dbErr));
    return NextResponse.json(
      { status: "error", message: `Database error: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/daily-post — Check auto-write status and last post info
 */
export async function GET(request: NextRequest) {
  const isAdmin = await isAuthenticated(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let enabled = false;
  let lastRun: string | null = null;

  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const kv = ctx.env?.COMMUNITY_INSIGHTS as KVNamespace | undefined;
    if (kv) {
      enabled = (await kv.get("auto_write_enabled")) === "true";
      lastRun = await kv.get(DAILY_POST_KV_KEY);
    }
  } catch {
    // KV not available
  }

  let todayPost: any = null;
  try {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];
    const result = await db
      .select()
      .from(posts)
      .where(sql`${posts.createdAt} LIKE ${today + "%"} AND ${posts.autoWritten} = 1`)
      .limit(1);
    todayPost = result[0] || null;
  } catch {
    // Column may not exist yet
  }

  return NextResponse.json({
    enabled,
    lastRun,
    todayPost: todayPost ? { slug: todayPost.slug, title: todayPost.title, published: todayPost.published } : null,
  });
}

/**
 * PUT /api/ai/daily-post — Toggle auto-write on/off
 */
export async function PUT(request: NextRequest) {
  const isAdmin = await isAuthenticated(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { enabled?: boolean };
  const enabled = body.enabled;

  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Must specify enabled: true/false" }, { status: 400 });
  }

  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const kv = ctx.env?.COMMUNITY_INSIGHTS as KVNamespace | undefined;
    if (kv) {
      await kv.put("auto_write_enabled", enabled ? "true" : "false");
    }
  } catch {
    // KV not available
  }

  return NextResponse.json({ enabled });
}