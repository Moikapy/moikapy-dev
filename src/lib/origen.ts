/**
 * Origen agent configuration for the blog AI routes.
 *
 * Uses Ollama cloud models (GLM-5.1) with the OLLAMA_API_KEY secret.
 * No OpenRouter key needed — everything goes through Ollama's cloud.
 */

import type { AgentConfig, OrigenTool } from "@moikapy/origen";

/** Get the API key for the given provider. */
export function getApiKey(provider: string): Promise<string | undefined> {
  // Ollama cloud uses OLLAMA_API_KEY
  if (provider === "ollama") {
    try {
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const ctx = getCloudflareContext();
      const key = ctx.env?.OLLAMA_API_KEY as string | undefined;
      if (key) return Promise.resolve(key);
    } catch {
      // Not in CF context
    }
    const envKey = process.env.OLLAMA_API_KEY;
    if (envKey) return Promise.resolve(envKey);
  }

  // OpenRouter — use OPENROUTER_API_KEY or fall back to OLLAMA_API_KEY
  if (provider === "openrouter") {
    try {
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const ctx = getCloudflareContext();
      const orKey = ctx.env?.OPENROUTER_API_KEY as string | undefined;
      if (orKey) return Promise.resolve(orKey);
      // Fallback: OLLAMA_API_KEY can be an OpenRouter key too
      const key = ctx.env?.OLLAMA_API_KEY as string | undefined;
      if (key) return Promise.resolve(key);
    } catch {
      // Not in CF context
    }
    const envKey = process.env.OPENROUTER_API_KEY || process.env.OLLAMA_API_KEY;
    if (envKey) return Promise.resolve(envKey);
  }

  return Promise.resolve(undefined);
}

/** Get Ollama base URL — Ollama cloud for production, local for dev. */
function getOllamaBaseUrl(): string {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const url = ctx.env?.OLLAMA_BASE_URL as string | undefined;
    if (url) return url;
  } catch {
    // Not in CF context
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

/** Config for routes that need tools (daily post writer, etc.). */
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