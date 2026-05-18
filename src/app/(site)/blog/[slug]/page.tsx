import { notFound } from "next/navigation";
import { getPostBySlug, getAllPublishedPosts, getCachedPublishedPosts, parsePostTags } from "@/lib/posts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { blogPostJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import Link from "next/link";
import { remark } from "remark";
import html from "remark-html";
import { ReactionBar } from "@/components/reaction-bar";
import { RelatedPosts } from "@/components/related-posts";
import { ShareButton } from "@/components/share-button";
import { getCommunityInsights, getFallbackInsights } from "@/lib/community-insights";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const posts = await getCachedPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const ogImage = post.coverImage || `${siteConfig.url}/opengraph-image`;

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      tags: parsePostTags(post),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || undefined,
      images: [ogImage],
    },
    alternates: {
      canonical: `${siteConfig.url}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const tags = parsePostTags(post);
  const htmlContent = (await remark().use(html).process(post.content)).toString();

  // Load community insights for related posts
  let insights = await getCommunityInsights();
  if (!insights) {
    insights = await getFallbackInsights();
  }

  // Load post stats (views + shares)
  let postViews = 0;
  let postShares = 0;
  try {
    const { env } = getCloudflareContext();
    const db = env.DB;
    if (db) {
      const dateGeq = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const [viewRow, shareRow] = await Promise.all([
        db.prepare("SELECT COALESCE(SUM(views), 0) as views FROM page_views WHERE path = ? AND date >= ?").bind(`/blog/${slug}`, dateGeq).first(),
        db.prepare("SELECT COALESCE(SUM(shares), 0) as shares FROM page_shares WHERE path = ? AND date >= ?").bind(`/blog/${slug}`, dateGeq).first(),
      ]);
      postViews = Number((viewRow as any)?.views ?? 0);
      postShares = Number((shareRow as any)?.shares ?? 0);
    }
  } catch {
    // Stats are non-critical
  }

  return (
    <article className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      {/* JSON-LD for SEO and AI agents */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostJsonLd({
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            coverImage: post.coverImage,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            tags,
            readingTime: post.readingTime,
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: "Home", url: siteConfig.url },
            { name: "Blog", url: `${siteConfig.url}/blog` },
            { name: post.title, url: `${siteConfig.url}/blog/${post.slug}` },
          ])),
        }}
      />

      <Link
        href="/blog"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to blog
      </Link>

      {/* Cover image */}
      {post.coverImage && (
        <div className="mb-8 overflow-hidden rounded-xl">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full object-cover aspect-[2/1]"
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-heading">{post.title}</h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <time dateTime={post.createdAt}>{format(new Date(post.createdAt), "MMMM d, yyyy")}</time>
          <span>·</span>
          <span>{post.readingTime}</span>
          {postViews > 0 && (
            <>
              <span>·</span>
              <span>{postViews.toLocaleString()} view{postViews !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
                <Badge variant="secondary" className="hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      <Separator className="mb-8" />

      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Reactions & Share */}
      <div className="mt-12 pt-8 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">How did this post make you feel?</h3>
          <ShareButton slug={post.slug} title={post.title} shares={postShares} />
        </div>
        <ReactionBar slug={post.slug} />
      </div>

      {/* Related posts — community-driven */}
      <RelatedPosts slug={post.slug} insights={insights} />
    </article>
  );
}