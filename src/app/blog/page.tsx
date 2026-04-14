import { PostCard } from "@/components/post-card";
import { getAllPublishedPosts, parsePostTags } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog",
  description: "All posts by moikapy — AI engineering, gaming, and building cool stuff.",
};

export default async function BlogPage() {
  const posts = await getAllPublishedPosts();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
      <p className="mt-2 text-muted-foreground">
        Writing about AI engineering, gaming, and the projects I&apos;m building.
      </p>

      {posts.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No posts yet. Check back soon!</p>
      ) : (
        <div className="mt-8 columns-1 sm:columns-2 gap-4 space-y-4">
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