"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { siteConfig, socialLabels, type SocialKey } from "@/lib/config";
import {
  GithubIcon,
  HuggingfaceIcon,
  TwitterIcon,
  YoutubeIcon,
  TwitchIcon,
  KickIcon,
  InstagramIcon,
  RumbleIcon,
} from "@/components/icons";
import { siteConfig as config } from "@/lib/config";
import { Menu, X } from "lucide-react";
import Image from "next/image";

const iconMap: Record<SocialKey, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  github: GithubIcon,
  huggingface: HuggingfaceIcon,
  twitter: TwitterIcon,
  youtube: YoutubeIcon,
  twitch: TwitchIcon,
  kick: KickIcon,
  instagram: InstagramIcon,
  rumble: RumbleIcon,
};

const socialNames: Record<SocialKey, string> = {
  github: "GitHub",
  huggingface: "Hugging Face",
  twitter: "X / Twitter",
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  instagram: "Instagram",
  rumble: "Rumble",
};

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/capybara-256.webp"
            alt="moikapy capybara"
            width={36}
            height={36}
            className="rounded-lg"
            priority
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight">{config.author}</span>
            <span className="text-[10px] font-medium text-muted-foreground leading-tight">
              {config.tag}
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/blog"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            href="/traces"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Traces
          </Link>
          {(Object.keys(config.socials) as SocialKey[]).map((key) => {
            const Icon = iconMap[key];
            const label = socialLabels[key];
            return (
              <a
                key={key}
                href={config.socials[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden rounded-md p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu — portaled to body so z-index works above page content */}
      {mobileOpen && typeof window !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[9998] bg-black/50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-[9999] w-[85vw] max-w-[288px] bg-background border-l border-border p-5 md:hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src="/capybara-128.webp" alt="moikapy" className="h-8 w-8 rounded-lg" />
                  <span className="text-lg font-bold">{config.author}</span>
                </div>
                <button
                  type="button"
                  className="rounded-md p-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                <Link
                  href="/"
                  className="rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/blog"
                  className="rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  Blog
                </Link>
                <Link
                  href="/traces"
                  className="rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  Traces
                </Link>
              </nav>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-3">Follow</p>
                <div className="flex flex-col gap-1">
                  {(Object.keys(config.socials) as SocialKey[]).map((key) => {
                    const Icon = iconMap[key];
                    return (
                      <a
                        key={key}
                        href={config.socials[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        {socialNames[key]}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </header>
  );
}