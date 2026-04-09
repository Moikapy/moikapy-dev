import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { RssIcon, NostrIcon } from "@/components/icons";

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 sm:px-6 py-8">
        {/* Token badge */}
        <a
          href={siteConfig.token.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 rounded-lg border border-orange-500/30 bg-orange-500/5 px-3 py-2 transition-colors hover:border-orange-500/50 hover:bg-orange-500/10"
        >
          <img src="/capybara-128.webp" alt="KAPY" className="h-7 w-7 rounded-md" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold group-hover:text-orange-500 transition-colors">
              $KAPY
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Base · {siteConfig.token.address.slice(0, 6)}...{siteConfig.token.address.slice(-4)}
            </span>
          </div>
          <svg className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
          </svg>
        </a>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.author}. Built with Next.js &amp; Cloudflare.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="/api"
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="API"
            >
              <span className="hidden sm:inline">API 💰</span>
              <span className="sm:hidden">💰</span>
            </a>
            <Link
              href="/feed/rss.xml"
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="RSS Feed"
            >
              <RssIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">RSS</span>
            </Link>
            <a
              href="/feed/nostr.json"
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Nostr Feed"
            >
              <NostrIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nostr</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}