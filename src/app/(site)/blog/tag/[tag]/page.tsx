import { getAllTags, getPostsByTag, parsePostTags } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `Posts tagged "${decoded}"`,
    description: `All posts tagged "${decoded}" on the moikapy blog.`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = await getPostsByTag(decoded);
  const allTags = await getAllTags();

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All posts
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">
        Posts tagged &ldquo;{decoded}&rdquo;
      </h1>
      <p className="mt-1 text-muted-foreground">
        {posts.length} post{posts.length !== 1 ? "s" : ""}
      </p>

      {/* Tag cloud */}
      <div className="mt-6 flex flex-wrap gap-2">
        {allTags.map((t) => (
          <Link
            key={t}
            href={`/blog/tag/${encodeURIComponent(t)}`}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              t.toLowerCase() === decoded.toLowerCase()
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard
            key={post.slug}
            post={{
              slug: post.slug,
              title: post.title,
              date: post.createdAt,
              excerpt: post.excerpt,
              coverImage: post.coverImage,
              tags: parsePostTags(post),
              published: post.published,
              readingTime: post.readingTime,
            }}
          />
        ))}
      </div>
    </div>
  );
}