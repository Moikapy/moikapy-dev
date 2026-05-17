import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

function getPayToAddress(): string {
  try {
    const ctx = getCloudflareContext();
    const addr = ctx.env?.WALLET_ADDRESS;
    if (typeof addr === "string" && addr.startsWith("0x")) return addr;
  } catch {
    // not in CF context
  }
  const envAddr = process.env.WALLET_ADDRESS;
  if (envAddr && envAddr.startsWith("0x")) return envAddr;
  return "0x0000000000000000000000000000000000000000";
}

export async function GET() {
  const payTo = getPayToAddress();

  return NextResponse.json({
    // ── x402 v2 protocol identifier ──
    x402Version: 2,

    // ── Service metadata ──
    name: "moikapy.dev API",
    description: "Paid API access to moikapy's knowledge base — AI engineering, gaming, and 3D printing content",
    baseUrl: "https://moikapy.dev",
    discoverable: true,

    // ── Payment configuration (Bazaar resource schema) ──
    paymentProtocol: "x402",
    network: {
      name: "Base",
      chainId: 8453,
      networkId: "eip155:8453",
      token: "USDC",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },

    // ── Callable endpoints (Bazaar-compatible accepts format) ──
    resources: [
      {
        resource: "https://moikapy.dev/api/knowledge",
        type: "http",
        method: "GET",
        description: "Search moikapy's knowledge base by keywords or tags",
        accepts: [
          {
            scheme: "exact",
            network: "eip155:8453",
            asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            amount: "20000",
            payTo: payTo,
            maxTimeoutSeconds: 60,
            extra: { name: "USDC", version: "2" },
          },
        ],
        outputSchema: {
          input: { method: "GET", type: "http" },
          output: { type: "application/json" },
        },
        params: {
          q: "Search query (space-separated terms)",
          tag: "Filter by tag name",
          limit: "Max results (default: 10, max: 50)",
        },
        example: "/api/knowledge?q=RAG+pipeline&limit=5",
      },
      {
        resource: "https://moikapy.dev/api/posts",
        type: "http",
        method: "GET",
        description: "List all published blog posts with metadata (no full content for external consumers)",
        accepts: [
          {
            scheme: "exact",
            network: "eip155:8453",
            asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            amount: "10000",
            payTo: payTo,
            maxTimeoutSeconds: 60,
            extra: { name: "USDC", version: "2" },
          },
        ],
        outputSchema: {
          input: { method: "GET", type: "http" },
          output: { type: "application/json" },
        },
        params: {
          all: "Set to '1' to include drafts (requires admin auth)",
        },
      },
      {
        resource: "https://moikapy.dev/api",
        type: "http",
        method: "GET",
        description: "This documentation endpoint — free, no payment required",
        accepts: [],
        outputSchema: {
          input: { method: "GET", type: "http" },
          output: { type: "application/json" },
        },
      },
    ],

    // ── Bazaar discovery ──
    bazaar: "https://x402bazaar.org",
    facilitator: "https://facilitator.x402.org",

    // ── Payment flow ──
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

    // ── AI agent discovery ──
    documentation: {
      skillMd: "https://moikapy.dev/SKILL.md",
      llmsTxt: "https://moikapy.dev/llms.txt",
      llmsFullTxt: "https://moikapy.dev/feed/llms-full.txt",
      openApiSpec: null,
    },

    // ── $KAPY token ──
    token: {
      name: "KAPY",
      symbol: "KAPY",
      address: "0xb09220649657DC919d643060DcA998511B4cb1CA",
      network: "Base",
      chainId: 8453,
      url: "https://flaunch.gg/base/coins/0xb09220649657DC919d643060DcA998511B4cb1CA",
      dexScreener: "https://dexscreener.com/base/0xb09220649657DC919d643060DcA998511B4cb1CA",
    },
  });
}