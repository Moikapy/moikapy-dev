import { NextResponse } from "next/server";
import { getAllPublishedPosts, parsePostTags } from "@/lib/posts";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getAllPublishedPosts();

  const events = posts.map((post) => ({
    kind: 30023,
    content: post.content,
    created_at: Math.floor(new Date(post.createdAt).getTime() / 1000),
    tags: [
      ["d", post.slug],
      ["title", post.title],
      ["published_at", Math.floor(new Date(post.createdAt).getTime() / 1000).toString()],
      ...parsePostTags(post).map((tag) => ["t", tag]),
      ...(siteConfig.nostr.npub ? [["p", siteConfig.nostr.npub]] : []),
    ],
  }));

  const response = {
    relays: siteConfig.nostr.relays,
    npub: siteConfig.nostr.npub || null,
    events,
  };

  return new NextResponse(JSON.stringify(response, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}