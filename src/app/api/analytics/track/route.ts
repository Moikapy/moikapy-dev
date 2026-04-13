import { NextRequest, NextResponse } from "next/server";
import { pageViews } from "@/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { path?: string };
    const path: string | undefined = body.path;

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    // Normalize: strip query params, trailing slash, limit length
    const cleanPath = path.split("?")[0].replace(/\/+$/, "") || "/";
    if (cleanPath.length > 500) {
      return NextResponse.json({ ok: true });
    }

    // Skip tracking for admin, API, and static assets
    if (
      cleanPath.startsWith("/admin") ||
      cleanPath.startsWith("/api/") ||
      cleanPath.startsWith("/_next/") ||
      cleanPath.startsWith("/favicon") ||
      cleanPath.endsWith(".ico") ||
      cleanPath.endsWith(".png") ||
      cleanPath.endsWith(".jpg") ||
      cleanPath.endsWith(".svg") ||
      cleanPath.endsWith(".webmanifest") ||
      cleanPath.endsWith(".xml") ||
      cleanPath.endsWith(".css") ||
      cleanPath.endsWith(".js")
    ) {
      return NextResponse.json({ ok: true });
    }

    const today = new Date().toISOString().split("T")[0];

    const { env } = getCloudflareContext();
    const db = env.DB;
    if (!db) {
      return NextResponse.json({ ok: true });
    }

    // Atomic upsert using raw SQL for D1 compatibility
    await db.prepare(
      `INSERT INTO page_views (path, date, views) VALUES (?, ?, 1)
       ON CONFLICT(path, date) DO UPDATE SET views = views + 1`
    )
      .bind(cleanPath, today)
      .run();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[analytics/track] Error:", err);
    // Return success anyway — don't block page loads
    return NextResponse.json({ ok: true });
  }
}