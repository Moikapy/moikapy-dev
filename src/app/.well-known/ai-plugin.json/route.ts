import { NextResponse } from "next/server";

/**
 * AI plugin manifest for agent discovery.
 * Claude, ChatGPT, and other AI platforms look for this at /.well-known/ai-plugin.json
 * @see https://platform.openai.com/docs/plugins/production
 */
export async function GET() {
  return NextResponse.json({
    schema_version: "v1",
    name_for_human: "moikapy.dev Knowledge Base",
    name_for_model: "moikapy",
    description_for_human: "Search moikapy's blog about AI engineering, gaming, and 3D printing. Paid access via x402 protocol.",
    description_for_model: "Search moikapy's knowledge base for AI engineering, gaming, and 3D printing content. External requests require x402 payment (USDC on Base). Internal requests are free. Use the /api/knowledge endpoint with ?q= query parameter for search, or /api/posts for listing.",
    auth: {
      type: "none",
    },
    api: {
      type: "openapi",
      has_user_authentication: false,
      url: "https://moikapy.dev/api",
    },
    contact_email: "moikapy@proton.me",
    legal_info_url: "https://moikapy.dev",
    logos: {
      default: "https://moikapy.dev/icon-512.webp",
    },
  });
}