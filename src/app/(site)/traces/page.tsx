import { getTraceList, getTrace, getTraceTitle, getTraceModel } from "@/lib/huggingface";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Traces",
  description: "Coding agent sessions from building 0xKobold — real AI traces, unedited and redacted.",
};

export default async function TracesPage() {
  let files;
  let traceData: { filename: string; id: string; timestamp: string; date: Date; size?: number; slug: string; title: string; model: string; stats: { duration: string; userMessages: number; toolCalls: number } }[] = [];

  try {
    files = await getTraceList();

    // Fetch metadata for each trace (parallel)
    traceData = await Promise.all(
      files.slice(0, 20).map(async (file) => {
        const slug = file.filename.replace(/^_upload_staging\//, "").replace(/\.jsonl$/, "");
        try {
          const trace = await getTrace(file.filename);
          return {
            filename: file.filename,
            id: file.id,
            timestamp: file.timestamp,
            date: file.date,
            size: file.size,
            slug,
            title: getTraceTitle(trace),
            model: getTraceModel(trace),
            stats: {
              duration: trace.stats.duration,
              userMessages: trace.stats.userMessages,
              toolCalls: trace.stats.toolCalls,
            },
          };
        } catch {
          return {
            filename: file.filename,
            id: file.id,
            timestamp: file.timestamp,
            date: file.date,
            size: file.size,
            slug,
            title: "Failed to load",
            model: "unknown",
            stats: { duration: "N/A", userMessages: 0, toolCalls: 0 },
          };
        }
      })
    );
  } catch {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Traces</h1>
        <p className="mt-4 text-muted-foreground">
          Unable to load traces from Hugging Face right now. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Traces</h1>
      <p className="mt-2 text-muted-foreground">
        Real coding agent sessions from building{" "}
        <a
          href="https://github.com/0xKobold/0xkobolds"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          0xKobold
        </a>
        . Unedited, redacted traces of AI-assisted development. Available on{" "}
        <a
          href="https://huggingface.co/datasets/moikapy/0xKobolds"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Hugging Face
        </a>
        .
      </p>

      <Separator className="my-8" />

      {traceData.length === 0 ? (
        <p className="text-muted-foreground">No traces available yet.</p>
      ) : (
        <div className="space-y-4">
          {traceData.map(({ filename, id, title, model, stats, date, timestamp, slug }) => (
            <Link key={id} href={`/traces/${slug}`}>
              <Card className="group transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <time dateTime={timestamp}>
                      {date && !isNaN(date.getTime()) ? format(date, "MMM d, yyyy · h:mm a") : timestamp}
                    </time>
                    <span>·</span>
                    <span>{stats.duration}</span>
                  </div>
                  <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {model}
                    </Badge>
                    {stats.userMessages > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {stats.userMessages} prompts
                      </Badge>
                    )}
                    {stats.toolCalls > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {stats.toolCalls} tool calls
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}