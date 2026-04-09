export const siteConfig = {
  name: "moikapy.dev",
  title: "moikapy — AI Engineer x Gamer",
  description:
    "Personal blog of moikapy. Writing about AI engineering, gaming, and building cool stuff.",
  url: "https://moikapy.dev",
  author: "moikapy",
  tag: "AI Engineer x Gamer",
  socials: {
    github: "https://github.com/moikapy",
    huggingface: "https://huggingface.co/moikapy",
    twitter: "https://x.com/moikapy",
    youtube: "https://youtube.com/@moikapy",
    twitch: "https://twitch.tv/moikapy",
    kick: "https://kick.com/moikapy",
    instagram: "https://instagram.com/moikapy",
    rumble: "https://rumble.com/user/moikapy",
  },
  nostr: {
    // Replace with your actual npub after generating a key pair
    npub: process.env.NOSTR_NPUB ?? "",
    relays: [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.nostr.band",
    ],
  },
} as const;

export type SocialKey = keyof typeof siteConfig.socials;

export const socialIcons: Record<SocialKey, string> = {
  github: "github",
  huggingface: "huggingface",
  twitter: "twitter",
  youtube: "youtube",
  twitch: "twitch",
  kick: "kick",
  instagram: "instagram",
  rumble: "rumble",
};

export const socialLabels: Record<SocialKey, string> = {
  github: "GitHub",
  huggingface: "Hugging Face",
  twitter: "X / Twitter",
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  instagram: "Instagram",
  rumble: "Rumble",
};