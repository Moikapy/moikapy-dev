import { getCachedPublishedPosts, parsePostTags, getCachedTags } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { siteConfig } from "@/lib/config";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "All posts by moikapy — AI engineering, gaming, and building cool stuff.",
  alternates: {
    canonical: `${siteConfig.url}/blog`,
  },
};

export default async function BlogPage() {
  const posts = await getCachedPublishedPosts();
  const tags = await getCachedTags();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      {/* JSON-LD Breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: "Home", url: siteConfig.url },
            { name: "Blog", url: `${siteConfig.url}/blog` },
          ])),
        }}
      />

      <h1 className="text-3xl font-bold tracking-tight font-heading">Blog</h1>
      <p className="mt-2 text-muted-foreground">
        Writing about AI engineering, gaming, and the projects I&apos;m building.
      </p>

      {/* Tag cloud */}
      {tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No posts yet. Check back soon!</p>
      ) : (
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
      )}
    </div>
  );
}