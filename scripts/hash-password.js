#!/usr/bin/env node
/**
 * Generate an ADMIN_PASSWORD_HASH for Cloudflare Workers secret.
 *
 * Usage:
 *   node scripts/hash-password.js
 *   (prompts for password, outputs hash)
 *
 * Then set it:
 *   npx wrangler secret put ADMIN_PASSWORD_HASH
 *   (paste the hash)
 */

const crypto = require("crypto");

const ITERATIONS = 100_000;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, 32, "sha256", (err, derivedKey) => {
      if (err) return reject(err);
      const hash = derivedKey.toString("hex");
      resolve(`pbkdf2:${ITERATIONS}:${salt}:${hash}`);
    });
  });
}

async function main() {
  const readline = require("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.question("Password: ", async (password) => {
    rl.close();
    if (!password) {
      console.error("Password cannot be empty.");
      process.exit(1);
    }
    const hash = await hashPassword(password);
    console.log("\n--- Copy the hash below ---");
    console.log(hash);
    console.log("---\n");
    console.log("Set it with: npx wrangler secret put ADMIN_PASSWORD_HASH");
    process.exit(0);
  });
}

main();