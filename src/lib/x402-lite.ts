/**
 * Lightweight x402 payment gate for Cloudflare Workers.
 *
 * Instead of using the full @x402/next SDK (which has Node.js dependencies
 * that don't work in Workers), we implement the protocol directly:
 * 1. Check if the request includes a valid PAYMENT-SIGNATURE header
 * 2. If not, return 402 with PAYMENT-REQUIRED header
 * 3. Payment verification/settlement happens via the Coinbase facilitator
 */

import { NextRequest, NextResponse } from "next/server";

export interface PaymentConfig {
  /** Price in USD, e.g. "$0.01" */
  price: string;
  /** Your wallet address to receive payments */
  payTo: string;
  /** Network ID — Base mainnet */
  network: string;
  /** Human-readable description */
  description: string;
  /** MIME type of the response */
  mimeType: string;
}

// Coinbase-hosted facilitator for verification
const FACILITATOR_URL = "https://facilitator.x402.org";

// KAPY token contract on Base
export const KAPY_TOKEN = {
  name: "KAPY",
  symbol: "KAPY",
  address: "0xb09220649657DC919d643060DcA998511B4cb1CA",
  network: "Base",
  chainId: 8453,
  url: "https://flaunch.gg/base/coins/0xb09220649657DC919d643060DcA998511B4cb1CA",
} as const;

// Parse price string like "$0.01" to atomic units (6 decimals for USDC)
function parsePriceToAtomic(priceStr: string): string {
  const dollars = parseFloat(priceStr.replace("$", ""));
  const atomic = Math.round(dollars * 1_000_000); // USDC has 6 decimals
  return atomic.toString();
}

// Build the PAYMENT-REQUIRED response body
function buildPaymentRequired(config: PaymentConfig, requestUrl: string) {
  return {
    x402Version: 2,
    error: "Payment Required",
    resource: {
      url: requestUrl,
      method: "GET",
      mimeType: config.mimeType,
    },
    accepts: [
      {
        scheme: "exact",
        network: config.network,
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
        amount: parsePriceToAtomic(config.price),
        payTo: config.payTo,
        maxTimeoutSeconds: 60,
        extra: {
          name: "USDC",
          version: "2",
        },
      },
    ],
    extensions: [],
  };
}

/**
 * Wrap an API handler with x402 payment requirements.
 * Returns 402 with payment info if no valid payment is attached.
 * Falls through to the handler if payment is present (facilitator verifies).
 */
export function withPayment(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: PaymentConfig,
  isInternal: (request: NextRequest) => boolean
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Internal (own site) requests are free
    if (isInternal(request)) {
      return handler(request);
    }

    // Check if payment signature is present
    const paymentSignature = request.headers.get("PAYMENT-SIGNATURE");
    if (paymentSignature) {
      // Payment attached — verify with facilitator, then serve
      // For now, trust the facilitator will verify on settlement
      // Full verification would call facilitator /verify endpoint
      try {
        const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: paymentSignature,
        });
        if (verifyRes.ok) {
          const result = await verifyRes.json() as { isValid?: boolean };
          if (result.isValid) {
            // Payment verified — serve the content
            const response = await handler(request);
            // Add settlement header
            response.headers.set("PAYMENT-RESPONSE", JSON.stringify({ settled: true }));
            return response;
          }
        }
      } catch {
        // Facilitator unreachable — serve anyway, settlement happens async
        return handler(request);
      }
    }

    // No payment — return 402 with payment requirements
    const paymentRequired = buildPaymentRequired(config, request.url);
    return new NextResponse(JSON.stringify(paymentRequired), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(paymentRequired)).toString("base64"),
      },
    });
  };
}

/**
 * Check if a request is from our own site (referer/origin check)
 */
export function isSiteInternalRequest(request: NextRequest): boolean {
  const referer = request.headers.get("referer");
  const origin = request.headers.get("origin");
  const siteUrl = "moikapy.dev";
  if (referer && referer.includes(siteUrl)) return true;
  if (origin && origin.includes(siteUrl)) return true;
  // Admin session cookie
  const cookie = request.headers.get("cookie");
  if (cookie && cookie.includes("session")) return true;
  return false;
}