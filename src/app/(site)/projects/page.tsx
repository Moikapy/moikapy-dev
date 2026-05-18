import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Open-source tools, AI agents, and experiments from Moikapy. CLI frameworks, agent engines, dashboards, and more.",
  openGraph: {
    title: "Projects — Moikapy",
    description:
      "Open-source tools, AI agents, and experiments. Build with kapy, power with Origen, deploy on Cloudflare.",
  },
};

interface Project {
  title: string;
  emoji: string;
  tagline: string;
  description: string;
  href: string;
  tags: string[];
  status: "live" | "beta" | "building";
}

const projects: Project[] = [
  {
    title: "kapy",
    emoji: "🐹",
    tagline: "The agent-first CLI framework",
    description:
      "Build AI tools from the terminal. Commands, hooks, middleware, TUI — everything snaps together. Ship extensions, compose toolchains, run agents.",
    href: "/kapy",
    tags: ["TypeScript", "CLI", "Agent SDK"],
    status: "beta",
  },
  {
    title: "Origen",
    emoji: "⚡",
    tagline: "Multi-provider agent engine",
    description:
      "Powers every AI feature on this blog — post suggestions, voice dictation formatting, community insights. Open-source, streams responses, calls tools, runs Souls.",
    href: "/origen",
    tags: ["TypeScript", "Agents", "D1"],
    status: "live",
  },
  {
    title: "Federal Firehose",
    emoji: "🏛️",
    tagline: "US Treasury data, fast",
    description:
      "Real-time daily treasury statements, debt tracking, interest rates, and state-by-state spending — all from the Treasury API, deployed on Cloudflare Pages.",
    href: "https://scholar.moikapy.dev",
    tags: ["Next.js", "Cloudflare", "D1"],
    status: "live",
  },
  {
    title: "This Blog",
    emoji: "✍️",
    tagline: "What you're reading right now",
    description:
      "AI-assisted blogging on Cloudflare Workers with D1, KV, community analytics, Origen-powered suggestions, PWA, and warm editorial design.",
    href: "/blog",
    tags: ["Next.js", "Workers", "Origen"],
    status: "live",
  },
  {
    title: "$KAPY Token",
    emoji: "🪙",
    tagline: "The Moikapy economy",
    description:
      "x402 micropayments for API access. Pay per request, earn by building. Powered by Cloudflare Workers and the HTTP 402 protocol.",
    href: "/token",
    tags: ["x402", "Cloudflare", "Web3"],
    status: "building",
  },
];

const statusColors: Record<string, string> = {
  live: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  beta: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  building: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const statusLabels: Record<string, string> = {
  live: "Live",
  beta: "Beta",
  building: "Building",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-heading">
          Projects <span className="text-muted-foreground">⚒️</span>
        </h1>
        <p className="mt-2 text-lg font-medium text-primary">
          Tools, agents, and experiments
        </p>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Everything I build lives here. Open-source CLI frameworks, AI agent engines,
          data dashboards, and this blog itself. Pick one and dig in.
        </p>
      </section>

      <Separator className="mb-12" />

      {/* Project Grid */}
      <section className="mb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.title}
              href={project.href}
              className="group rounded-lg border border-border p-5 hover:border-primary/30 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{project.emoji}</span>
                  <div>
                    <h3 className="text-lg font-semibold font-heading group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{project.tagline}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <p className="text-muted-foreground text-sm">
          More projects on{" "}
          <a
            href="https://github.com/Moikapy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub ↗
          </a>
        </p>
      </section>
    </div>
  );
}