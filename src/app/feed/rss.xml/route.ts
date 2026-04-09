import { NextResponse } from "next/server";
import RSS from "rss";
import { getAllPublishedPosts, parsePostTags } from "@/lib/posts";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getAllPublishedPosts();

  const feed = new RSS({
    title: siteConfig.title,
    description: siteConfig.description,
    feed_url: `${siteConfig.url}/feed/rss.xml`,
    site_url: siteConfig.url,
    language: "en",
    pubDate: new Date().toUTCString(),
  });

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.excerpt,
      url: `${siteConfig.url}/blog/${post.slug}`,
      date: post.createdAt,
      categories: parsePostTags(post),
    });
  });

  return new NextResponse(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}