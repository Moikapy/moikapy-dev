import { NextRequest, NextResponse } from "next/server";

const OLLAMA_API_URL = "https://ollama.com/api/chat";
const TIMEOUT_MS = 25_000;

function getOllamaApiKey(): string | undefined {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    return ctx.env?.OLLAMA_API_KEY as string | undefined;
  } catch {
    return process.env.OLLAMA_API_KEY;
  }
}

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

  // Limit to 2000 chars — chunks already split at 1500 on the client
  const content = body.content.slice(0, 2000);

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
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kimi-k2.5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // If kimi-k2.5 doesn't exist, try glm-5.1 as fallback
      if (response.status === 404 || response.status === 400) {
        console.log("[ai/format] kimi-k2.5 not available, falling back to glm-5.1");
        clearTimeout(undefined);

        const fallbackController = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), TIMEOUT_MS);

        try {
          const fallbackRes = await fetch(OLLAMA_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "glm-5.1",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: content },
              ],
              stream: false,
            }),
            signal: fallbackController.signal,
          });

          clearTimeout(fallbackTimeout);

          if (!fallbackRes.ok) {
            const errText = await fallbackRes.text().catch(() => "");
            console.error("[ai/format] Fallback also failed:", fallbackRes.status, errText.slice(0, 200));
            return NextResponse.json(
              { error: `AI service unavailable (${fallbackRes.status}). Try again later.` },
              { status: 200 }
            );
          }

          const fallbackData: { message?: { content?: string }; choices?: { message?: { content?: string } }[] } = await fallbackRes.json();
          return processFormatResponse(fallbackData);
        } catch (fallbackErr: any) {
          clearTimeout(fallbackTimeout);
          if (fallbackErr?.name === "AbortError") {
            return NextResponse.json(
              { error: "AI took too long. Try with shorter content." },
              { status: 200 }
            );
          }
          return NextResponse.json(
            { error: "Failed to format. Try again." },
            { status: 200 }
          );
        }
      }

      const errorText = await response.text().catch(() => "");
      console.error("[ai/format] Ollama error:", response.status, errorText.slice(0, 300));
      return NextResponse.json(
        { error: `AI returned ${response.status}. Try again.` },
        { status: 200 }
      );
    }

    const data: { message?: { content?: string }; choices?: { message?: { content?: string } }[] } = await response.json();
    return processFormatResponse(data);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.error("[ai/format] Timed out after", TIMEOUT_MS, "ms");
      return NextResponse.json(
        { error: "AI took too long. Try with shorter content." },
        { status: 200 }
      );
    }
    console.error("[ai/format] Error:", err);
    return NextResponse.json(
      { error: "Failed to format content. Try again." },
      { status: 200 }
    );
  }
}

function processFormatResponse(data: { message?: { content?: string }; choices?: { message?: { content?: string } }[] }): NextResponse {
  let formatted = data.message?.content ?? data.choices?.[0]?.message?.content ?? "";

  // Strip markdown code block wrapping if present
  const codeBlockMatch = formatted.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    formatted = codeBlockMatch[1];
  }

  if (!formatted.trim()) {
    return NextResponse.json({ error: "AI returned empty content. Try again." }, { status: 200 });
  }

  return NextResponse.json({ content: formatted.trim() });
}