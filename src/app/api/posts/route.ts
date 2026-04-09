import { NextRequest, NextResponse } from "next/server";
import { getAllPublishedPosts, getAllPosts, createPost, parsePostTags } from "@/lib/posts";
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

/** Internal handler — full content (free for own site) */
async function handleGetInternal(request: NextRequest): Promise<NextResponse> {
  const showAll = request.nextUrl.searchParams.get("all") === "1";
  try {
    const posts = showAll ? await getAllPosts() : await getAllPublishedPosts();
    return NextResponse.json(
      posts.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImage: p.coverImage ?? "",
        content: p.content,
        tags: parsePostTags(p),
        published: p.published,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        readingTime: p.readingTime,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

/** External (paid) handler — metadata only, no full content */
async function handleGetPaid(request: NextRequest): Promise<NextResponse> {
  try {
    const posts = await getAllPublishedPosts();
    return NextResponse.json(
      posts.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImage: p.coverImage ?? "",
        tags: parsePostTags(p),
        published: p.published,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        readingTime: p.readingTime,
        url: `https://moikapy.dev/blog/${p.slug}`,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// Paid wrapper for external consumers
const paidGetHandler = withPayment(handleGetPaid, {
  price: "$0.01",
  payTo: getPayToAddress(),
  network: "eip155:8453",
  description: "Access moikapy's blog posts API — AI engineering, gaming, 3D printing",
  mimeType: "application/json",
}, isSiteInternalRequest);

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Internal requests get full content for free
  if (isSiteInternalRequest(request)) {
    return handleGetInternal(request);
  }
  // External requests require payment
  logPaymentRequired("/api/posts", "$0.01");
  return paidGetHandler(request);
}

// POST /api/posts — create a new post (admin only, auth handled by middleware)
export async function POST(request: NextRequest) {
  try {
    const body: { slug: string; title: string; excerpt?: string; coverImage?: string; content: string; tags?: string[]; published?: boolean } = await request.json();
    const { slug, title, excerpt, coverImage, content, tags, published } = body;

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: "slug, title, and content are required" },
        { status: 400 }
      );
    }

    await createPost({ slug, title, excerpt, coverImage, content, tags, published });
    return NextResponse.json({ success: true, slug }, { status: 201 });
  } catch (err: any) {
    if (err?.message?.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}