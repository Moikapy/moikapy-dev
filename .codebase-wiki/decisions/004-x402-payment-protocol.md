# ADR-004: x402 Payment Protocol for API Monetization

> **Status**: Accepted
> **Date**: 2026-04-13

## Context

External consumers should be able to pay per request to access blog content and knowledge base via API. Internal admin access should remain free and cookie-authenticated.

## Decision

Use the x402 (HTTP 402 Payment Required) protocol with USDC on Base (chainId 8453).

- `@x402/core`, `@x402/evm`, `@x402/next` handle payment verification and facilitation
- Unpaid requests receive a 402 response with payment instructions
- Paid requests are verified on-chain and served normally
- Admin routes (`/admin/*`, write operations on `/api/posts`) use cookie-based auth instead
- The `/api` root endpoint documents all available endpoints and pricing

## Alternatives Considered

- **Stripe**: Requires account setup, not crypto-native, adds latency
- **API key subscription**: More complex to manage, less crypto-native
- **Free for all**: No monetization path for external consumers

## See Also

- [[x402-monetization]]
- [[blog-api]]