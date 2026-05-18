-- Migration 0008: Add author column to posts and auto_write_daily flag
ALTER TABLE posts ADD COLUMN author TEXT NOT NULL DEFAULT 'Moikapy';
ALTER TABLE posts ADD COLUMN auto_written INTEGER NOT NULL DEFAULT 0;