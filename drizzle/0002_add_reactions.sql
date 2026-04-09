CREATE TABLE IF NOT EXISTS reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  emoji TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_slug, emoji, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post_slug ON reactions(post_slug);