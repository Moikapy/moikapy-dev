/**
 * Input validation and sanitization for post data.
 * Prevents XSS in stored content and ensures data integrity.
 */

const MAX_TITLE_LENGTH = 200;
const MAX_SLUG_LENGTH = 100;
const MAX_EXCERPT_LENGTH = 500;
const MAX_CONTENT_LENGTH = 500_000; // 500KB — generous for blog posts
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export function validateSlug(slug: unknown): string {
  if (typeof slug !== "string") throw new Error("Slug must be a string");
  const trimmed = slug.trim();
  if (trimmed.length < 1 || trimmed.length > MAX_SLUG_LENGTH) {
    throw new Error(`Slug must be 1-${MAX_SLUG_LENGTH} characters`);
  }
  if (!SLUG_PATTERN.test(trimmed)) {
    throw new Error("Slug must be lowercase alphanumeric with hyphens (no leading/trailing hyphens)");
  }
  return trimmed;
}

export function validateTitle(title: unknown): string {
  if (typeof title !== "string") throw new Error("Title must be a string");
  const trimmed = title.trim();
  if (trimmed.length < 1 || trimmed.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be 1-${MAX_TITLE_LENGTH} characters`);
  }
  return trimmed;
}

export function validateExcerpt(excerpt: unknown): string {
  if (excerpt === undefined || excerpt === null) return "";
  if (typeof excerpt !== "string") throw new Error("Excerpt must be a string");
  if (excerpt.length > MAX_EXCERPT_LENGTH) {
    throw new Error(`Excerpt must be at most ${MAX_EXCERPT_LENGTH} characters`);
  }
  return excerpt.trim();
}

export function validateContent(content: unknown): string {
  if (typeof content !== "string") throw new Error("Content must be a string");
  if (content.length < 1 || content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content must be 1-${MAX_CONTENT_LENGTH} characters`);
  }
  return content;
}

export function validateTags(tags: unknown): string[] {
  if (tags === undefined || tags === null) return [];
  if (!Array.isArray(tags)) throw new Error("Tags must be an array");
  if (tags.length > MAX_TAGS) {
    throw new Error(`Maximum ${MAX_TAGS} tags allowed`);
  }
  return tags.map((tag) => {
    if (typeof tag !== "string") throw new Error("Each tag must be a string");
    const trimmed = tag.trim().toLowerCase();
    if (trimmed.length === 0 || trimmed.length > MAX_TAG_LENGTH) {
      throw new Error(`Tags must be 1-${MAX_TAG_LENGTH} characters`);
    }
    return trimmed;
  });
}

export function validateCoverImage(coverImage: unknown): string | null {
  if (coverImage === undefined || coverImage === null || coverImage === "") return null;
  if (typeof coverImage !== "string") throw new Error("Cover image must be a string");
  if (coverImage.length > 2000) throw new Error("Cover image URL too long");
  return coverImage;
}

/**
 * Strip dangerous HTML from Tiptap output.
 * Tiptap already sanitizes on the client, but we double-check server-side.
 */
export function sanitizeHtmlContent(content: string): string {
  let clean = content;
  // Remove script tags entirely
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Remove event handlers (onclick, onerror, etc.)
  clean = clean.replace(/\son\w+\s*=\s*(["'][^"']*["']|\S+)/gi, "");
  // Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*["']\s*javascript:/gi, 'href="#"');
  return clean;
}