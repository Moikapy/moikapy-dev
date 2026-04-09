/**
 * Generate a Nostr key pair for publishing blog posts.
 *
 * Run this once, then save the nsec somewhere safe (like a .env file)
 * and add the npub to your site config.
 *
 * Usage: bun run scripts/generate-nostr-keys.ts
 */

import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";

const sk = generateSecretKey();
const pk = getPublicKey(sk);

// Convert Uint8Array to hex
const skHex = Array.from(sk)
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

const nsec = nip19.nsecEncode(sk);
const npub = nip19.npubEncode(pk);

console.log("🔑 Nostr Key Pair Generated\n");
console.log(`Private Key (hex):  ${skHex}`);
console.log(`Public Key (hex):   ${pk}`);
console.log(`\nPrivate Key (nsec): ${nsec}`);
console.log(`Public Key (npub):  ${npub}`);
console.log("\n⚠️  Save your nsec somewhere safe! Never commit it to git.");
console.log("   Add your npub to src/lib/config.ts under nostr.npub");