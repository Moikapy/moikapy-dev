-- Create page_views table for tracking per-path analytics
CREATE TABLE IF NOT EXISTS page_views (
  path TEXT NOT NULL,
  date TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (path, date)
);