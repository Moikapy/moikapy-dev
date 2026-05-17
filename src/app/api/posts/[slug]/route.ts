import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug, updatePost, deletePost, parsePostTags } from "@/lib/posts";
import { validateTitle, validateExcerpt, validateContent, validateTags, validateCoverImage, sanitizeHtmlContent } from "@/lib/sanitize";

// Force dynamic rendering — required for D1 context on Cloudflare Workers
export const dynamic = "force-dynamic";

// GET /api/posts/[slug] — get a single post
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage ?? "",
    content: post.content,
    tags: parsePostTags(post),
    published: post.published,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    readingTime: post.readingTime,
  });
}

// PATCH /api/posts/[slug] — update a post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const body: { title?: string; excerpt?: string; coverImage?: string; content?: string; tags?: string[]; published?: boolean } = await request.json();

    const existing = await getPostBySlug(slug);
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Validate only provided fields — only include defined, non-undefined values
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = validateTitle(body.title);
    if (body.excerpt !== undefined) updates.excerpt = validateExcerpt(body.excerpt);
    if (body.content !== undefined) updates.content = sanitizeHtmlContent(validateContent(body.content));
    if (body.tags !== undefined) updates.tags = validateTags(body.tags);
    if (body.coverImage !== undefined) {
      const coverImage = validateCoverImage(body.coverImage);
      if (coverImage !== null) updates.coverImage = coverImage;
      // Setting coverImage to null clears it; we pass null explicitly
      else updates.coverImage = null;
    }
    if (body.published !== undefined) {
      if (typeof body.published !== "boolean") throw new Error("published must be a boolean");
      updates.published = body.published;
    }

    await updatePost(slug, updates as Parameters<typeof updatePost>[1]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("must be") || message.includes("must be a")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Failed to update post:", err);
    return NextResponse.json({ error: "Failed to update post", detail: message }, { status: 500 });
  }
}

// DELETE /api/posts/[slug] — delete a post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const existing = await getPostBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await deletePost(slug);
  return NextResponse.json({ success: true });
}