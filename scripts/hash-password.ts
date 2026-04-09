export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const password = process.argv[2];
if (!password) {
  console.error("Usage: bun run scripts/hash-password.ts <password>");
  process.exit(1);
}

hashPassword(password).then((hash) => {
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log("\nAdd this to your .env file or Cloudflare Workers secrets:");
  console.log("  wrangler secret put ADMIN_PASSWORD_HASH");
  console.log(`  (paste: ${hash})`);
});