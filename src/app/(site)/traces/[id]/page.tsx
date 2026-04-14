import { notFound } from "next/navigation";
import { getTraceList, getTrace, getTraceTitle, getTraceModel } from "@/lib/huggingface";
import { TraceViewer } from "./trace-viewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface TracePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TracePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Trace: ${decodeURIComponent(id).slice(0, 50)}`,
    description: "AI coding agent trace session",
  };
}

export default async function TracePage({ params }: TracePageProps) {
  const { id } = await params;

  // Find the filename for this trace
  let files;
  try {
    files = await getTraceList();
  } catch {
    notFound();
  }

  // Look for the file matching the slug
  const file = files.find((f) =>
    f.filename.replace(/^_upload_staging\//, "").replace(/\.jsonl$/, "") === decodeURIComponent(id)
  );

  if (!file) notFound();

  let trace;
  try {
    trace = await getTrace(file.filename);
  } catch {
    notFound();
  }

  const title = getTraceTitle(trace);
  const model = getTraceModel(trace);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <Link
        href="/traces"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to traces
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl leading-snug">
          {title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <time dateTime={trace.session.timestamp}>
            {format(new Date(trace.session.timestamp), "MMMM d, yyyy · h:mm a")}
          </time>
          <span>·</span>
          <span>{trace.stats.duration}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{model}</Badge>
          <Badge variant="outline">{trace.stats.userMessages} prompts</Badge>
          <Badge variant="outline">{trace.stats.assistantMessages} responses</Badge>
          <Badge variant="outline">{trace.stats.toolCalls} tool calls</Badge>
          <Badge variant="outline">
            {(trace.stats.totalInputTokens / 1000).toFixed(1)}k in / {(trace.stats.totalOutputTokens / 1000).toFixed(1)}k out
          </Badge>
        </div>
      </header>

      <Separator className="mb-8" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Working Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="rounded bg-muted px-2 py-1 text-sm">{trace.session.cwd}</code>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Conversation</h2>
        <TraceViewer messages={trace.messages} />
      </div>

      <div className="mt-8 flex gap-3">
        <a
          href={`https://huggingface.co/datasets/moikapy/0xKobolds/resolve/main/${file.filename}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm transition-colors hover:bg-accent"
        >
          View raw JSONL on Hugging Face
        </a>
      </div>
    </div>
  );
}