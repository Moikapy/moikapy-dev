import { NextRequest, NextResponse } from "next/server";
import { createDb } from "@/db";
import { getLocalDb } from "@/db/local";
import { reactions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isValidEmoji } from "@/lib/reactions";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Hash visitor identity (IP + user-agent) for dedup without storing PII
function hashVisitor(request: NextRequest): string {
  const ip = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return crypto.createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 16);
}

function getDb() {
  try {
    const ctx = getCloudflareContext();
    const d1 = ctx.env.DB as D1Database | undefined;
    if (d1) return createDb(d1) as any;
  } catch {
    // not in CF context
  }
  return getLocalDb() as any;
}

// GET /api/reactions?slug=xxx — get reaction counts for a post
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  const db = getDb();

  try {
    const result = await db
      .select({
        emoji: reactions.emoji,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(reactions)
      .where(eq(reactions.postSlug, slug))
      .groupBy(reactions.emoji);

    const visitorHash = hashVisitor(request);
    const visitorReactions = await db
      .select({ emoji: reactions.emoji })
      .from(reactions)
      .where(and(eq(reactions.postSlug, slug), eq(reactions.visitorHash, visitorHash)));

    const myReactions = new Set(visitorReactions.map((r: any) => r.emoji));

    const counts: Record<string, number> = {};
    for (const emoji of result) {
      counts[emoji.emoji] = Number(emoji.count);
    }

    return NextResponse.json({
      slug,
      reactions: counts,
      myReactions: [...myReactions],
    });
  } catch (err) {
    console.error("Failed to get reactions:", err);
    return NextResponse.json({ error: "Failed to get reactions" }, { status: 500 });
  }
}

// POST /api/reactions — toggle a reaction
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, emoji } = body as { slug?: string; emoji?: string };

  if (!slug || !emoji) {
    return NextResponse.json({ error: "slug and emoji are required" }, { status: 400 });
  }

  if (!isValidEmoji(emoji)) {
    return NextResponse.json(
      { error: `Invalid emoji. Available: 🔥 💯 🧠 🐉 🤔 🖖 🦫 ❤️` },
      { status: 400 }
    );
  }

  const db = getDb();
  const visitorHash = hashVisitor(request);

  try {
    const existing = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.postSlug, slug),
          eq(reactions.emoji, emoji),
          eq(reactions.visitorHash, visitorHash)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db.delete(reactions).where(eq(reactions.id, existing[0].id));
      return NextResponse.json({ action: "removed", emoji, slug });
    }

    await db.insert(reactions).values({
      postSlug: slug,
      emoji,
      visitorHash,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ action: "added", emoji, slug });
  } catch (err) {
    console.error("Failed to toggle reaction:", err);
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 });
  }
}