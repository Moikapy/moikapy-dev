import { siteConfig } from "@/lib/config";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kapy",
  description: "Install kapy — the agent-first CLI framework. Build AI tools from the terminal.",
  openGraph: {
    title: "Kapy — Agent-First CLI Framework",
    description: "Build AI tools from the terminal. Commands, hooks, middleware, TUI — everything snaps together.",
  },
};

export default function KapyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          kapy <span className="text-muted-foreground">🐹</span>
        </h1>
        <p className="mt-2 text-lg font-medium text-primary">The agent-first CLI framework</p>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Build AI tools from the terminal. Commands, hooks, middleware, TUI — everything snaps together.
          Ship extensions. Compose toolchains. Run agents.
        </p>
      </section>

      <Separator className="mb-12" />

      {/* Install */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Install</h2>
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">terminal</span>
          </div>
          <pre className="px-4 py-3 text-sm overflow-x-auto">
            <code className="text-foreground">bun install -g kapy</code>
          </pre>
        </div>
      </section>

      {/* Quick Start */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Start</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold mb-2">Standalone mode</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Run <code className="text-xs bg-muted px-1.5 py-0.5 rounded">kapy</code> directly. It ships with meta-commands — its CLI surface is empty until you install extensions.
            </p>
            <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">terminal</span>
              </div>
              <pre className="px-4 py-3 text-sm overflow-x-auto">
                <code className="text-foreground">{"kapy install npm:@foo/kapy-deploy\nkapy deploy:aws --region us-east-1\nkapy tui"}</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">Embedded mode</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Build your own extensible CLI on top of kapy.
            </p>
            <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">typescript</span>
              </div>
              <pre className="px-4 py-3 text-sm overflow-x-auto">
                <code className="text-foreground">{"import { kapy } from \"kapy\"\n\nkapy()\n  .command(\"deploy\", {\n    description: \"Deploy your application\",\n    args: [{ name: \"env\", description: \"Environment\", default: \"staging\" }],\n    flags: {\n      verbose: { type: \"boolean\", alias: \"v\", description: \"Verbose output\" },\n    },\n  }, async (ctx) => {\n    ctx.log(`Deploying to ${ctx.args.env}...`)\n  })\n  .run()"}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Built-in Commands */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Built-in Commands</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Command</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["kapy init &lt;name&gt;", "Scaffold a new kapy-powered CLI project"],
                ["kapy install &lt;pkg&gt;", "Install an extension (npm/git/local)"],
                ["kapy list", "Show installed extensions"],
                ["kapy update [name]", "Update all or a specific extension"],
                ["kapy remove &lt;name&gt;", "Uninstall an extension"],
                ["kapy upgrade", "Upgrade kapy to the latest version"],
                ["kapy config", "View/edit configuration"],
                ["kapy dev", "Run CLI in dev mode with hot reload"],
                ["kapy commands", "List all registered commands"],
                ["kapy inspect", "Dump full state (extensions, config, hooks)"],
                ["kapy tui", "Launch interactive terminal UI"],
              ].map(([cmd, desc]) => (
                <tr key={cmd}>
                  <td className="px-4 py-2.5">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cmd}</code>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Extensions */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Extensions</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Extensions are TypeScript modules that register commands, hooks, middleware, and TUI screens:
        </p>
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">typescript</span>
          </div>
          <pre className="px-4 py-3 text-sm overflow-x-auto">
            <code className="text-foreground">{'import type { KapyExtensionAPI } from "kapy"\n\nexport async function register(api: KapyExtensionAPI) {\n  api.addCommand("deploy:aws", {\n    description: "Deploy to AWS",\n  }, async (ctx) => {\n    ctx.log("Deploying to AWS...")\n  })\n}'}</code>
          </pre>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Install from npm, git, or local paths:
        </p>
        <div className="mt-2 rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">terminal</span>
          </div>
          <pre className="px-4 py-3 text-sm overflow-x-auto">
            <code className="text-foreground">{"kapy install npm:@foo/kapy-ext\nkapy install git:github.com/user/repo\nkapy install ./path/to/ext"}</code>
          </pre>
        </div>
      </section>

      {/* AI Agent Support */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">AI Agent Support</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Every command supports <code className="text-xs bg-muted px-1.5 py-0.5 rounded">--json</code> and <code className="text-xs bg-muted px-1.5 py-0.5 rounded">--no-input</code> for machine-readable,
          non-interactive output. Extensions declare <code className="text-xs bg-muted px-1.5 py-0.5 rounded">agentHints</code> — structured metadata that AI agents parse to understand commands and call them.
        </p>
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center px-4 py-2 border-b border-border bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">terminal</span>
          </div>
          <pre className="px-4 py-3 text-sm overflow-x-auto">
            <code className="text-foreground">{"kapy commands --json\nkapy deploy:aws --json --no-input\nkapy inspect --json"}</code>
          </pre>
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Links */}
      <section>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://github.com/Moikapy/kapy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            View on GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@moikapy/kapy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M0 0v16h16V0H0zm14 14H2V2h12v12z"/><path d="M4 4h8v8H4z"/></svg>
            npm Package
          </a>
        </div>
      </section>
    </div>
  );
}