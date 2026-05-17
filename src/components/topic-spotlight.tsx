import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/post-card";
import { getCachedPublishedPosts } from "@/lib/posts";
import type { CommunityInsights } from "@/lib/community-insights";

interface TopicSpotlightProps {
  insights: CommunityInsights | null;
}

export async function TopicSpotlight({ insights }: TopicSpotlightProps) {
  if (!insights?.spotlight_tag || !insights?.spotlight_slugs?.length) return null;

  const allPosts = await getCachedPublishedPosts();
  const spotlightPosts = insights.spotlight_slugs
    .map((slug) => allPosts.find((p) => p.slug === slug))
    .filter(Boolean)
    .filter((p) => p?.published)
    .slice(0, 3);

  if (spotlightPosts.length === 0) return null;

  const tagUrl = `/blog/tag/${encodeURIComponent(insights.spotlight_tag)}`;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">💡</span>
        <h2 className="text-2xl font-bold tracking-tight">
          Deep Dive: {insights.spotlight_tag.charAt(0).toUpperCase() + insights.spotlight_tag.slice(1)}
        </h2>
        <Link href={tagUrl}>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
            View all →
          </Badge>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spotlightPosts.map((post) =>
          post ? (
            <PostCard
              key={post.slug}
              post={{
                slug: post.slug,
                title: post.title,
                date: post.createdAt,
                excerpt: post.excerpt,
                coverImage: post.coverImage,
                tags: [],
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