import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  coverImage: text("cover_image").default(""),
  content: text("content").notNull(),
  tags: text("tags").notNull().default("[]"), // JSON array stored as text
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  author: text("author").notNull().default("Moikapy"),
  autoWritten: integer("auto_written", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const reactions = sqliteTable("reactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postSlug: text("post_slug").notNull(),
  emoji: text("emoji").notNull(),
  visitorHash: text("visitor_hash").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const pageViews = sqliteTable("page_views", {
  path: text("path").notNull(),
  date: text("date").notNull(),
  views: integer("views").notNull().default(0),
  uniqueViews: integer("unique_views").notNull().default(0),
});

export const pageReferrers = sqliteTable("page_referrers", {
  referer: text("referer").notNull(),
  path: text("path").notNull(),
  date: text("date").notNull(),
  views: integer("views").notNull().default(0),
});

export const postTags = sqliteTable("post_tags", {
  slug: text("slug").notNull().references(() => posts.slug, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
});

export const pageShares = sqliteTable("page_shares", {
  path: text("path").notNull(),
  date: text("date").notNull().$defaultFn(() => new Date().toISOString().split("T")[0]),
  shares: integer("shares").notNull().default(0),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Reaction = typeof reactions.$inferSelect;
export type PostTag = typeof postTags.$inferSelect;