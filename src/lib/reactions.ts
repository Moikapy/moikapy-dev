// Available reactions — curated to match the site's vibe
export const AVAILABLE_EMOJIS = ["🔥", "💯", "🧠", "🐉", "🤔", "🖖", "🦫", "❤️"] as const;
export type ReactionEmoji = (typeof AVAILABLE_EMOJIS)[number];

export function isValidEmoji(emoji: string): emoji is ReactionEmoji {
  return AVAILABLE_EMOJIS.includes(emoji as ReactionEmoji);
}