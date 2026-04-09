import { notFound } from "next/navigation";
import { getPostBySlug, getAllPublishedPosts, parsePostTags } from "@/lib/posts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import Link from "next/link";
import { remark } from "remark";
import html from "remark-html";
import { ReactionBar } from "@/components/reaction-bar";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

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

  return (
    <article className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
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
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <time dateTime={post.createdAt}>{format(new Date(post.createdAt), "MMMM d, yyyy")}</time>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <Separator className="mb-8" />

      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Reactions */}
      <div className="mt-12 pt-8 border-t border-border">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">How did this post make you feel?</h3>
        <ReactionBar slug={post.slug} />
      </div>
    </article>
  );
}