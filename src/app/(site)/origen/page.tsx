import { siteConfig } from "@/lib/config";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Origen",
  description:
    "The Origen ecosystem — multi-provider agent engine, chat interface, Soul.md personas, and D1 tools. AI infrastructure that actually works.",
  openGraph: {
    title: "Origen — AI Agent Infrastructure",
    description:
      "Multi-provider agent engine, streaming chat, Soul.md personas, and Cloudflare D1 tools. The AI layer behind this blog and everything we build.",
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
          AI agent infrastructure that actually works
        </p>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Named after <strong>Origen of Alexandria</strong> (c. 185–254 AD) — the early church's
          greatest scholar and most prolific writer. The Origen ecosystem is a set of open-source
          tools for building, deploying, and chatting with AI agents.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Origen runs on this blog right now — powering AI suggestions, text formatting,
          and community insights.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
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

      <Separator className="mb-12" />

      {/* The Ecosystem */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-6 font-heading">The Ecosystem</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Origen isn't one thing — it's three layers that work together. Use them individually or compose them into a full agent platform.
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              name: "Origen Engine",
              pkg: "@moikapy/origen",
              icon: "⚡",
              desc: "The core. Multi-provider agent harness with tool calling, streaming, and D1 integration. Framework-agnostic.",
            },
            {
              name: "Origen Chat",
              pkg: "@moikapy/origen-chat",
              icon: "💬",
              desc: "Drop-in chat UI built on the engine. Streaming responses, tool-call rendering, citations, and markdown output. React + Web Components.",
            },
            {
              name: "Origen Tools",
              pkg: "@moikapy/scholar-tools",
              icon: "🔧",
              desc: "Domain-specific tool packs. Scholar tools (Bible study), blog tools (suggest, format, insights), or build your own.",
            },
          ].map((item) => (
            <div
              key={item.pkg}
              className="rounded-lg border border-border p-5 hover:border-primary/30 transition-colors"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="text-base font-semibold mb-1">{item.name}</h3>
              <code className="text-xs text-primary bg-muted px-1.5 py-0.5 rounded">{item.pkg}</code>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Origen Engine */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4 font-heading">
          ⚡ Origen Engine
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          The agent harness underneath everything. Wrap any LLM provider with tool calling,
          streaming, personas, and database access. Zero opinions about your UI.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Multi-Provider", desc: "OpenRouter, Ollama, Anthropic, Google, OpenAI, DeepSeek, Groq, xAI. Swap with one config change." },
            { title: "Streaming First", desc: "streamOrigen() yields typed events: reasoning, tool calls, text deltas, citations, errors." },
            { title: "Parallel Tool Execution", desc: "Tools run concurrently by default. Sequential mode for dependent calls." },
            { title: "Soul.md Personas", desc: "Declarative persona definitions with profiles, moods, voice tuning, and composition." },
            { title: "D1 Integration", desc: "Tools receive a D1Provider for Cloudflare D1. Query analytics, manage data from agent tools." },
            { title: "Thinking Models", desc: "Automatic extended reasoning for DeepSeek R1, Claude Sonnet 4, Gemini 2.5 Flash." },
            { title: "Citation Extraction", desc: "Pluggable extractCitations for domain-specific parsing. Pull structured refs from LLM output." },
            { title: "Sovereign Memory", desc: "Three-tier LLM-Wiki (global/community/personal) with local and cloud storage backends." },
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

      {/* Quick Start */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4 font-heading">Quick Start</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold mb-2">Install</h3>
            <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">terminal</span>
              </div>
              <pre className="px-4 py-3 text-sm overflow-x-auto">
                <code className="text-foreground">bun add @moikapy/origen</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">Define tools</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Plain TypeScript functions with JSON schemas. They receive args and a D1 provider.
            </p>
            <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">typescript</span>
              </div>
              <pre className="px-4 py-3 text-sm overflow-x-auto">
                <code className="text-foreground">
{`import { streamOrigen, callOrigen } from "@moikapy/origen";
import type { OrigenTool, AgentConfig } from "@moikapy/origen";

const lookup: OrigenTool = {
  name: "lookup",
  description: "Search the database",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search terms" }
    },
    required: ["query"],
  },
  execute: async (args, getD1) => {
    const d1 = await getD1();
    const result = await d1
      .prepare("SELECT * FROM posts WHERE title LIKE ?")
      .bind(\`%\${args.query}%\`)
      .all();
    return JSON.stringify(result.results);
  },
};`}
                </code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">Stream or call</h3>
            <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">typescript</span>
              </div>
              <pre className="px-4 py-3 text-sm overflow-x-auto">
                <code className="text-foreground">
{`const config: AgentConfig = {
  appName: "my-app",
  tools: [lookup],
  getD1: async () => myD1,
  model: "openrouter/free",
  getApiKey: async (provider) => {
    if (provider === "ollama") return "ollama";
    return process.env.OPENROUTER_API_KEY;
  },
};

// Streaming
for await (const event of streamOrigen(messages, context, config)) {
  if (event.type === "text") process.stdout.write(event.delta);
  if (event.type === "done") console.log(event.citations);
}

// One-shot
const response = await callOrigen(messages, context, config);
console.log(response.content);`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Origen Chat */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4 font-heading">
          💬 Origen Chat
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Drop-in chat interface built on Origen Engine. Streaming responses, tool-call rendering,
          citations, and markdown output. Ships as React components or Web Components.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {[
            { title: "Streaming UI", desc: "Real-time text deltas, reasoning blocks, and tool-call cards rendered as they arrive." },
            { title: "Tool Visualization", desc: "Tool calls render inline with input/output. Users see what the agent is doing." },
            { title: "Citations", desc: "Structured citations extracted from responses and linked to source material." },
            { title: "React + Web Components", desc: "Use as React components or drop in the Web Component for any framework." },
            { title: "Theme-able", desc: "CSS custom properties for colors, fonts, spacing. Matches your brand." },
            { title: "Mobile-First", desc: "Responsive layout, touch-friendly controls, safe-area support." },
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

        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">terminal</span>
          </div>
          <pre className="px-4 py-3 text-sm overflow-x-auto">
            <code className="text-foreground">bun add @moikapy/origen-chat</code>
          </pre>
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
          <a href="https://github.com/rokoss21/soul.md" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80">
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
                ["interaction", "clarifying_questions, uncertainty, disagreement, confirmations"],
                ["cognition", "mode, depth, verification (fact_checking, cross_validation)"],
                ["safety", "refusal_style, privacy, speculation, no_fabrication"],
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

      {/* How We Use It */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4 font-heading">
          How This Blog Uses Origen
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Three features, one engine. All configured with{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">model: "openrouter/free"</code> for
          automatic best-free-model selection and{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">thinkingLevel: "off"</code> to
          preserve the token budget.
        </p>
        <div className="space-y-3">
          {[
            {
              route: "/api/ai/suggest",
              method: "callOrigen()",
              desc: "Suggests titles, slugs, and excerpts for new blog posts based on a topic.",
            },
            {
              route: "/api/ai/format",
              method: "streamOrigen()",
              desc: "Formats voice-dictated text into clean Markdown with a continuation harness for long content.",
            },
            {
              route: "/api/ai/insights",
              method: "callOrigen()",
              desc: "Generates content strategy advice from community analytics — cached in KV every 30 minutes.",
            },
          ].map((item) => (
            <div
              key={item.route}
              className="rounded-lg border border-border p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-primary">
                  {item.route}
                </code>
                <span className="text-xs text-muted-foreground">→</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{item.method}</code>
              </div>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Configuration */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4 font-heading">Configuration</h2>
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">typescript</span>
          </div>
          <pre className="px-4 py-3 text-sm overflow-x-auto">
            <code className="text-foreground">
{`interface AgentConfig {
  appName?: string;              // Used in default system prompt
  systemPrompt?: string;         // Override the default prompt entirely
  tools: OrigenTool[];          // Tools available to the agent
  getD1: D1Provider;            // () => Promise<D1Like>
  model?: ModelId;              // Default: "openrouter/free"
  maxSteps?: number;            // Default: 5, max tool-call loops
  extractCitations?: (text: string) => Citation[];
  getApiKey?: (provider: string) => Promise<string | undefined>;
  ollamaBaseUrl?: string;       // Default: "http://localhost:11434/v1"
  toolExecution?: "sequential" | "parallel"; // Default: "parallel"
  signal?: AbortSignal;         // Cancellation support
  thinkingLevel?: "off" | "minimal" | "low" | "medium" | "high";
}`}
            </code>
          </pre>
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
            @moikapy/origen on npm
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
            Origen Engine on GitHub
          </a>
          <a
            href="https://github.com/rokoss21/soul.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            📜 Soul.md RFC-1
          </a>
        </div>
      </section>
    </div>
  );
}