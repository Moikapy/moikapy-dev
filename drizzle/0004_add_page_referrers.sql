-- Create page_referrers table for tracking where views came from
CREATE TABLE IF NOT EXISTS page_referrers (
  referer TEXT NOT NULL,
  path TEXT NOT NULL,
  date TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (referer, path, date)
);