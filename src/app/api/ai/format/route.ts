import { NextRequest, NextResponse } from "next/server";

const OLLAMA_API_URL = "https://ollama.com/api/chat";
const MAX_TIMEOUT_MS = 300_000; // 5 min total
const MAX_CONTINUATIONS = 4; // max "continue" rounds per chunk
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

/**
 * Detect if output looks truncated — ends mid-sentence, mid-word, or without proper closing.
 * Returns true if the text seems like it was cut off before completing the formatting.
 */
function looksTruncated(text: string): boolean {
  const trimmed = text.trimEnd();
  if (!trimmed) return false;

  const lastLine = trimmed.split("\n").pop()!.trim();

  // Ends with sentence-ending punctuation — probably complete
  if (/[.!?]$/.test(lastLine)) return false;
  // Ends with a closing code fence — complete
  if (lastLine === "```") return false;
  // Ends with a complete markdown heading
  if (/^#{1,6}\s.+$/.test(lastLine)) return false;
  // Empty last line (proper paragraph break)
  if (lastLine === "") return false;

  // Ends with a colon, comma, semicolon — mid-thought
  if (/[:,;]$/.test(lastLine)) return true;
  // Ends with a word character with no punctuation — likely truncated
  if (/[a-zA-Z0-9]$/.test(lastLine)) return true;

  return false;
}

/**
 * Call the Ollama chat API, streaming each token via onToken callback.
 * Returns the full accumulated text when the model signals done.
 */
async function callModel(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<string> {
  const response = await fetch(OLLAMA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      think: false, // Disable chain-of-thought — it eats the token budget before content starts
      options: { num_predict: 8192 },
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`AI returned ${response.status}: ${errorText.slice(0, 200)}`);
  }

  if (!response.body) {
    throw new Error("No response stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

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
          fullText += token;
          onToken(token);
        }
        if (parsed.done === true) {
          return fullText;
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  }

  return fullText;
}

interface FormatRequest {
  content: string;
  /** Previous chunk's formatted output — sent as context for style consistency */
  previousFormatted?: string;
  chunkIndex?: number;
  totalChunks?: number;
}

/**
 * Agent-harness format endpoint.
 *
 * Instead of a single LLM call that truncates, this uses a **continuation loop**:
 * 1. Send the content for formatting
 * 2. If the output looks truncated, send a "continue" message
 * 3. Repeat until output looks complete or max continuations reached
 *
 * This is the "harness" pattern from LangChain — the model provides intelligence,
 * the harness provides the loop, truncation detection, and context management.
 */
export async function POST(request: NextRequest) {
  const apiKey = getOllamaApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Ollama API key not configured" }, { status: 500 });
  }

  let body: FormatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const content = body.content.slice(0, 2000);
  const chunkLabel = body.totalChunks ? ` (chunk ${body.chunkIndex}/${body.totalChunks})` : "";

  // Build system prompt — include previous chunk context for style consistency
  const previousContext = body.previousFormatted
    ? `\n\nPrevious chunk was formatted as:\n${body.previousFormatted.slice(-500)}\n\nKeep formatting style consistent (heading levels, list styles, etc.).`
    : "";

  const systemPrompt = `Reformat voice-dictated text into clean Markdown. Rules:
- Split into paragraphs at topic shifts
- Add ## or ### headings for new topics
- Bullet lists for enumerated items
- Fix punctuation, capitalization, filler words (um, uh, like)
- Do NOT change meaning or add information
- Preserve existing Markdown
- Output ONLY reformatted Markdown, no explanation${previousContext}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(streamController) {
      try {
        // ── Agent Harness: Continuation Loop ──
        // The harness wraps the model in a loop that detects truncated output
        // and sends "continue" messages until the formatting is complete.
        let accumulated = "";
        let continuations = 0;

        const messages: Array<{ role: string; content: string }> = [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ];

        while (continuations <= MAX_CONTINUATIONS) {
          const roundText = await callModel(
            apiKey,
            messages,
            controller.signal,
            // Stream every token directly to the client
            (token) => streamController.enqueue(encoder.encode(token)),
          );

          accumulated += roundText;

          // ── Truncation Detection ──
          // If output looks complete, we're done
          if (!looksTruncated(accumulated)) {
            break;
          }

          // Output looks truncated — ask the model to continue
          continuations++;
          console.log(`[ai/format] Truncated output detected, sending continuation ${continuations}${chunkLabel}`);

          // Send a progress marker the client can display
          streamController.enqueue(
            encoder.encode(`\n\n⏳ _Continuing formatting..._\n\n`)
          );

          // Add the partial output to the conversation, then ask to continue
          messages.push({ role: "assistant", content: accumulated });
          messages.push({
            role: "user",
            content: "You were cut off. Continue formatting from where you left off. Do NOT repeat what you already wrote — just continue.",
          });
        }

        if (looksTruncated(accumulated) && continuations > MAX_CONTINUATIONS) {
          streamController.enqueue(
            encoder.encode(`\n\n⚠️ _Formatting may be incomplete${chunkLabel}._`)
          );
        }

        clearTimeout(timeout);
        streamController.close();
      } catch (err: any) {
        clearTimeout(timeout);
        console.error("[ai/format] Error:", err);
        if (err?.name === "AbortError") {
          streamController.enqueue(
            encoder.encode(`\n\n⏱️ _Format timed out${chunkLabel}. Partial result shown._`)
          );
        } else {
          streamController.enqueue(
            encoder.encode(`\n\n❌ _Format error${chunkLabel}. Try again._`)
          );
        }
        try { streamController.close(); } catch {}
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
}