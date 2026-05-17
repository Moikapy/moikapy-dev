import { NextRequest, NextResponse } from "next/server";
import { getCachedPublishedPosts, parsePostTags } from "@/lib/posts";
import { withPayment, isSiteInternalRequest } from "@/lib/x402-lite";
import { logPaymentRequired } from "@/lib/analytics";

export const dynamic = "force-dynamic";

function getPayToAddress(): string {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const addr = ctx.env?.WALLET_ADDRESS;
    if (typeof addr === "string" && addr.startsWith("0x")) return addr;
  } catch {
    // not in CF context
  }
  const envAddr = process.env.WALLET_ADDRESS;
  if (envAddr && envAddr.startsWith("0x")) return envAddr;
  return "0x0000000000000000000000000000000000000000";
}

async function knowledgeHandler(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase().trim().slice(0, 200);
  const tag = searchParams.get("tag")?.toLowerCase().trim().slice(0, 100);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "10") || 10, 1), 50);

  if (!query && !tag) {
    return NextResponse.json(
      {
        error: "Provide a query parameter: ?q=search+terms or ?tag=ai-engineering",
        example: "/api/knowledge?q=RAG+pipeline",
        pricing: {
          perRequest: "$0.02",
          network: "Base (eip155:8453)",
          token: "USDC",
        },
      },
      { status: 400 }
    );
  }

  // Use cached posts — avoids hitting D1 on every search
  const allPosts = await getCachedPublishedPosts();

  // Limit search terms to prevent abuse
  const terms = query ? query.split(/\s+/).filter(Boolean).slice(0, 10) : [];

  const scored = allPosts.map((post) => {
    const title = post.title.toLowerCase();
    const excerpt = post.excerpt.toLowerCase();
    const content = post.content.toLowerCase();
    const tags = parsePostTags(post).map((t) => t.toLowerCase());

    let score = 0;

    for (const term of terms) {
      if (title.includes(term)) score += 10;
      if (excerpt.includes(term)) score += 5;
      if (content.includes(term)) score += 2;
      if (tags.some((t) => t.includes(term))) score += 8;
    }

    if (tag) {
      if (tags.some((t) => t.includes(tag))) score += 15;
      if (title.includes(tag)) score += 5;
    }

    return { post, score };
  });

  const results = scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post, score }) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage ?? "",
      tags: parsePostTags(post),
      readingTime: post.readingTime,
      publishedAt: post.createdAt,
      url: `https://moikapy.dev/blog/${post.slug}`,
      relevanceScore: score,
    }));

  return NextResponse.json({
    query: query || tag,
    results,
    total: results.length,
  });
}

export const GET = withPayment(knowledgeHandler, {
  price: "$0.02",
  payTo: getPayToAddress(),
  network: "eip155:8453",
  description: "Search moikapy's knowledge base — AI engineering, gaming, 3D printing",
  mimeType: "application/json",
}, (req) => {
  logPaymentRequired("/api/knowledge", "$0.02");
  return isSiteInternalRequest(req);
});