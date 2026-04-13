# x402-monetization

> **Summary**: HTTP 402 payment-required protocol for API monetization. External consumers pay per request (USDC on Base) to access `/api/posts` and `/api/knowledge` endpoints. Uses `@x402/core`, `@x402/evm`, and `@x402/next` packages for on-chain payment verification. Admin/authenticated requests bypass payment — internal access is free via cookie auth.

## Location
- **File**: `src/app/api/route.ts` — API documentation endpoint listing all paid endpoints, pricing, and payment protocol details

## Key Details
- **Token**: KAPY on Base (`0xb09220649657DC919d643060DcA998511B4cb1CA`)
- **Payment**: USDC on Base via EIP-3009 or Permit2
- **SDK**: `@x402/core` + `@x402/evm` for TypeScript, `x402-python` for Python
- **Pricing**: `/api/posts` $0.01, `/api/posts/{slug}` free (internal) / $0.01 (external), `/api/knowledge` $0.02
- **Documentation**: Self-describing at `GET /api` with endpoint metadata, pricing, and payment flow

## See Also
- [[blog-api]] — The endpoints being monetized
- [[admin-panel]] — Admin auth that bypasses payment
- [[004-x402-payment-protocol]] — ADR for choosing x402

## Evolution
- **2026-04-13** — Initial enrichment from source analysis

---
*Last updated: 2026-04-13*