import { hfConfig, type TraceFile, type ParsedTrace, type TraceSession, type TraceMessage, type TraceEvent } from "./traces";

function huggingfaceUrl(path: string): string {
  return `${hfConfig.baseUrl}/${path}`;
}

/** Fetch the list of trace JSONL files from the HF dataset */
export async function getTraceList(): Promise<TraceFile[]> {
  const res = await fetch(hfConfig.apiUrl);
  if (!res.ok) throw new Error(`Failed to fetch dataset info: ${res.status}`);

  const data = await res.json() as {
    siblings: { rfilename: string; size?: number }[];
  };

  const files = data.siblings
    .filter((s) => s.rfilename.endsWith(".jsonl") && !s.rfilename.includes("manifest"))
    .map((s) => {
      // Extract ID and timestamp from filename pattern:
      // _upload_staging/2026-04-07T17-20-29-947Z_8612bc0a..._.jsonl
      const filename = s.rfilename;
      const match = filename.match(/(\d{4}-\d{2}-\d{2}T[\d-]+Z)_([a-f0-9-]+)/);
      const id = match?.[2] ?? filename.replace(/\.jsonl$/, "");
      const timestamp = match?.[1] ?? "";
      const date = timestamp
          ? new Date(
              timestamp
                .replace(/T(\d{2})-(\d{2})-(\d{2})-(\d+)Z/, "T$1:$2:$3.$4Z")
                .replace(/T(\d{2})-(\d{2})-(\d{2})Z/, "T$1:$2:$3Z")
            )
          : new Date();

      return {
        filename,
        id,
        timestamp,
        date,
        size: s.size,
      } satisfies TraceFile;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return files;
}

/** Fetch and parse a single trace file */
export async function getTrace(filename: string): Promise<ParsedTrace> {
  const res = await fetch(huggingfaceUrl(filename));
  if (!res.ok) throw new Error(`Failed to fetch trace: ${res.status}`);

  const text = await res.text();
  const lines = text.trim().split("\n");

  let session: TraceSession | null = null;
  const events: TraceEvent[] = [];
  const messages: TraceMessage[] = [];
  const modelChanges: ParsedTrace["modelChanges"] = [];

  let totalInput = 0;
  let totalOutput = 0;
  let userCount = 0;
  let assistantCount = 0;
  let toolCallCount = 0;
  let firstTs: string | null = null;
  let lastTs: string | null = null;

  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      const type = obj.type as string;

      if (type === "session") {
        session = obj as unknown as TraceSession;
      } else if (type === "message") {
        const msg = obj as unknown as TraceMessage;
        messages.push(msg);

        if (msg.message?.role === "user") userCount++;
        if (msg.message?.role === "assistant") {
          assistantCount++;
          if (msg.message?.content) {
            const contents = Array.isArray(msg.message.content)
              ? msg.message.content
              : [{ type: "text", text: String(msg.message.content) }];
            for (const c of contents) {
              if (typeof c === "object" && "type" in c && c.type === "toolCall") toolCallCount++;
            }
          }
        }

        if (msg.message?.usage) {
          totalInput += msg.message.usage.input ?? 0;
          totalOutput += msg.message.usage.output ?? 0;
        }

        const ts = obj.timestamp as string;
        if (!firstTs) firstTs = ts;
        lastTs = ts;
      } else if (type === "model_change") {
        modelChanges.push({
          id: obj.id as string,
          provider: obj.provider as string,
          modelId: obj.modelId as string,
        });
        events.push(obj as TraceEvent);
      } else {
        events.push(obj as TraceEvent);
      }
    } catch {
      // skip malformed lines
    }
  }

  // Calculate duration
  let duration = "N/A";
  if (firstTs && lastTs) {
    const diffMs = new Date(lastTs).getTime() - new Date(firstTs).getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    if (minutes > 0) {
      duration = `${minutes}m ${seconds}s`;
    } else {
      duration = `${seconds}s`;
    }
  }

  if (!session) {
    session = {
      id: filename,
      timestamp: firstTs ?? new Date().toISOString(),
      cwd: "/unknown",
      version: 3,
    };
  }

  const slug = filename
    .replace(/^_upload_staging\//, "")
    .replace(/\.jsonl$/, "");

  return {
    session,
    events,
    messages,
    modelChanges,
    stats: {
      totalEvents: lines.length,
      userMessages: userCount,
      assistantMessages: assistantCount,
      toolCalls: toolCallCount,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      duration,
    },
  };
}

/** Generate a short summary/title from the first user message */
export function getTraceTitle(trace: ParsedTrace): string {
  const firstUser = trace.messages.find(
    (m) => m.message?.role === "user"
  );
  if (!firstUser?.message?.content) return "Untitled Session";

  const contents = Array.isArray(firstUser.message.content)
    ? firstUser.message.content
    : [{ type: "text", text: String(firstUser.message.content) }];

  const textContent = contents.find((c) =>
    typeof c === "object" && "type" in c && c.type === "text"
  );

  if (!textContent || !("text" in textContent)) return "Untitled Session";

  const text = textContent.text as string;
  // Take first line, truncate
  const firstLine = text.split("\n")[0].trim();
  return firstLine.length > 100 ? firstLine.slice(0, 100) + "…" : firstLine;
}

/** Extract model name from modelChanges or messages */
export function getTraceModel(trace: ParsedTrace): string {
  if (trace.modelChanges.length > 0) {
    return trace.modelChanges[0].modelId;
  }
  // Fallback: find first message with a model
  for (const m of trace.messages) {
    if (m.modelId) return m.modelId;
  }
  return "unknown";
}