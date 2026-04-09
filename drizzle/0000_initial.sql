CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Seed: initial hello-world post
INSERT OR IGNORE INTO posts (slug, title, excerpt, content, tags, published, created_at, updated_at)
VALUES (
  'hello-world',
  'Hello World — Welcome to moikapy.dev',
  'This is the first post on my new blog. AI engineering, gaming, and everything in between.',
  '# Hey there! 👋

Welcome to **moikapy.dev** — my little corner of the internet where I''ll be writing about AI engineering, gaming, and the projects I''m building.

## What to expect

- **AI Engineering** — LLMs, agents, RAG pipelines, fine-tuning, and everything I''m shipping.
- **Gaming** — Game dev experiments, modding, and the games I''m playing.
- **Open Source** — Project writeups, release notes, and deep dives into things I''m contributing to.

## The stack

This site is built with **Next.js**, **Tailwind CSS**, and **shadcn/ui**, deployed on **Cloudflare Pages**. Blog posts are stored in **Cloudflare D1**, and the feed is available via **RSS** and **Nostr**.

Stay tuned — more posts coming soon.',
  '["meta", "intro"]',
  1,
  '2026-04-08T00:00:00.000Z',
  '2026-04-08T00:00:00.000Z'
);