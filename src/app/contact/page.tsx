import { siteConfig, socialIcons, socialLabels } from "@/lib/config";

export const metadata = {
  title: "Contact",
  description: "Get in touch with moikapy.",
};

const iconPaths: Record<string, string> = {
  github:
    "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.091-.646.35-1.086.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z",
  huggingface:
    "M12 2a10 10 0 100 20 10 10 0 000-20zm0 3.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm-4.5 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm9 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM8.5 14c.5 1.5 2 2.5 3.5 2.5s3-1 3.5-2.5",
  twitter:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  youtube:
    "M23.498 6.186a2.955 2.955 0 00-2.078-2.09C19.543 3.5 12 3.5 12 3.5s-7.543 0-9.42.596A2.955 2.955 0 00.502 6.186 30.86 30.86 0 000 12a30.86 30.86 0 00.502 5.814 2.955 2.955 0 002.078 2.09c1.877.596 9.42.596 9.42.596s7.543 0 9.42-.596a2.955 2.955 0 002.078-2.09A30.86 30.86 0 0024 12a30.86 30.86 0 00-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  twitch:
    "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z",
  kick:
    "M2 2h6.5v6.5L13 2h6v6.5L13 12l6 6.5V22h-6l-4.5-6.5V22H2z",
  instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  rumble:
    "M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L19.18 8 12 11.82 4.82 8 12 4.18z",
};

const socialOrder: string[] = [
  "twitter",
  "youtube",
  "github",
  "huggingface",
  "twitch",
  "kick",
  "instagram",
  "rumble",
];

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold mb-4">Get in Touch</h1>
        <p className="text-muted-foreground mb-10">
          Want to collaborate, ask a question, or just say hey? Hit me up on any
          of these platforms — I&apos;m most active on X.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {socialOrder.map((key) => {
            const url = siteConfig.socials[key as keyof typeof siteConfig.socials];
            const label = socialLabels[key as keyof typeof socialLabels];
            const icon = iconPaths[key];
            if (!url) return null;

            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                  {icon ? (
                    <svg
                      className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d={icon} />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {label.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-medium group-hover:text-primary transition-colors">
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground">@moikapy</div>
                </div>
              </a>
            );
          })}
        </div>
      </main>
  );
}