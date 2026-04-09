import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { RssIcon, NostrIcon } from "@/components/icons";

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 py-8">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.author}. Built with Next.js &amp; Cloudflare.
        </p>
        <div className="flex items-center gap-3">
          <a
            href={siteConfig.token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-orange-500"
            aria-label="$KAPY token"
          >
            <img src="/capybara-128.webp" alt="" className="h-3.5 w-3.5 rounded" />
            <span className="hidden sm:inline">$KAPY</span>
          </a>
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
    </footer>
  );
}