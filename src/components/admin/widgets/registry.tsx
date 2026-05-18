import {
  Eye,
  TrendingUp,
  Check,
  Globe,
  Share2,
  FileText,
  BarChart3,
  Sparkles,
  Link2,
} from "lucide-react";
import type { WidgetDef, WidgetLayout } from "./types";

export const WIDGET_REGISTRY: WidgetDef[] = [
  // Stat widgets
  { id: "stat-page-views", title: "Page Views", icon: <Eye className="h-4 w-4" />, defaultSize: "sm", category: "stat" },
  { id: "stat-blog-views", title: "Blog Views", icon: <TrendingUp className="h-4 w-4" />, defaultSize: "sm", category: "stat" },
  { id: "stat-published", title: "Published", icon: <Check className="h-4 w-4" />, defaultSize: "sm", category: "stat" },
  { id: "stat-referrers", title: "Referrers", icon: <Globe className="h-4 w-4" />, defaultSize: "sm", category: "stat" },
  { id: "stat-unique", title: "Unique Visitors", icon: <Eye className="h-4 w-4" />, defaultSize: "sm", category: "stat" },
  { id: "stat-shares", title: "Shares", icon: <Share2 className="h-4 w-4" />, defaultSize: "sm", category: "stat" },
  // Content widgets
  { id: "recent-posts", title: "Recent Posts", icon: <FileText className="h-4 w-4" />, defaultSize: "md", category: "content" },
  { id: "top-blog-views", title: "Top Posts by Views", icon: <BarChart3 className="h-4 w-4" />, defaultSize: "md", category: "content" },
  { id: "referrer-chart", title: "Traffic Sources", icon: <Link2 className="h-4 w-4" />, defaultSize: "md", category: "content" },
  { id: "top-pages", title: "Top Pages", icon: <BarChart3 className="h-4 w-4" />, defaultSize: "md", category: "content" },
  // AI widgets
  { id: "ai-insights", title: "AI Insights", icon: <Sparkles className="h-4 w-4" />, defaultSize: "lg", category: "ai" },
];

export const WIDGET_MAP = new Map(WIDGET_REGISTRY.map((w) => [w.id, w]));

export function getWidgetDef(id: string): WidgetDef | undefined {
  return WIDGET_MAP.get(id);
}

export const DEFAULT_LAYOUT: WidgetLayout[] = [
  { id: "stat-page-views", size: "sm", order: 0 },
  { id: "stat-blog-views", size: "sm", order: 1 },
  { id: "stat-published", size: "sm", order: 2 },
  { id: "stat-referrers", size: "sm", order: 3 },
  { id: "stat-unique", size: "sm", order: 4 },
  { id: "stat-shares", size: "sm", order: 5 },
  { id: "recent-posts", size: "md", order: 6 },
  { id: "top-blog-views", size: "md", order: 7 },
  { id: "referrer-chart", size: "md", order: 8 },
  { id: "top-pages", size: "md", order: 9 },
  { id: "ai-insights", size: "lg", order: 10 },
];

export const STAT_ACCENTS: Record<string, string> = {
  "stat-page-views": "primary",
  "stat-blog-views": "emerald",
  "stat-published": "blue",
  "stat-referrers": "amber",
  "stat-unique": "purple",
  "stat-shares": "rose",
};