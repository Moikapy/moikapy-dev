import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    name: "moikapy.dev API",
    description: "Paid API access to moikapy's knowledge base — AI engineering, gaming, and 3D printing content",
    baseUrl: "https://moikapy.dev",
    paymentProtocol: "x402",
    network: {
      name: "Base",
      chainId: 8453,
      networkId: "eip155:8453",
      token: "USDC",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
    token: {
      name: "KAPY",
      symbol: "KAPY",
      address: "0xb09220649657DC919d643060DcA998511B4cb1CA",
      network: "Base",
      url: "https://flaunch.gg/base/coins/0xb09220649657DC919d643060DcA998511B4cb1CA",
      dexScreener: "https://dexscreener.com/base/0xb09220649657DC919d643060DcA998511B4cb1CA",
    },
    endpoints: {
      "/api/posts": {
        method: "GET",
        price: "$0.01",
        description: "List all published blog posts with metadata (no full content for external consumers)",
        params: {
          all: "Set to '1' to include drafts (requires admin auth)",
        },
        response: "Array of post objects with slug, title, excerpt, tags, dates",
      },
      "/api/posts/{slug}": {
        method: "GET",
        price: "Free (internal) / $0.01 (external)",
        description: "Get a single post by slug",
      },
      "/api/knowledge": {
        method: "GET",
        price: "$0.02",
        description: "Search moikapy's knowledge base by keywords or tags",
        params: {
          q: "Search query (space-separated terms)",
          tag: "Filter by tag name",
          limit: "Max results (default: 10, max: 50)",
        },
        response: "Object with query, results array (scored by relevance), and total count",
        example: "/api/knowledge?q=RAG+pipeline&limit=5",
      },
      "/api": {
        method: "GET",
        price: "Free",
        description: "This documentation endpoint",
      },
    },
    howToPay: {
      protocol: "x402 (HTTP 402 Payment Required)",
      flow: [
        "1. Make a request to any paid endpoint",
        "2. Receive a 402 response with PAYMENT-REQUIRED header",
        "3. Construct payment payload (USDC on Base via EIP-3009 or Permit2)",
        "4. Retry request with PAYMENT-SIGNATURE header",
        "5. Receive the requested data + PAYMENT-RESPONSE settlement confirmation",
      ],
      sdk: {
        typescript: "@x402/core + @x402/evm",
        python: "x402-python",
        go: "x402-go",
      },
      docs: "https://docs.cdp.coinbase.com/x402/quickstart-for-buyers",
    },
    documentation: {
      skillMd: "https://moikapy.dev/SKILL.md",
      llmsTxt: "https://moikapy.dev/llms.txt",
    },
    discoverable: true,
    bazaar: "https://bazaar.x402.org",
  });
}