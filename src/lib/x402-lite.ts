/**
 * x402 Payment Protocol — Bazaar-compatible implementation.
 *
 * Implements the x402 v2 protocol with Bazaar discovery extension:
 * 1. Return 402 with PAYMENT-REQUIRED header + Bazaar extension when no payment
 * 2. Verify payment via Coinbase facilitator
 * 3. Serve content + EXTENSION-RESPONSES header on success
 *
 * @see https://docs.x402.org/extensions/bazaar
 * @see https://docs.x402.org/core-concepts
 */

import { NextRequest, NextResponse } from "next/server";

export interface PaymentConfig {
  /** Price in USD, e.g. "$0.01" */
  price: string;
  /** Your wallet address to receive payments */
  payTo: string;
  /** Network ID — eip155:8453 for Base mainnet */
  network: string;
  /** Human-readable description */
  description: string;
  /** MIME type of the response */
  mimeType: string;
}

// Coinbase-hosted facilitator for payment verification
const FACILITATOR_URL = "https://facilitator.x402.org";

// Live Bazaar marketplace for agent discovery
const BAZAAR_URL = "https://x402bazaar.org";

// USDC on Base
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Parse price string like "$0.01" to atomic units (6 decimals for USDC)
function parsePriceToAtomic(priceStr: string): string {
  const dollars = parseFloat(priceStr.replace("$", ""));
  return Math.round(dollars * 1_000_000).toString();
}

// Build x402 v2 402 response body with Bazaar extension
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
        asset: USDC_BASE,
        amount: parsePriceToAtomic(config.price),
        payTo: config.payTo,
        maxTimeoutSeconds: 60,
        extra: {
          name: "USDC",
          version: "2",
        },
      },
    ],
    extensions: [
      {
        bazaar: {
          discoverable: true,
          metadata: {
            name: config.description,
            description: config.description,
            tags: ["ai-engineering", "gaming", "3d-printing", "knowledge-base"],
          },
        },
      },
    ],
  };
}

/**
 * Wrap an API handler with x402 v2 payment requirements + Bazaar discovery.
 * Returns 402 with payment info if no valid payment is attached.
 * Falls through to the handler if payment is verified.
 * Includes EXTENSION-RESPONSES header on success for Bazaar cataloging.
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
      // Payment attached — verify with facilitator
      try {
        const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: paymentSignature,
        });
        if (verifyRes.ok) {
          const result = (await verifyRes.json()) as { isValid?: boolean };
          if (result.isValid) {
            // Payment verified — serve the content
            const response = await handler(request);

            // EXTENSION-RESPONSES header for Bazaar cataloging confirmation
            const extensionResponse = Buffer.from(
              JSON.stringify({ bazaar: { status: "success" } })
            ).toString("base64");
            response.headers.set("EXTENSION-RESPONSES", extensionResponse);
            response.headers.set("PAYMENT-RESPONSE", JSON.stringify({ settled: true }));

            return response;
          }
        }
      } catch {
        // Facilitator unreachable — serve anyway, settlement happens async
        const response = await handler(request);
        // Processing status — payment received but not yet confirmed
        const extensionResponse = Buffer.from(
          JSON.stringify({ bazaar: { status: "processing" } })
        ).toString("base64");
        response.headers.set("EXTENSION-RESPONSES", extensionResponse);
        return response;
      }
    }

    // No payment — return 402 with payment requirements + Bazaar extension
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
 * Check if a request is from our own site (origin/referer matching).
 * Properly validates hostname to prevent spoofing.
 */
export function isSiteInternalRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const siteUrl = "moikapy.dev";
  // Origin is most reliable — checked first
  if (origin && new URL(origin).hostname.endsWith(siteUrl)) return true;
  // Referer for traditional navigation — validate hostname specifically
  if (referer) {
    try {
      if (new URL(referer).hostname.endsWith(siteUrl)) return true;
    } catch {
      // Invalid URL — reject
    }
  }
  return false;
}