import { NextRequest, NextResponse } from "next/server";
import { getAllPublishedPosts, getAllPosts, createPost, parsePostTags } from "@/lib/posts";

// GET /api/posts — list all posts (public shows published only, with ?all=1 shows drafts too)
export async function GET(request: NextRequest) {
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
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST /api/posts — create a new post
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