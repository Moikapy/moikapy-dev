import { eq, desc } from "drizzle-orm";
import { posts, postTags, type Post } from "@/db/schema";
import { getDb } from "@/db/connection";
import { unstable_cache } from "next/cache";

export type { Post };

export interface PostWithReadingTime extends Post {
  readingTime: string;
}

function estimateReadingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson);
  } catch {
    return [];
  }
}

function withReadingTime(post: Post): PostWithReadingTime {
  return {
    ...post,
    readingTime: estimateReadingTime(post.content),
  };
}

export async function getAllPublishedPosts(): Promise<PostWithReadingTime[]> {
  const db = getDb();
  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt));

  return result.map(withReadingTime);
}

export async function getAllPosts(): Promise<PostWithReadingTime[]> {
  const db = getDb();
  const result = await db.select().from(posts).orderBy(desc(posts.createdAt));
  return result.map(withReadingTime);
}

export async function getPostBySlug(slug: string): Promise<PostWithReadingTime | null> {
  const db = getDb();
  const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  if (result.length === 0) return null;
  return withReadingTime(result[0]);
}

export async function createPost(data: {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  content: string;
  tags?: string[];
  published?: boolean;
}) {
  const db = getDb();
  const now = new Date().toISOString();
  await db.insert(posts).values({
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt ?? "",
    coverImage: data.coverImage ?? null,
    content: data.content,
    tags: JSON.stringify(data.tags ?? []),
    published: data.published ?? false,
    createdAt: now,
    updatedAt: now,
  });

  // Insert tags into junction table
  if (data.tags && data.tags.length > 0) {
    await db.insert(postTags).values(
      data.tags.map((tag) => ({ slug: data.slug, tag }))
    );
  }
}

export async function updatePost(
  slug: string,
  data: {
    title?: string;
    excerpt?: string;
    coverImage?: string | null;
    content?: string;
    tags?: string[];
    published?: boolean;
  }
) {
  const db = getDb();
  const { tags: rawTags, ...restData } = data;

  // Strip undefined values — Drizzle .set() should skip them,
  // but explicit filtering prevents edge-case crashes
  const definedUpdates = Object.fromEntries(
    Object.entries(restData).filter(([, v]) => v !== undefined)
  );

  await db
    .update(posts)
    .set({
      ...definedUpdates,
      ...(rawTags !== undefined ? { tags: JSON.stringify(rawTags) } : {}),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.slug, slug));

  // Update junction table if tags provided
  if (rawTags !== undefined) {
    await db.delete(postTags).where(eq(postTags.slug, slug));
    if (rawTags.length > 0) {
      await db.insert(postTags).values(
        rawTags.map((tag) => ({ slug, tag }))
      );
    }
  }
}

export async function deletePost(slug: string) {
  const db = getDb();
  // junction table cascades on delete
  await db.delete(posts).where(eq(posts.slug, slug));
}

export async function getAllTags(): Promise<string[]> {
  const db = getDb();
  // Prefer junction table for accurate tag counts
  const result = await db
    .select({ tag: postTags.tag })
    .from(postTags)
    .innerJoin(posts, eq(postTags.slug, posts.slug))
    .where(eq(posts.published, true));

  const tagSet = new Set(result.map((r) => r.tag));
  return Array.from(tagSet).sort();
}

export async function getPostsByTag(tag: string): Promise<PostWithReadingTime[]> {
  const db = getDb();
  const matchingSlugs = await db
    .select({ slug: postTags.slug })
    .from(postTags)
    .where(eq(postTags.tag, tag));

  if (matchingSlugs.length === 0) return [];

  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt));

  const slugSet = new Set(matchingSlugs.map((r) => r.slug));
  return result
    .filter((post) => slugSet.has(post.slug))
    .map(withReadingTime);
}

// ── Cached versions for public-facing reads ──────────────────────

export const getCachedPublishedPosts = unstable_cache(
  getAllPublishedPosts,
  ["published-posts"],
  { revalidate: 300 }
);

export const getCachedTags = unstable_cache(
  getAllTags,
  ["all-tags"],
  { revalidate: 300 }
);

// Helper to parse tags JSON field (backward compat)
export function parsePostTags(post: Post): string[] {
  return parseTags(post.tags);
}