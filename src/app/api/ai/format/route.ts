import { NextRequest, NextResponse } from "next/server";

const OLLAMA_API_URL = "https://ollama.com/api/chat";
const MAX_TIMEOUT_MS = 300_000; // 5:00 hard cap
const MODEL = "glm-5.1:cloud";

function getOllamaApiKey(): string | undefined {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    return ctx.env?.OLLAMA_API_KEY as string | undefined;
  } catch {
    return process.env.OLLAMA_API_KEY;
  }
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const apiKey = getOllamaApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Ollama API key not configured" }, { status: 500 });
  }

  let body: { content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const content = body.content.slice(0, 3000);

  const systemPrompt = `Reformat voice-dictated text into clean Markdown. Rules:
- Split into paragraphs at topic shifts
- Add ## or ### headings for new topics
- Bullet lists for enumerated items
- Fix punctuation, capitalization, filler words (um, uh, like)
- Do NOT change meaning or add information
- Preserve existing Markdown
- Output ONLY reformatted Markdown, no explanation`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);

    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content },
        ],
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      clearTimeout(timeout);
      const errorText = await response.text().catch(() => "");
      console.error("[ai/format] Ollama error:", response.status, errorText.slice(0, 300));

      if (response.status === 404) {
        return NextResponse.json(
          { error: `Model ${MODEL} not found. Check Ollama Cloud configuration.` },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: `AI returned ${response.status}. Try again.` },
        { status: 200 }
      );
    }

    if (!response.body) {
      clearTimeout(timeout);
      return NextResponse.json({ error: "No response stream" }, { status: 200 });
    }

    // Stream NDJSON tokens from Ollama as plain text to client
    // This keeps the connection alive past CF's 100s edge timeout
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        let buffer = "";
        let totalElapsed = 0;
        const startTime = Date.now();

        try {
          while (true) {
            // Check hard timeout
            totalElapsed = Date.now() - startTime;
            if (totalElapsed > MAX_TIMEOUT_MS) {
              console.error("[ai/format] Hard timeout after", Math.round(totalElapsed / 1000), "s");
              controller.close();
              break;
            }

            const { done, value } = await reader.read();
            if (done) {
              clearTimeout(timeout);
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              try {
                const parsed = JSON.parse(trimmed);
                const token = parsed.message?.content ?? "";
                if (token) {
                  controller.enqueue(encoder.encode(token));
                }
                if (parsed.done === true) {
                  clearTimeout(timeout);
                  controller.close();
                  return;
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        } catch (err) {
          clearTimeout(timeout);
          if ((err as Error).name === "AbortError") {
            console.error("[ai/format] Aborted after", Math.round((Date.now() - startTime) / 1000), "s");
          } else {
            console.error("[ai/format] Stream error:", err);
          }
          try { controller.close(); } catch {}
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { error: "AI took too long (5 min limit). Try with shorter content." },
        { status: 200 }
      );
    }
    console.error("[ai/format] Error:", err);
    return NextResponse.json(
      { error: "Failed to format. Try again." },
      { status: 200 }
    );
  }
}