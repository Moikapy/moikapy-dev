# moikapy.dev — Agent & API Guide

> Knowledge base for AI engineering, gaming, 3D printing, and building cool stuff.
> Maintained by **moikapy** — AI engineer, gamer, builder.

## Overview

This site exposes a **paid API** using the **x402 payment protocol** (HTTP 402). Agents can programmatically discover, query, and pay for access to structured blog content — no API keys, no accounts, no OAuth. Just USDC on Base.

## Quick Start

### 1. Free: Read the docs

```
GET https://moikapy.dev/api
```

Returns full API documentation, pricing, and payment instructions as JSON.

### 2. Free: Browse the blog (HTML)

The blog is free to read in a browser:

- `https://moikapy.dev/blog` — post listing
- `https://moikapy.dev/blog/{slug}` — individual posts
- `https://moikapy.dev/feed/rss.xml` — RSS feed
- `https://moikapy.dev` — homepage

### 3. Paid: Query the API (x402)

External API access requires payment per request. The protocol is x402:

1. Make a `GET` request to a paid endpoint
2. Receive a `402 Payment Required` response with `PAYMENT-REQUIRED` header
3. Construct a USDC payment on Base (chain ID 8453)
4. Retry the request with the `PAYMENT-SIGNATURE` header
5. Receive the response data + `PAYMENT-RESPONSE` settlement confirmation

## Endpoints

### `GET /api/knowledge?q={query}&tag={tag}&limit={n}`

**Price:** $0.02 per request

Search the knowledge base by keywords or tags. Returns relevance-scored results.

**Parameters:**
- `q` — Search query (space-separated terms, e.g. `RAG pipeline fine-tuning`)
- `tag` — Filter by tag name (e.g. `ai-engineering`, `gaming`)
- `limit` — Max results (default: 10, max: 50)

**Example request (without payment):**
```bash
curl -s "https://moikapy.dev/api/knowledge?q=RAG+pipeline&limit=5"
```

**Example response (402):**
```json
{
  "x402Version": 2,
  "error": "Payment Required",
  "resource": {
    "url": "https://moikapy.dev/api/knowledge?q=RAG+pipeline&limit=5",
    "method": "GET",
    "mimeType": "application/json"
  },
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:8453",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "amount": "20000",
    "payTo": "<wallet_address>",
    "maxTimeoutSeconds": 60,
    "extra": { "name": "USDC", "version": "2" }
  }]
}
```

**Example response (after payment):**
```json
{
  "query": "rag pipeline",
  "results": [
    {
      "slug": "building-rag-pipelines",
      "title": "Building RAG Pipelines That Actually Work",
      "excerpt": "A practical guide to RAG architecture...",
      "coverImage": "https://moikapy.dev/images/rag-cover.jpg",
      "tags": ["ai-engineering", "rag", "llm"],
      "readingTime": "8 min read",
      "publishedAt": "2026-04-10T00:00:00.000Z",
      "url": "https://moikapy.dev/blog/building-rag-pipelines",
      "relevanceScore": 22
    }
  ],
  "total": 1
}
```

### `GET /api/posts`

**Price:** $0.01 per request (external), free (internal/from own site)

List all published blog posts with metadata. External consumers get metadata only (no full content).

**Parameters:**
- `all=1` — Include drafts (requires admin auth)

**Response fields:** `slug`, `title`, `excerpt`, `coverImage`, `tags`, `published`, `createdAt`, `updatedAt`, `readingTime`, `url`

### `GET /api/posts/{slug}`

**Price:** Free (internal) / $0.01 (external)

Get a single post by slug. Full content for internal requests, metadata + excerpt for external.

### `GET /api`

**Price:** Free

Returns this documentation as JSON, including pricing, network details, and SDK references.

## Payment Details

| Field | Value |
|-------|-------|
| Protocol | x402 (HTTP 402) |
| Network | Base (Ethereum L2) |
| Chain ID | 8453 |
| Token | USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) |
| Settlement | Coinbase-hosted facilitator |
| Free tier | None (internal requests from moikapy.dev are free) |

### SDK Integration

**TypeScript:**
```typescript
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { ExactEvmScheme } from "@x402/evm/exact/client";

const client = new x402HTTPClient(
  new x402Client().register("eip155:8453", new ExactEvmScheme(signer))
);

// Make a paid request
const res = await fetch("https://moikapy.dev/api/knowledge?q=AI+agents");
if (res.status === 402) {
  const req = client.getPaymentRequiredResponse(h => res.headers.get(h), await res.json());
  const payload = await client.createPaymentPayload(req);
  const paid = await fetch("https://moikapy.dev/api/knowledge?q=AI+agents", {
    headers: client.encodePaymentSignatureHeader(payload),
  });
  const data = await paid.json();
}
```

**Python:**
```python
# pip install x402-python
from x402 import X402Client

client = X402Client(signer=my_signer)
data = client.get("https://moikapy.dev/api/knowledge?q=RAG+pipeline")
```

**cURL (manual):**
```bash
# 1. Get payment requirements
curl -i "https://moikapy.dev/api/knowledge?q=AI"

# 2. Parse PAYMENT-REQUIRED header, construct USDC payment on Base

# 3. Retry with payment signature
curl -H "PAYMENT-SIGNATURE: <base64-encoded-payload>" \
  "https://moikapy.dev/api/knowledge?q=AI"
```

## Content Topics

The knowledge base covers:

- **AI Engineering** — LLMs, agents, RAG pipelines, fine-tuning, prompt engineering
- **Gaming** — Game dev, modding, livestreaming, reviews
- **3D Printing** — Bambu Labs, PETG/PLA, CAD modeling, Blender
- **Open Source** — Project writeups, npm packages, community contributions
- **Solo Entrepreneurship** — Building products, Shopify, POD, automation

## Tags

Common tags used in posts: `ai-engineering`, `rag`, `llm`, `agents`, `gaming`, `3d-printing`, `blender`, `open-source`, `meta`

## Rate Limits

No explicit rate limits. Abuse will result in IP-level blocking. Be reasonable — cache responses when possible.

## Bazaar

This API is listed on the [x402 Bazaar](https://bazaar.x402.org) for agent discovery.

## Token

**$KAPY** is the official token of moikapy.dev — support the builder, fuel the Lair.

| Field | Value |
|-------|-------|
| Symbol | KAPY |
| Contract | `0xb09220649657DC919d643060DcA998511B4cb1CA` |
| Network | Base (chain 8453) |
| Buy/Trade | [Flaunch](https://flaunch.gg/base/coins/0xb09220649657DC919d643060DcA998511B4cb1CA) |
| Chart | [DexScreener](https://dexscreener.com/base/0xb09220649657DC919d643060DcA998511B4cb1CA) |

## Contact

- Blog: https://moikapy.dev
- GitHub: https://github.com/moikapy
- X/Twitter: https://x.com/moikapy
- Hugging Face: https://huggingface.co/moikapy

---

*Built with x402. Monetize your knowledge — no middlemen required.* 🐉