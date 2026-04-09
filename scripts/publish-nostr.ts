/**
 * Nostr Publishing Script
 *
 * This script signs and publishes blog posts as NIP-23 long-form content
 * events (kind 30023) to Nostr relays.
 *
 * Usage:
 *   NSEC=nsec1... bun run scripts/publish-nostr.ts
 *
 * First, generate a key pair:
 *   bun run scripts/generate-nostr-keys.ts
 */

import { SimplePool, getPublicKey, finalizeEvent, verifyEvent, nip19 } from "nostr-tools";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { siteConfig } from "../src/lib/config";

const nsec = process.env.NSEC;
if (!nsec) {
  console.error("❌ Set NSEC environment variable (e.g., NSEC=nsec1... bun run scripts/publish-nostr.ts)");
  process.exit(1);
}

// Decode nsec to Uint8Array
function decodeNsec(nsecStr: string): Uint8Array {
  const { type, data } = nip19.decode(nsecStr);
  if (type !== "nsec") throw new Error("Invalid nsec key");
  return data as Uint8Array;
}

// Read all posts
const postsDir = join(process.cwd(), "content/posts");
const files = readdirSync(postsDir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

const pool = new SimplePool();

async function main() {
  const sk = decodeNsec(nsec);
  const pk = getPublicKey(sk);

  console.log(`Publishing as: ${pk}`);
  console.log(`Found ${files.length} posts\n`);

  for (const file of files) {
    const raw = readFileSync(join(postsDir, file), "utf8");
    const { data, content } = matter(raw);

    if (!data.published) continue;

    const slug = file.replace(/\.mdx?$/, "");
    const createdAt = Math.floor(new Date(data.date).getTime() / 1000);

    const unsignedEvent = {
      kind: 30023,
      created_at: createdAt,
      tags: [
        ["d", slug],
        ["title", data.title],
        ["published_at", createdAt.toString()],
        ...((data.tags || []).map((t: string) => ["t", t])),
      ],
      content,
    };

    const event = finalizeEvent(unsignedEvent, sk);

    if (!verifyEvent(event)) {
      console.error(`❌ Failed to verify event for: ${data.title}`);
      continue;
    }

    console.log(`Publishing: ${data.title}`);

    try {
      await Promise.any(pool.publish(siteConfig.nostr.relays, event));
      console.log(`  ✅ Published to relays`);
    } catch (err) {
      console.error(`  ❌ Failed to publish:`, err);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);