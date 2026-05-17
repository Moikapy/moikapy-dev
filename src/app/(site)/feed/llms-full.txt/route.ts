import { getCachedPublishedPosts, parsePostTags } from "@/lib/posts";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getCachedPublishedPosts();

  const sections = posts.map((post) => {
    const tags = parsePostTags(post);
    return [
      `## ${post.title}`,
      ``,
      `URL: ${siteConfig.url}/blog/${post.slug}`,
      `Published: ${post.createdAt}`,
      `Updated: ${post.updatedAt}`,
      `Reading time: ${post.readingTime}`,
      `Tags: ${tags.join(", ")}`,
      ``,
      post.excerpt ? `> ${post.excerpt}` : "",
      ``,
      post.content,
    ].filter(Boolean).join("\n");
  });

  const body = [
    `# ${siteConfig.name}`,
    ``,
    `> ${siteConfig.description}`,
    ``,
    `URL: ${siteConfig.url}`,
    `Author: ${siteConfig.author}`,
    `RSS: ${siteConfig.url}/feed/rss.xml`,
    `API: ${siteConfig.url}/api`,
    `SKILL.md: ${siteConfig.url}/SKILL.md`,
    ``,
    `---`,
    ``,
    ...sections,
    ``,
    `---`,
    ``,
    `# Token`,
    ``,
    `$KAPY on Base: ${siteConfig.token.address}`,
    `Flaunch: ${siteConfig.token.url}`,
    ``,
    `Built with x402. Monetize your knowledge.`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}