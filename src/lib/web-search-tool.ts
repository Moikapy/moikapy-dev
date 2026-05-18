/**
 * Origen tool: web_search
 *
 * Searches the web for factual information using DuckDuckGo's API.
 * Returns top results with titles, URLs, and snippets.
 * Used by the daily post writer to research trending topics.
 */

import type { OrigenTool } from "@moikapy/origen";

export const webSearchTool: OrigenTool = {
  name: "web_search",
  description:
    "Search the web for factual information. Returns top results with summaries and source URLs. Use this to research topics, find facts, verify claims, and gather sources before writing.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query. Be specific for better results.",
      },
    },
    required: ["query"],
  },
  async execute(args: Record<string, unknown>): Promise<string> {
    const query = args.query as string;
    if (!query || typeof query !== "string") {
      return "Error: query parameter is required";
    }

    try {
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const response = await fetch(searchUrl, {
        headers: { "User-Agent": "moikapy-blog/1.0" },
      });

      if (!response.ok) {
        return `Search failed: ${response.status} ${response.statusText}`;
      }

      const data = await response.json() as Record<string, any>;
      const results: string[] = [];

      // DuckDuckGo Instant Answer API
      if (data.AbstractText) {
        results.push(`Summary: ${data.AbstractText}`);
        if (data.AbstractURL) results.push(`Source: ${data.AbstractURL}`);
      }

      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, 5)) {
          if (topic.Text && topic.FirstURL) {
            results.push(`- ${topic.Text}\n  ${topic.FirstURL}`);
          } else if (topic.Text) {
            results.push(`- ${topic.Text}`);
          }
        }
      }

      if (data.Results) {
        for (const r of data.Results.slice(0, 3)) {
          if (r.Text && r.FirstURL) {
            results.push(`- ${r.Text}\n  ${r.FirstURL}`);
          }
        }
      }

      if (results.length === 0) {
        return `No results found for "${query}". Try a different search term.`;
      }

      return results.join("\n\n");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[web_search] Error:", msg);
      return `Search failed: ${msg}. Proceed with what you know, but note that you could not verify facts.`;
    }
  },
};