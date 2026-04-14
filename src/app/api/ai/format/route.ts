import { NextRequest, NextResponse } from "next/server";

const OLLAMA_API_URL = "https://ollama.com/api/chat";

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

  const content = body.content.slice(0, 8000);

  const systemPrompt = `You are a blog post formatting assistant. The user dictated a blog post using voice-to-text, which produced raw run-on text without proper formatting. Your job is to reformat it into clean, readable Markdown.

Rules:
- Split text into proper paragraphs (group related sentences, break at topic shifts)
- Add headings (## or ###) where topics change significantly
- Add bullet lists for enumerated items
- Fix obvious dictation artifacts: remove filler words ("um", "uh", "like"), fix homophones ("there" vs "their"), clean up run-on sentences
- Fix punctuation: add periods, commas, capitalization
- Do NOT change the meaning, tone, or substance of the content
- Do NOT add new information or remove significant content
- Preserve any existing Markdown formatting the user already applied
- Return ONLY the reformatted Markdown content — no explanation, no wrapping`;

  try {
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
          { role: "user", content: `Here is the voice-dictated text to format:\n\n${content}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ai/format] Ollama error:", response.status, errorText);
      return NextResponse.json(
        { error: `AI returned ${response.status}` },
        { status: 502 }
      );
    }

    const data: { message?: { content?: string }; choices?: { message?: { content?: string } }[] } = await response.json();
    let formatted = data.message?.content ?? data.choices?.[0]?.message?.content ?? "";

    // Strip markdown code block wrapping if present
    const codeBlockMatch = formatted.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/);
    if (codeBlockMatch) {
      formatted = codeBlockMatch[1];
    }

    if (!formatted.trim()) {
      return NextResponse.json({ error: "AI returned empty content" }, { status: 502 });
    }

    return NextResponse.json({ content: formatted.trim() });
  } catch (err) {
    console.error("[ai/format] Error:", err);
    return NextResponse.json(
      { error: "Failed to format content" },
      { status: 500 }
    );
  }
}