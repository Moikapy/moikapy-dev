import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug, updatePost, deletePost, parsePostTags } from "@/lib/posts";

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
  const body: { title?: string; excerpt?: string; coverImage?: string; content?: string; tags?: string[]; published?: boolean } = await request.json();
  const { title, excerpt, coverImage, content, tags, published } = body;

  const existing = await getPostBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await updatePost(slug, { title, excerpt, coverImage, content, tags, published });
  return NextResponse.json({ success: true });
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