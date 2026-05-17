# moikapy.dev — Agent & API Guide

> Knowledge base for AI engineering, gaming, 3D printing, and building cool stuff.
> Maintained by **moikapy** — AI engineer, gamer, builder.

## Overview

This site exposes a **paid API** using the **x402 payment protocol v2** (HTTP 402). Agents can programmatically discover, query, and pay for access to structured blog content — no API keys, no accounts, no OAuth. Just USDC on Base.

## Agent Discovery

Agents can discover this API through multiple well-known paths:

| Path | Purpose | Format |
|------|---------|--------|
| `/llms.txt` | Discovery index for AI crawlers | Text |
| `/SKILL.md` | Full integration guide (this file) | Markdown |
| `/feed/llms-full.txt` | All published content as plain text | Text |
| `/.well-known/ai-plugin.json` | Plugin manifest for ChatGPT/Claude | JSON |
| `/api` | Self-describing API with full pricing | JSON |

## Quick Start

### 1. Free: Read the docs

```
GET https://moikapy.dev/api
```

Returns full API documentation, pricing, and Bazaar resource schema as JSON.

### 2. Free: Browse the blog (HTML)

The blog is free to read in a browser:

- `https://moikapy.dev/blog` — post listing
- `https://moikapy.dev/blog/{slug}` — individual posts
- `https://moikapy.dev/feed/rss.xml` — RSS feed
- `https://moikapy.dev` — homepage

### 3. Free: Get all content as text (for AI training/RAG)

```
GET https://moikapy.dev/feed/llms-full.txt
```

Returns all published posts as plain text with metadata. Cache-friendly (`s-maxage=300`).

### 4. Paid: Query the API (x402)

External API access requires payment per request. The protocol is x402 v2:

1. Make a `GET` request to a paid endpoint
2. Receive a `402 Payment Required` response with `PAYMENT-REQUIRED` header
3. Construct a USDC payment on Base (chain ID 8453)
4. Retry the request with the `PAYMENT-SIGNATURE` header
5. Receive the response data + `PAYMENT-RESPONSE` and `EXTENSION-RESPONSES` headers

## Endpoints

### `GET /api/knowledge?q={query}&tag={tag}&limit={n}`

**Price:** $0.02 per request

Search the knowledge base by keywords or tags. Returns relevance-scored results.

**Parameters:**
- `q` — Search query (space-separated terms, max 200 chars, max 10 terms)
- `tag` — Filter by tag name (max 100 chars)
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
  }],
  "extensions": [{
    "bazaar": {
      "discoverable": true,
      "metadata": {
        "name": "Search moikapy's knowledge base — AI engineering, gaming, 3D printing",
        "description": "Search moikapy's knowledge base — AI engineering, gaming, 3D printing",
        "tags": ["ai-engineering", "gaming", "3d-printing", "knowledge-base"]
      }
    }
  }]
}
```

**Example response (after payment):**

The `EXTENSION-RESPONSES` header will contain a base64-encoded JSON confirming Bazaar cataloging:
```
EXTENSION-RESPONSES: eyJiYXphYXIiOnsic3RhdHVzIjoic3VjY2VzcyJ9fQ==
```

Decoded: `{"bazaar":{"status":"success"}}`

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

Returns self-describing API documentation as JSON, including Bazaar resource schema, pricing, network details, and SDK references. Includes `x402Version: 2`, `resources` array with `accepts` payment requirements, and `bazaar` discovery URL.

## Bazaar Discovery

This API is discoverable through two x402 marketplaces:

1. **[x402 Bazaar](https://x402bazaar.org)** (live now) — 112+ APIs, CLI (`npm i -g x402-bazaar`), MCP server for Claude/Cursor. Multi-chain (Base + SKALE + Polygon), 95/5 revenue split. List your API at https://x402bazaar.org/services.

2. **Coinbase Bazaar** (`bazaar.x402.org`, early access) — The official x402 discovery layer from Coinbase. Auto-catalogs services from 402 responses with `extensions.bazaar`. Currently in early development.

- `discoverable: true` — signals that this service wants to be listed
- `metadata.name` — human-readable service name
- `metadata.description` — what the service does
- `metadata.tags` — categories for search and filtering

Agents can discover this API by querying the Bazaar:
```typescript
import { HTTPFacilitatorClient } from "@x402/core/http";
import { withBazaar } from "@x402/extensions";

const client = withBazaar(new HTTPFacilitatorClient({ url: "https://x402.org/facilitator" }));
const services = await client.extensions.discovery.listResources({ type: "http" });
```

## Payment Details

| Field | Value |
|-------|-------|
| Protocol | x402 v2 (HTTP 402 Payment Required) |
| Network | Base (Ethereum L2) |
| Chain ID | 8453 |
| Network ID | eip155:8453 |
| Token | USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) |
| Settlement | Coinbase-hosted facilitator |
| Facilitator | https://facilitator.x402.org |
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

60 requests/minute for analytics tracking, 30/minute for reactions. No explicit rate limit on paid endpoints (payment is the gate). Cache responses when possible.

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

*Built with x402 v2. Monetize your knowledge — no middlemen required.* 🐉