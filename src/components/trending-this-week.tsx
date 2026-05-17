import { PostCard } from "@/components/post-card";
import { getCachedPublishedPosts } from "@/lib/posts";
import type { CommunityInsights } from "@/lib/community-insights";

interface TrendingThisWeekProps {
  insights: CommunityInsights | null;
}

export async function TrendingThisWeek({ insights }: TrendingThisWeekProps) {
  if (!insights?.trending_slugs?.length) return null;

  // Fetch trending posts by slug
  const allPosts = await getCachedPublishedPosts();
  const trendingPosts = insights.trending_slugs
    .map((slug) => allPosts.find((p) => p.slug === slug))
    .filter(Boolean)
    .slice(0, 4);

  if (trendingPosts.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔥</span>
        <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">Trending This Week</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {trendingPosts.map((post) =>
          post ? (
            <PostCard
              key={post.slug}
              post={{
                slug: post.slug,
                title: post.title,
                date: post.createdAt,
                excerpt: post.excerpt,
                coverImage: post.coverImage,
                tags: [] /* tags not needed for trending cards */,
                published: post.published,
                readingTime: post.readingTime,
              }}
            />
          ) : null
        )}
      </div>
    </section>
  );
}