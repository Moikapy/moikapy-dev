export interface PostData {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  content: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  readingTime: string;
}

export interface AISuggestion {
  title: string;
  slug: string;
  excerpt: string;
}

export interface BlogViewCounts {
  [slug: string]: { views: number; requests: number };
}

export interface AnalyticsData {
  period: { days: number; from: string; to: string };
  totals: { views: number; requests: number };
  uniqueViews?: number;
  totalShares?: number;
  blogViews: BlogViewCounts;
  topPaths: { path: string; views: number; requests: number }[];
  topReferrers: { referer: string; views: number }[];
  debug?: string;
}

export type EditorMode = "list" | "edit" | "create";
export type AdminTab = "dashboard" | "posts" | "analytics" | "insights";