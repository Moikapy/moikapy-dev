import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Origen",
  description:
    "Origen powers the AI features on this blog — suggestions, formatting, and community insights. An open-source multi-provider agent engine.",
  openGraph: {
    title: "Origen — AI That Powers This Blog",
    description:
      "Multi-provider agent engine with streaming, tool calling, Soul.md personas, and D1 integration. See it in action.",
  },
};

export default function OrigenPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-heading">
          Origen <span className="text-muted-foreground">⚡</span>
        </h1>
        <p className="mt-2 text-lg font-medium text-primary">
          The AI engine behind this blog
        </p>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Named after <strong>Origen of Alexandria</strong> (c. 185–254 AD) — the early church's
          greatest scholar. Every AI feature on this site runs through Origen: the suggest tool that
          generates post ideas, the formatter that cleans up voice-dictated text, and the insights
          engine that spots community trends.
        </p>
      </section>

      <Separator className="mb-12" />

      {/* Live on This Site */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-6 font-heading">
          Live on This Site
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Three production features, one engine. Here's how Origen powers real stuff you can try right now.
        </p>

        <div className="space-y-4">
          {/* Suggest */}
          <div className="rounded-lg border border-border p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="text-lg font-semibold font-heading">AI Post Suggestions</h3>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-primary">
                  callOrigen()
                </code>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              In the admin editor, type a topic and hit <strong>Suggest</strong>. Origen calls
              OpenRouter's best free model, gets a title, slug, and excerpt back, and populates the
              form. One-shot, no streaming — just a fast suggestion.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="inline-flex items-center gap-1 text-primary">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                Try it: /admin → New Post → Suggest
              </span>
            </p>
          </div>

          {/* Format */}
          <div className="rounded-lg border border-border p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">✍️</span>
              <div>
                <h3 className="text-lg font-semibold font-heading">Voice-to-Clean-Markdown</h3>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-primary">
                  streamOrigen()
                </code>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dictate a rough draft, hit <strong>Format</strong>, and Origen streams back clean
              Markdown in real-time. A continuation harness detects truncated output and sends
              "continue" messages — so long posts get fully formatted, not cut off.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="inline-flex items-center gap-1 text-primary">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                Try it: /admin → Edit any post → Format
              </span>
            </p>
          </div>

          {/* Insights */}
          <div className="rounded-lg border border-border p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">✨</span>
              <div>
                <h3 className="text-lg font-semibold font-heading">Community Insights</h3>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-primary">
                  callOrigen() + D1 + KV cache
                </code>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every 30 minutes, a cron job reads D1 analytics (page views, trending tags, popular
              posts), feeds them to Origen, and asks "what should I write next?" The response gets
              cached in KV. The homepage and insights tab read from KV — zero LLM latency in the
              render path. If Origen fails, pure D1 queries still work.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="inline-flex items-center gap-1 text-primary">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                See it: homepage trending + spotlight sections, or /admin → Insights tab
              </span>
            </p>
          </div>
        </div>
      </section>

      <Separator className="mb-12" />

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4 font-heading">
          How It Works
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Origen is an <strong>agent harness, not a chatbot</strong>. You give it messages, tools,
          and a config — it handles provider routing, tool execution, streaming, and response
          parsing. The code below is exactly what runs on this blog.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold mb-2">One config, any provider</h3>
            <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">
                  src/lib/origen.ts — the shared blog config
                </span>
              </div>
              <pre className="px-4 py-3 text-sm overflow-x-auto">
                <code className="text-foreground">
{`import { callOrigen, streamOrigen } from "@moikapy/origen";
import type { AgentConfig, OrigenTool } from "@moikapy/origen";

export const BLOG_MODEL = "openrouter/free";  // auto best-free
export const NO_TOOLS: OrigenTool[] = [];       // no tools for suggest/format

export function blogConfig(systemPrompt: string, signal?: AbortSignal): AgentConfig {
  return {
    appName: "moikapy-blog",
    systemPrompt,
    tools: NO_TOOLS,
    getD1: async () => { throw new Error("D1 not available in blog AI routes"); },
    model: BLOG_MODEL,
    getApiKey: async (provider) => {
      if (provider === "ollama") return "ollama";
      // Resolve from CF env or process.env
    },
    thinkingLevel: "off",  // don't waste tokens on chain-of-thought
  };
}`}
                </code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">Community insights with D1 tools</h3>
            <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">
                  src/app/api/ai/insights/route.ts — the cron endpoint
                </span>
              </div>
              <pre className="px-4 py-3 text-sm overflow-x-auto">
                <code className="text-foreground">
{`// Step 1: Read analytics from D1
const trendingTags = await getTrendingTags(d1);
const trendingSlugs = await getTrendingPosts(d1);

// Step 2: Ask Origen for content strategy advice
const response = await callOrigen(
  [{ role: "user", content: prompt }],
  { trendingTags, trendingSlugs },
  blogConfig("You are a content strategist...")
);

// Step 3: Cache in KV for zero-latency homepage reads
await setCommunityInsights(kv, { trendingTags, ... });`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Engine Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-6 font-heading">
          Engine Features
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Multi-Provider", desc: "OpenRouter, Ollama, Anthropic, Google, OpenAI, DeepSeek, Groq, xAI. Swap with one config change." },
            { title: "Streaming First", desc: "streamOrigen() yields typed events: reasoning, tool calls, text deltas, citations, errors." },
            { title: "Parallel Tool Execution", desc: "Tools run concurrently by default. Sequential mode for dependent calls." },
            { title: "Soul.md Personas", desc: "Declarative personas with profiles, moods, voice tuning, composition, and mood transitions." },
            { title: "D1 Integration", desc: "Tools receive a D1Provider for Cloudflare D1. Query analytics, manage data from agent tools." },
            { title: "Thinking Models", desc: "Automatic extended reasoning for DeepSeek R1, Claude Sonnet 4, Gemini 2.5 Flash." },
            { title: "Citation Extraction", desc: "Pluggable extractCitations for domain-specific parsing. Pull structured refs from LLM output." },
            { title: "Sovereign Memory", desc: "Three-tier LLM-Wiki (global/community/personal) with local and cloud storage backends." },
            { title: "Provider-Aware Auth", desc: "getApiKey(provider) resolves keys per-provider — OAuth PKCE for OpenRouter, local for Ollama." },
            { title: "Abort Support", desc: "Pass signal: AbortSignal to cancel streaming mid-flight. Clean shutdown, no hanging requests." },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border p-4 hover:border-primary/30 transition-colors"
            >
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Soul.md */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4 font-heading">
          📜 Soul.md — Persona as Code
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Origen supports{" "}
          <a
            href="https://github.com/rokoss21/soul.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Soul.md (RFC-1)
          </a>{" "}
          — a portable spec for declaring AI personas. Identity, voice, cognition, safety — all in one file.
        </p>

        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden mb-6">
          <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">typescript</span>
          </div>
          <pre className="px-4 py-3 text-sm overflow-x-auto">
            <code className="text-foreground">
{`import { loadSoul } from "@moikapy/origen/soul";

const soul = loadSoul(soulMdContent);
const prompt = soul.buildPrompt();              // Full system prompt
const concise = soul.selectProfile("concise");  // Switch profile
console.log(concise.buildPrompt());              // Concise version`}
            </code>
          </pre>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Section</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Fields</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["identity", "role, archetype, domain_focus, non_goals"],
                ["relationship", "stance, user_model_default, trust_baseline"],
                ["voice", "formality, warmth, verbosity, jargon, formatting, emoji_policy"],
                ["interaction", "clarifying_questions, uncertainty, disagreement"],
                ["cognition", "mode, depth, verification (fact_checking, cross_validation)"],
                ["safety", "refusal_style, privacy, no_fabrication, no_false_certainty"],
                ["actions", "when_to_use_tools, explain_actions, failover"],
                ["state", "dynamic moods with trigger-based transitions"],
                ["profiles", "named overlays (concise, scholarly, friendly, etc.)"],
                ["composition", "extends, mixins, merge_policy"],
              ].map(([section, fields]) => (
                <tr key={section}>
                  <td className="px-4 py-2.5 font-medium">{section}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{fields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Providers */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4 font-heading">Providers</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Provider</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Models</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Auth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["OpenRouter", "275+ models, free tier", "OAuth PKCE / API key"],
                ["Ollama", "Llama 3, Gemma 3, Mistral, Qwen 3, DeepSeek R1, + custom", "Local (no key)"],
                ["Anthropic", "Claude Sonnet 4, Opus, Haiku", "API key"],
                ["Google", "Gemini 2.5 Flash, Pro", "API key"],
                ["OpenAI", "GPT-4o, o3, etc.", "API key"],
                ["DeepSeek", "Chat, R1, V3", "API key"],
                ["Groq", "Llama 3, Mixtral", "API key"],
                ["xAI", "Grok, etc.", "API key"],
              ].map(([provider, models, auth]) => (
                <tr key={provider}>
                  <td className="px-4 py-2.5 font-medium">{provider}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{models}</td>
                  <td className="px-4 py-2.5">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{auth}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Links */}
      <section>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://www.npmjs.com/package/@moikapy/origen"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium transition-colors hover:bg-primary/90"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 0v16h16V0H0zm14 14H2V2h12v12z" />
              <path d="M4 4h8v8H4z" />
            </svg>
            npm Package
          </a>
          <a
            href="https://github.com/Moikapy/origen"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}