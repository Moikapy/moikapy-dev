/**
 * Simple server-side analytics for tracking key events.
 * Uses Cloudflare Workers Analytics (via console.log + CF analytics)
 * and logs to D1 for querying.
 */

import { getDb } from "@/lib/posts";

// Event types we track
export type AnalyticsEvent =
  | "page_view"
  | "api_request"
  | "api_402_payment_required"
  | "api_402_payment_success"
  | "api_402_payment_failed"
  | "reaction_added"
  | "reaction_removed";

interface AnalyticsPayload {
  event: AnalyticsEvent;
  path: string;
  metadata?: Record<string, string>;
}

/**
 * Log an analytics event.
 * Currently just logs to console (CF Workers logs).
 * Can be extended to write to D1 or an external service.
 */
export function logEvent(event: AnalyticsPayload): void {
  // Log to Cloudflare Workers logs (viewable in dashboard)
  console.log(`[analytics] ${event.event}`, JSON.stringify({
    path: event.path,
    ...event.metadata,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Log a 402 payment required event.
 */
export function logPaymentRequired(path: string, price: string, userAgent?: string): void {
  logEvent({
    event: "api_402_payment_required",
    path,
    metadata: {
      price,
      ...(userAgent ? { userAgent } : {}),
    },
  });
}

/**
 * Log a successful payment.
 */
export function logPaymentSuccess(path: string, price: string): void {
  logEvent({
    event: "api_402_payment_success",
    path,
    metadata: { price },
  });
}