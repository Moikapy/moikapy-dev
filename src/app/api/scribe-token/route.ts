import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

function getElevenLabsApiKey(): string | undefined {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    return ctx.env?.ELEVENLABS_API_KEY as string | undefined;
  } catch {
    return process.env.ELEVENLABS_API_KEY;
  }
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Only authenticated admins can generate tokens
  const authed = await isAuthenticated(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Generate a single-use token for the Scribe real-time STT WebSocket
    // The SDK calls: POST /v1/single-use-token/realtime_scribe
    const response = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs token error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate scribe token" },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { token?: string };
    if (!data.token) {
      return NextResponse.json(
        { error: "No token returned from ElevenLabs" },
        { status: 502 }
      );
    }
    return NextResponse.json({ token: data.token });
  } catch (err) {
    console.error("Scribe token error:", err);
    return NextResponse.json(
      { error: "Failed to generate scribe token" },
      { status: 500 }
    );
  }
}