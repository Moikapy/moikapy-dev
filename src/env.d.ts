/// <reference types="@cloudflare/workers-types" />
import type { CloudflareEnv } from "@opennextjs/cloudflare";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ADMIN_PASSWORD_HASH?: string;
      SESSION_SECRET?: string;
      NEXT_PUBLIC_CF_BEACON_TOKEN?: string;
    }
  }

  interface CloudflareEnv {
    DB?: D1Database;
    ASSETS?: Fetcher;
    WORKER_SELF_REFERENCE?: Service;
    ADMIN_PASSWORD_HASH?: string;
    SESSION_SECRET?: string;
    WALLET_ADDRESS?: string;
  }
}

export {};