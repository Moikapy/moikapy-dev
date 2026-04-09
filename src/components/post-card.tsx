import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface PostCardProps {
  post: {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    coverImage?: string | null;
    tags: string[];
    published: boolean;
    readingTime: string;
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="group h-full transition-all hover:border-primary/50 hover:shadow-md overflow-hidden">
        {post.coverImage && (
          <div className="aspect-[2/1] overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <time dateTime={post.date}>{format(new Date(post.date), "MMM d, yyyy")}</time>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
          <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}