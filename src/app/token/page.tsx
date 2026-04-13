import { siteConfig } from "@/lib/config";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KAPY Token",
  description: `${siteConfig.token.symbol} — The moikapy token on Base. Support the builder, fuel the Lair.`,
  openGraph: {
    title: `${siteConfig.token.symbol} — The moikapy Token`,
    description: siteConfig.token.description,
  },
};

export default function KapyTokenPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      {/* Hero */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-3">
          <img
            src="/capybara-256.webp"
            alt="KAPY token"
            className="h-16 w-16 rounded-xl"
          />
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {siteConfig.token.symbol}
            </h1>
            <p className="text-lg font-medium text-primary">
              The moikapy token — on Base
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          {siteConfig.token.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-xs font-medium text-blue-500">
            Base
          </span>
          <span className="inline-flex items-center rounded-md bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 text-xs font-medium text-orange-500">
            Chain ID: {siteConfig.token.chainId}
          </span>
          <span className="inline-flex items-center rounded-md bg-green-500/10 border border-green-500/30 px-2.5 py-1 text-xs font-medium text-green-500">
            USDC Pair
          </span>
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Contract */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Contract</h2>
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Token Address</p>
            <code className="text-sm break-all text-foreground font-mono">
              {siteConfig.token.address}
            </code>
          </div>
          <div className="border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Network</p>
            <p className="text-sm text-foreground">{siteConfig.token.network}</p>
          </div>
        </div>
      </section>

      {/* What KAPY funds */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">What {siteConfig.token.symbol} funds</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              emoji: "🛠️",
              title: "Open Source",
              description: "Building kapy, moiad, and other tools the community can use.",
            },
            {
              emoji: "🐉",
              title: "The Lair",
              description: "Infrastructure, domains, hosting — keeping the ship running.",
            },
            {
              emoji: "📝",
              title: "Content",
              description: "Blog posts, videos, and educational material about AI and building.",
            },
            {
              emoji: "🎨",
              title: "3D Printing",
              description: "Designs on MakerWorld and Etsy — physical things from digital ideas.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border p-4">
              <div className="text-2xl mb-2">{item.emoji}</div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-12" />

      {/* How to buy */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4">How to get {siteConfig.token.symbol}</h2>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold">Get a Base wallet</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Use MetaMask, Coinbase Wallet, Rabby, or any EVM-compatible wallet. Switch to the Base network.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold">Get USDC on Base</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Bridge USDC from Ethereum or buy directly on Coinbase. Base uses USDC as the base pair.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-semibold">Swap on DexScreener or Flaunch</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Trade {siteConfig.token.symbol}/USDC on DexScreener, or buy directly on Flaunch.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator className="mb-12" />

      {/* Links */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Links</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={siteConfig.token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-sm font-medium text-orange-500 transition-colors hover:bg-orange-500/20 hover:border-orange-500/50"
          >
            <img src="/capybara-128.webp" alt="KAPY" className="h-4 w-4 rounded" />
            Flaunch
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
            </svg>
          </a>
          <a
            href={siteConfig.token.dexScreener}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            DexScreener
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
            </svg>
          </a>
          <a
            href={`https://basescan.org/token/${siteConfig.token.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Basescan
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}