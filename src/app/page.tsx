import { getAllPublishedPosts, parsePostTags } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { siteConfig } from "@/lib/config";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getAllPublishedPosts();
  const recentPosts = posts.slice(0, 6);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      {/* Hero */}
      <section className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {siteConfig.author}
        </h1>
        <p className="mt-2 text-lg font-medium text-primary">{siteConfig.tag}</p>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          AI engineer building with LLMs, agents, and real-time systems.
          Gamer at heart — streaming, modding, and shipping side projects.
          Writing about what I build and what I learn along the way.
        </p>
        <a
          href={siteConfig.token.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 text-sm font-medium text-orange-500 transition-colors hover:bg-orange-500/20 hover:border-orange-500/50"
        >
          <img src="/capybara-128.webp" alt="KAPY" className="h-4 w-4 rounded" />
          ${siteConfig.token.symbol} on Base
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
          </svg>
        </a>
      </section>

      <Separator className="mb-12" />

      {/* Recent Posts */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent Posts</h2>
          {posts.length > 6 && (
            <a
              href="/blog"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </a>
          )}
        </div>

        {recentPosts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet. Check back soon!</p>
        ) : (
          <div className="columns-1 sm:columns-2 gap-4 space-y-4">
            {recentPosts.map((post) => (
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
        )}
      </section>
    </div>
  );
}