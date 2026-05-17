import Link from "next/link";
import { getCachedPublishedPosts } from "@/lib/posts";
import type { CommunityInsights } from "@/lib/community-insights";

interface RelatedPostsProps {
  slug: string;
  insights: CommunityInsights | null;
}

export async function RelatedPosts({ slug, insights }: RelatedPostsProps) {
  // Get related slugs from insights, fall back to co-occurrence
  const relatedSlugs = insights?.related?.[slug];
  if (!relatedSlugs?.length) return null;

  const allPosts = await getCachedPublishedPosts();
  const relatedPosts = relatedSlugs
    .map((s) => allPosts.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined && p.published)
    .slice(0, 3);

  if (relatedPosts.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-xl font-bold mb-4 font-heading">Related Posts</h2>
      <div className="grid gap-3">
        {relatedPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                {post.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {post.readingTime} · {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}