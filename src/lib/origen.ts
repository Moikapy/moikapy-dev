/**
 * Origen agent configuration for the blog AI routes.
 *
 * Centralizes model selection and API key resolution
 * so suggest and format routes share the same config.
 */

import type { AgentConfig, OrigenTool } from "@moikapy/origen";

/** Get the API key for the given provider. */
export function getApiKey(provider: string): Promise<string | undefined> {
  if (provider === "ollama") return Promise.resolve("ollama");

  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const key = ctx.env?.OLLAMA_API_KEY as string | undefined;
    if (key) return Promise.resolve(key);
  } catch {
    // Not in CF context — fall through to env
  }

  const envKey = process.env.OLLAMA_API_KEY;
  if (envKey) return Promise.resolve(envKey);

  return Promise.resolve(undefined);
}

/** Stub D1 provider — blog AI routes don't use tools, so this is never called. */
const stubD1Provider: AgentConfig["getD1"] = async () => {
  throw new Error("D1 not available in blog AI routes");
};

/** Default model for blog AI features. */
export const BLOG_MODEL = "openrouter/free" as const;

/** Empty tools array — blog AI routes don't use tools. */
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
    thinkingLevel: "off", // No chain-of-thought — it eats the token budget
    ...(signal ? { signal } : {}),
  };
}