import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

let _db: ReturnType<typeof drizzle> | null = null;

export type Database = ReturnType<typeof drizzle>;

/**
 * Creates a local SQLite database for development.
 * Auto-runs migrations and seeds on first use.
 * Data persists in .local/dev.db so it survives restarts.
 */
export function getLocalDb() {
  if (_db) return _db;

  const dir = join(process.cwd(), ".local");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const dbPath = join(dir, "dev.db");
  const sqlite = new Database(dbPath);

  // Enable WAL for better performance
  sqlite.pragma("journal_mode = WAL");

  // Auto-create schema
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      cover_image TEXT DEFAULT '',
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed the hello-world post if table is empty
  const count = sqlite.prepare("SELECT COUNT(*) as c FROM posts").get() as { c: number };
  if (count.c === 0) {
    sqlite.exec(`
      INSERT INTO posts (slug, title, excerpt, content, tags, published, created_at, updated_at)
      VALUES (
        'hello-world',
        'Hello World — Welcome to moikapy.dev',
        'This is the first post on my new blog. AI engineering, gaming, and everything in between.',
        '# Hey there! 👋

Welcome to **moikapy.dev** — my little corner of the internet where I will be writing about AI engineering, gaming, and the projects I am building.

## What to expect

- **AI Engineering** — LLMs, agents, RAG pipelines, fine-tuning, and everything I am shipping.
- **Gaming** — Game dev experiments, modding, and the games I am playing.
- **Open Source** — Project writeups, release notes, and deep dives into things I am contributing to.

Stay tuned — more posts coming soon.',
        '["meta", "intro"]',
        1,
        '2026-04-08T00:00:00.000Z',
        '2026-04-08T00:00:00.000Z'
      );
    `);
  }

  _db = drizzle(sqlite, { schema });
  return _db;
}