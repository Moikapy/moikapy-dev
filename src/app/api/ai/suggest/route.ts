import { NextRequest, NextResponse } from "next/server";
import { callOrigen } from "@moikapy/origen";
import { blogConfig } from "@/lib/origen";

export const dynamic = "force-dynamic";

interface SuggestRequest {
  content: string;
  title?: string;
}

export async function POST(request: NextRequest) {
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
    const response = await callOrigen(
      [{ role: "user", content: userPrompt }],
      undefined,
      blogConfig(systemPrompt),
    );

    const rawContent = response.message;

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("AI suggest error:", message);
    return NextResponse.json({ error: "Failed to get AI suggestion", detail: message }, { status: 500 });
  }
}