# x402-monetization

> HTTP 402 payment-required protocol for API monetization. External consumers pay per request (USDC on Base) to access `/api/posts` and `/api/knowledge`. Uses `@x402/core`, `@x402/evm`, `@x402/next` for on-chain payment verification. Admin requests bypass payment via cookie auth.

## Source File
- `src/app/api/route.ts` — Self-describing API documentation endpoint with pricing and payment protocol details

## Pricing
| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /api/posts` | $0.01 | List published posts |
| `GET /api/posts/{slug}` | Free (internal) / $0.01 (external) | Single post |
| `GET /api/knowledge` | $0.02 | Search knowledge base |

## Token & Payment
- **Token**: KAPY on Base (`0xb09220649657DC919d643060DcA998511B4cb1CA`)
- **Payment**: USDC on Base via EIP-3009 or Permit2
- **SDK**: `@x402/core` + `@x402/evm` for TypeScript

## Related Decisions
- ADR-004: x402 Payment Protocol (see `decisions/` dir)

## Cross-References
- [[blog-api]] — The endpoints being monetized
- [[admin-panel]] — Admin auth that bypasses payment