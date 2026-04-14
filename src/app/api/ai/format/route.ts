import { NextRequest, NextResponse } from "next/server";

const OLLAMA_API_URL = "https://ollama.com/api/chat";
const TIMEOUT_MS = 20_000; // Keep well under Cloudflare's 100s limit

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

  // Limit to 3000 chars to keep AI response fast — enough for a typical blog section
  const content = body.content.slice(0, 3000);

  const systemPrompt = `Reformat voice-dictated text into clean Markdown. Split into paragraphs, add headings (##/###) for topic changes, bullet lists for items, fix punctuation and remove filler words (um, uh). Preserve existing Markdown. Do NOT change meaning or add information. Output ONLY the formatted Markdown.`;

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
        model: "glm-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Format this dictated text:\n\n${content}` },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[ai/format] Ollama error:", response.status, errorText.slice(0, 300));
      const msg = response.status === 524
        ? "AI service timed out. Try with shorter content."
        : `AI service returned ${response.status}. Try again in a moment.`;
      return NextResponse.json({ error: msg }, { status: 200 });
    }

    const data: { message?: { content?: string }; choices?: { message?: { content?: string } }[] } = await response.json();
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
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.error("[ai/format] Request timed out after", TIMEOUT_MS, "ms");
      return NextResponse.json(
        { error: "AI took too long. Try formatting a shorter section, or try again." },
        { status: 200 }
      );
    }
    console.error("[ai/format] Error:", err);
    return NextResponse.json(
      { error: "Failed to format content. Try again in a moment." },
      { status: 200 }
    );
  }
}