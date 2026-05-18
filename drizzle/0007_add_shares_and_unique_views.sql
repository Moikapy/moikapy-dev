-- Add unique_views column to page_views
ALTER TABLE page_views ADD COLUMN unique_views INTEGER NOT NULL DEFAULT 0;

-- Create page_shares table for tracking shares per path
CREATE TABLE IF NOT EXISTS page_shares (
  path TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT (DATE('now')),
  shares INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (path, date)
);