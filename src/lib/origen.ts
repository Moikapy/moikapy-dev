/**
 * Origen agent configuration for the blog AI routes.
 *
 * Uses Ollama cloud models (GLM-5.1) with the OLLAMA_API_KEY secret.
 * OLLAMA_BASE_URL secret should be set to https://api.ollama.com/v1
 */

import type { AgentConfig, OrigenTool } from "@moikapy/origen";

/**
 * Get the Cloudflare context in a way that works in both
 * CF Workers (via getCloudflareContext) and local dev (returns undefined).
 */
function tryGetCloudflareContext(): Record<string, any> | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    return getCloudflareContext();
  } catch {
    return undefined;
  }
}

/** Get the API key for the given provider. */
export function getApiKey(provider: string): Promise<string | undefined> {
  if (provider === "ollama") {
    const ctx = tryGetCloudflareContext();
    if (ctx) {
      const key = ctx.env?.OLLAMA_API_KEY as string | undefined;
      if (key) return Promise.resolve(key);
    }
    const envKey = process.env.OLLAMA_API_KEY;
    if (envKey) return Promise.resolve(envKey);
  }

  if (provider === "openrouter") {
    const ctx = tryGetCloudflareContext();
    if (ctx) {
      const orKey = ctx.env?.OPENROUTER_API_KEY as string | undefined;
      if (orKey) return Promise.resolve(orKey);
      const key = ctx.env?.OLLAMA_API_KEY as string | undefined;
      if (key) return Promise.resolve(key);
    }
    const envKey = process.env.OPENROUTER_API_KEY || process.env.OLLAMA_API_KEY;
    if (envKey) return Promise.resolve(envKey);
  }

  return Promise.resolve(undefined);
}

/** Get Ollama base URL — cloud in production, local for dev. */
export function getOllamaBaseUrl(): string {
  const ctx = tryGetCloudflareContext();
  if (ctx) {
    const url = ctx.env?.OLLAMA_BASE_URL as string | undefined;
    if (url) return url;
  }
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
}

/** Stub D1 provider — blog AI routes don't use D1 tools. */
const stubD1Provider: AgentConfig["getD1"] = async () => {
  throw new Error("D1 not available in blog AI routes");
};

/** Model for blog AI features — GLM-5.1 via Ollama cloud. */
export const BLOG_MODEL = "ollama/glm-5.1:cloud" as const;

/** Empty tools array — routes that don't need tools. */
export const NO_TOOLS: OrigenTool[] = [];

/** Shared config base for blog AI routes. */
export function blogConfig(systemPrompt: string, signal?: AbortSignal): AgentConfig {
  return {
    appName: "moikapy-blog",
    systemPrompt,
    tools: NO_TOOLS,
    getD1: stubD1Provider,
    model: BLOG_MODEL,
    getApiKey,
    ollamaBaseUrl: getOllamaBaseUrl(),
    thinkingLevel: "off",
    ...(signal ? { signal } : {}),
  };
}

/** Config for routes that need tools (future: chat features). */
export function blogConfigWithTools(systemPrompt: string, tools: OrigenTool[], signal?: AbortSignal): AgentConfig {
  return {
    appName: "moikapy-blog",
    systemPrompt,
    tools,
    getD1: stubD1Provider,
    model: BLOG_MODEL,
    getApiKey,
    ollamaBaseUrl: getOllamaBaseUrl(),
    thinkingLevel: "off",
    maxSteps: 6,
    ...(signal ? { signal } : {}),
  };
}