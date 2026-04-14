import { eq, desc } from "drizzle-orm";
import { posts, type Post } from "@/db/schema";
import { createDb } from "@/db";
import { getLocalDb } from "@/db/local";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type { Post };

export interface PostWithReadingTime extends Post {
  readingTime: string;
}

function estimateReadingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

export function isLocalDev(): boolean {
  try {
    const ctx = getCloudflareContext();
    return !("DB" in ctx.env && ctx.env.DB);
  } catch {
    return true;
  }
}

/**
 * Returns a Drizzle query builder.
 * - Production: Cloudflare D1 (via cloudflare context)
 * - Local dev: better-sqlite3 (stored in .local/dev.db)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(): any {
  try {
    const ctx = getCloudflareContext();
    const d1 = ctx.env.DB as D1Database | undefined;
    if (d1) {
      return createDb(d1);
    }
  } catch {
    // Not running in Cloudflare — fall through to local
  }
  return getLocalDb();
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
}

export async function updatePost(
  slug: string,
  data: {
    title?: string;
    excerpt?: string;
    coverImage?: string;
    content?: string;
    tags?: string[];
    published?: boolean;
  }
) {
  const db = getDb();
  const { tags: rawTags, ...restData } = data;
  await db
    .update(posts)
    .set({
      ...restData,
      ...(rawTags !== undefined ? { tags: JSON.stringify(rawTags) } : {}),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.slug, slug));
}

export async function deletePost(slug: string) {
  const db = getDb();
  await db.delete(posts).where(eq(posts.slug, slug));
}

export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllPublishedPosts();
  const tagSet = new Set<string>();
  allPosts.forEach((post) => parseTags(post.tags).forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

export async function getPostsByTag(tag: string): Promise<PostWithReadingTime[]> {
  const allPosts = await getAllPublishedPosts();
  return allPosts.filter((post) => parseTags(post.tags).some((t) => t.toLowerCase() === tag.toLowerCase()));
}

// Helper to parse tags JSON field
export function parsePostTags(post: Post): string[] {
  return parseTags(post.tags);
}