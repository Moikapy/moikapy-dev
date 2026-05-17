-- Performance indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(date);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_referrers_date ON page_referrers(date);
CREATE INDEX IF NOT EXISTS idx_page_referrers_referer ON page_referrers(referer);
CREATE INDEX IF NOT EXISTS idx_page_referrers_date_path ON page_referrers(date, path);

-- Reactions lookup optimization
CREATE INDEX IF NOT EXISTS idx_reactions_visitor_hash ON reactions(visitor_hash);