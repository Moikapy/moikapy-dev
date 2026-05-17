import { NextRequest, NextResponse } from "next/server";
import { streamOrigen } from "@moikapy/origen";
import type { StreamEvent } from "@moikapy/origen";
import { blogConfig } from "@/lib/origen";

export const dynamic = "force-dynamic";

const MAX_TIMEOUT_MS = 300_000; // 5 min total

/**
 * Detect if output looks truncated — ends mid-sentence, mid-word, or without proper closing.
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

interface FormatRequest {
  content: string;
  /** Previous chunk's formatted output — sent as context for style consistency */
  previousFormatted?: string;
  chunkIndex?: number;
  totalChunks?: number;
}

/**
 * Format endpoint using Origen's agent loop.
 *
 * Origen handles the model streaming and we add a continuation harness
 * on top: if the output looks truncated, we send a "continue" message
 * to get the rest. This gives us the full response for long blog posts
 * without manual chunking.
 */
export async function POST(request: NextRequest) {
  let body: FormatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const content = body.content.slice(0, 8000);
  const chunkLabel = body.totalChunks ? ` (chunk ${body.chunkIndex}/${body.totalChunks})` : "";

  // Build system prompt — include previous chunk context for style consistency
  const previousContext = body.previousFormatted
    ? `\n\nPrevious chunk was formatted as:\n${body.previousFormatted.slice(-500)}\n\nKeep formatting style consistent (heading levels, list styles, etc.).`
    : "";

  const systemPrompt = `Reformat voice-dictated text into clean Markdown. CRITICAL RULES:
- You MUST include EVERY sentence from the input in the output. Do NOT summarize, abbreviate, or skip any content.
- The output must contain ALL the same information as the input, just reformatted.
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
  const MAX_CONTINUATIONS = 4;

  const stream = new ReadableStream({
    async start(streamController) {
      try {
        let accumulated = "";
        let continuations = 0;
        const messages: Array<{ role: "user" | "assistant"; content: string }> = [
          { role: "user", content },
        ];

        while (continuations <= MAX_CONTINUATIONS) {
          // Use Origen's streaming agent loop for each round
          let roundText = "";
          const config = blogConfig(systemPrompt, controller.signal);

          for await (const event of streamOrigen(messages, undefined, config)) {
            if (event.type === "text") {
              roundText += event.content;
              streamController.enqueue(encoder.encode(event.content));
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
            // Ignore tool_call, tool_result, reasoning, citation events — no tools
          }

          accumulated += roundText;

          // ── Truncation Detection ──
          if (!looksTruncated(accumulated)) {
            break;
          }

          // Output looks truncated — send a continuation round
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
      } catch (err: unknown) {
        clearTimeout(timeout);
        const message = err instanceof Error ? err.message : String(err);
        console.error("[ai/format] Error:", message);
        if (err instanceof Error && err.name === "AbortError") {
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