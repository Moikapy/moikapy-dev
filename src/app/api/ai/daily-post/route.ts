import { NextRequest, NextResponse } from "next/server";
import { callOrigen } from "@moikapy/origen";
import { blogConfig } from "@/lib/origen";
import { webSearchTool } from "@/lib/web-search-tool";
import { getCommunityInsights } from "@/lib/community-insights";
import { getDb } from "@/db/connection";
import { posts, postTags } from "@/db/schema";
import { isAuthenticated } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DAILY_POST_KV_KEY = "daily_post_last_run";

/**
 * Origen Daily Writer — researches trending topics and writes a draft blog post.
 *
 * Called by Cloudflare Cron Trigger once per day (6am ET).
 * Also callable manually by admin via POST /api/ai/daily-post.
 *
 * Flow:
 *  1. Check if auto-write is enabled (KV setting)
 *  2. Check if a draft post was already created today (idempotent)
 *  3. Read trending tags from community insights
 *  4. Origen researches top topics using web_search tool
 *  5. Origen writes a full blog post (draft, not published)
 *  6. Save to D1 with author="Origen", published=false
 */
export async function POST(request: NextRequest) {
  // Auth check — only admin or cron can trigger
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

  // Check if auto-write is enabled (unless admin is forcing)
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

  // Idempotency check — don't create more than 1 post per day
  try {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];
    const existing = await db
      .select()
      .from(posts)
      .where(sql`date(${posts.createdAt}) = ${today} AND ${posts.autoWritten} = 1`)
      .limit(1);

    if (existing.length > 0 && !force) {
      return NextResponse.json({
        status: "already_written",
        message: "A daily post was already created today",
        post: { slug: existing[0].slug, title: existing[0].title },
      });
    }
  } catch {
    // Table might not have the column yet — proceed anyway
  }

  // Step 1: Read trending topics from community insights
  const insights = await getCommunityInsights();
  const trendingTags: string[] = insights?.trending_tags ?? ["technology"];
  const topTags = trendingTags.slice(0, 3).join(", ");

  // Step 2: Origen researches and writes the post
  const systemPrompt = `You are Origen, an AI writer for a tech blog. Your mission is to write well-researched, factual blog posts that glorify God and serve readers with truth.

RULES:
- Use the web_search tool to RESEARCH each topic before writing. Find at least 2 sources per claim.
- Write in a warm, direct style. No corporate speak. Short sentences when making key points.
- Every post must include specific facts, numbers, or quotes from your research — not vague generalizations.
- If you're unsure about something, say so. Never fabricate sources or statistics.
- Structure: Hook opening → Key facts (with sources) → Practical takeaway → Closing thought.
- Length: 600-1200 words. Concise is better than padded.
- End with a brief author note: "Written by Origen ⚡ — AI-powered research and writing."
- Choose your own title, slug, and tags. The slug should be URL-safe (lowercase, hyphens, no special chars).
- Output valid JSON matching the PostPayload schema (see tool call).`;

  try {
    const response = await callOrigen(
      [
        {
          role: "user",
          content: `The trending topics on the blog right now are: ${topTags}.

Research these topics using the web_search tool. Find specific, factual information with sources. Then write a blog post that serves readers with real, verified information — not hot takes or vague opinion.

Pick ONE topic to focus on. Write about it with depth and specificity. Use your web_search tool at least twice — once to research the topic, and again to verify a key claim.`,
        },
      ],
      undefined,
      {
        ...blogConfig(systemPrompt),
        tools: [webSearchTool],
        maxSteps: 6,
      }
    );

    // Parse the response as JSON
    let postData: any;
    try {
      // Try to extract JSON from the response
      const content = response.message;
      // Find JSON object in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      postData = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[daily-post] Failed to parse Origen response as JSON:", parseErr);
      return NextResponse.json(
        { status: "error", message: "Failed to parse Origen response as JSON", raw: String(response.message || response).slice(0, 500) },
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

    // Step 3: Save as draft to D1
    const db = getDb();
    const slug = postData.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

    // Check for slug collision
    const existingSlug = await db.select({ slug: posts.slug }).from(posts).where(eq(posts.slug, slug)).limit(1);
    const finalSlug = existingSlug.length > 0 ? `${slug}-${Date.now().toString(36)}` : slug;

    const tags = Array.isArray(postData.tags) ? postData.tags : [];

    const [inserted] = await db.insert(posts).values({
      slug: finalSlug,
      title: postData.title,
      excerpt: postData.excerpt || postData.title,
      content: postData.content,
      tags: JSON.stringify(tags),
      published: false, // ALWAYS draft — admin reviews before publishing
      author: "Origen",
      autoWritten: true,
    }).returning();

    // Insert tags
    if (tags.length > 0) {
      await db.insert(postTags).values(
        tags.map((tag: string) => ({ slug: finalSlug, tag: tag.toLowerCase() }))
      ).onConflictDoNothing();
    }

    return NextResponse.json({
      status: "ok",
      post: {
        id: inserted.id,
        slug: finalSlug,
        title: postData.title,
        excerpt: postData.excerpt || postData.title,
        author: "Origen",
        tags,
        published: false,
        createdAt: inserted.createdAt,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[daily-post] Error:", msg);
    return NextResponse.json({ status: "error", message: msg }, { status: 500 });
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

  // Check for today's auto-written post
  let todayPost: any = null;
  try {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];
    const result = await db
      .select()
      .from(posts)
      .where(sql`date(${posts.createdAt}) = ${today} AND ${posts.autoWritten} = 1`)
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