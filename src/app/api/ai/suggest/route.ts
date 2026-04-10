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

interface SuggestRequest {
  content: string;
  title?: string;
}

export async function POST(request: NextRequest) {
  const apiKey = getOllamaApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Ollama API key not configured" }, { status: 500 });
  }

  let body: SuggestRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.content || body.content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const contentPreview = body.content.slice(0, 3000);

  const existingTitle = body.title?.trim() || "";

  const systemPrompt = `You are a blog post assistant. Given blog post content, suggest a concise title, a URL-friendly slug, and a short excerpt. Always respond with valid JSON only — no markdown, no explanation.

Rules:
- title: catchy, under 80 characters, relevant to the content
- slug: lowercase, hyphenated, URL-safe, under 60 characters, no numbers unless meaningful
- excerpt: 1-2 sentences summarizing the post, under 200 characters${existingTitle ? `\n- The user already has a title: "${existingTitle}". You may improve it or keep it.` : ""}

Respond with exactly this JSON shape:
{"title": "...", "slug": "...", "excerpt": "..."}`;

  const userPrompt = existingTitle
    ? `Title so far: "${existingTitle}"\n\nContent:\n${contentPreview}`
    : `Content:\n${contentPreview}`;

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
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ollama API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Ollama API returned ${response.status}` },
        { status: 502 }
      );
    }

    const data: { message?: { content?: string }; choices?: { message?: { content?: string } }[] } = await response.json();
    const rawContent = data.message?.content ?? data.choices?.[0]?.message?.content ?? "";

    // Extract JSON from the response (handle markdown-wrapped JSON)
    let jsonStr = rawContent;
    const codeBlockMatch = rawContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }

    const suggestion = JSON.parse(jsonStr.trim());

    if (!suggestion.title || !suggestion.slug || !suggestion.excerpt) {
      return NextResponse.json({ error: "Malformed suggestion from AI" }, { status: 502 });
    }

    return NextResponse.json({
      title: suggestion.title,
      slug: suggestion.slug,
      excerpt: suggestion.excerpt,
    });
  } catch (err: any) {
    console.error("AI suggest error:", err);
    return NextResponse.json(
      { error: "Failed to get AI suggestion" },
      { status: 500 }
    );
  }
}