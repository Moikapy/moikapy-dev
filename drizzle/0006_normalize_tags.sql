-- Junction table for post tags (replaces JSON array in posts.tags)
CREATE TABLE IF NOT EXISTS post_tags (
  slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (slug, tag)
);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag);