"use client";

import type { WidgetLayout } from "./types";
import { WIDGET_MAP, STAT_ACCENTS } from "./registry";
import { StatWidget, ContentWidget } from "./stat-widget";
import { GripVertical } from "lucide-react";
import {
  Eye,
  TrendingUp,
  Check,
  Globe,
  Share2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PostData, AnalyticsData } from "@/app/admin/admin-client-types";
import type { CommunityInsights } from "@/lib/community-insights";

// We need the same helpers — import or inline
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface WidgetRendererProps {
  widget: WidgetLayout;
  posts: PostData[];
  analytics: AnalyticsData | null;
  insights: CommunityInsights | null;
  analyticsDays: number;
  totalBlogViews: number;
  publishedCount: number;
  draftCount: number;
  isDragging: boolean;
  isDragOver: boolean;
  onRemove: () => void;
  onCycleSize: () => void;
  onNavigatePosts?: () => void;
  onNavigateAnalytics?: () => void;
  onStartEdit?: (post: PostData) => void;
}

export function WidgetRenderer({
  widget,
  posts,
  analytics,
  insights,
  analyticsDays,
  totalBlogViews,
  publishedCount,
  draftCount,
  isDragging,
  isDragOver,
  onRemove,
  onCycleSize,
  onNavigatePosts,
  onNavigateAnalytics,
  onStartEdit,
}: WidgetRendererProps) {
  const def = WIDGET_MAP.get(widget.id);
  if (!def) return null;

  const dragHandle = (
    <div className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors">
      <GripVertical className="h-3.5 w-3.5" />
    </div>
  );

  // Stat widgets
  if (widget.id.startsWith("stat-")) {
    return renderStatWidget(widget.id);
  }

  // Content / AI widgets
  switch (widget.id) {
    case "recent-posts":
      return renderRecentPosts();
    case "top-blog-views":
      return renderTopBlogViews();
    case "referrer-chart":
      return renderReferrerChart();
    case "top-pages":
      return renderTopPages();
    case "ai-insights":
      return renderAiInsights();
    default:
      return null;
  }

  // ── Stat Widgets ──────────────────────────────────────

  function renderStatWidget(id: string) {
    const accent = STAT_ACCENTS[id] ?? "primary";
    const config: Record<string, { title: string; value: string; subtitle: string; icon: React.ReactNode }> = {
      "stat-page-views": {
        title: "Page Views",
        value: formatNumber(analytics?.totals.views ?? 0),
        subtitle: `Last ${analyticsDays} days`,
        icon: <Eye className="h-4 w-4" />,
      },
      "stat-blog-views": {
        title: "Blog Views",
        value: formatNumber(totalBlogViews),
        subtitle: "Post-specific views",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      "stat-published": {
        title: "Published",
        value: String(publishedCount),
        subtitle: `${draftCount} draft${draftCount !== 1 ? "s" : ""}`,
        icon: <Check className="h-4 w-4" />,
      },
      "stat-referrers": {
        title: "Referrers",
        value: String(analytics?.topReferrers?.length ?? 0),
        subtitle: "Traffic sources",
        icon: <Globe className="h-4 w-4" />,
      },
      "stat-unique": {
        title: "Unique Visitors",
        value: formatNumber(analytics?.uniqueViews ?? 0),
        subtitle: `Last ${analyticsDays} days`,
        icon: <Eye className="h-4 w-4" />,
      },
      "stat-shares": {
        title: "Shares",
        value: formatNumber(analytics?.totalShares ?? 0),
        subtitle: "Post shares",
        icon: <Share2 className="h-4 w-4" />,
      },
    };

    const data = config[id];
    if (!data) return null;

    return (
      <StatWidget
        title={data.title}
        value={data.value}
        subtitle={data.subtitle}
        icon={data.icon}
        accent={accent}
        isDragging={isDragging}
        isDragOver={isDragOver}
        onRemove={onRemove}
        onCycleSize={onCycleSize}
        dragHandle={dragHandle}
      />
    );
  }

  // ── Content Widgets ────────────────────────────────────

  function renderRecentPosts() {
    const recentPosts = [...posts]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return (
      <ContentWidget
        title="Recent Posts"
        size={widget.size}
        isDragging={isDragging}
        isDragOver={isDragOver}
        onRemove={onRemove}
        onCycleSize={onCycleSize}
        dragHandle={dragHandle}
        headerRight={
          onNavigatePosts ? (
            <button
              onClick={onNavigatePosts}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          ) : undefined
        }
      >
        {recentPosts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="space-y-2.5">
            {recentPosts.map((post) => (
              <div
                key={post.slug}
                className="flex items-start gap-3 group cursor-pointer"
                onClick={() => onStartEdit?.(post)}
              >
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  {post.published ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {post.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{timeAgo(post.updatedAt)}</p>
                </div>
                <Badge variant={post.published ? "default" : "secondary"} className="text-[9px] shrink-0 mt-0.5">
                  {post.published ? "Live" : "Draft"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </ContentWidget>
    );
  }

  function renderTopBlogViews() {
    const blogPostViews = posts
      .map((post) => ({
        ...post,
        views: analytics?.blogViews[post.slug]?.views ?? 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return (
      <ContentWidget
        title="Top Posts by Views"
        size={widget.size}
        isDragging={isDragging}
        isDragOver={isDragOver}
        onRemove={onRemove}
        onCycleSize={onCycleSize}
        dragHandle={dragHandle}
        headerRight={
          onNavigateAnalytics ? (
            <button
              onClick={onNavigateAnalytics}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Details <ArrowRight className="h-3 w-3" />
            </button>
          ) : undefined
        }
      >
        {blogPostViews.every((p) => p.views === 0) ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No blog post views yet</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Views will appear as visitors read your posts
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blogPostViews
              .filter((p) => p.views > 0)
              .map((post) => {
                const maxViews = blogPostViews[0]?.views || 1;
                const pct = (post.views / maxViews) * 100;
                return (
                  <div key={post.slug} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="truncate font-medium group-hover:text-primary transition-colors">
                        {post.title}
                      </span>
                      <span className="tabular-nums text-muted-foreground shrink-0 ml-2">
                        {post.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </ContentWidget>
    );
  }

  function renderReferrerChart() {
    const topReferrers = analytics?.topReferrers?.slice(0, 5) ?? [];
    const maxRefViews = topReferrers.length > 0 ? topReferrers[0].views : 1;

    return (
      <ContentWidget
        title="Traffic Sources"
        size={widget.size}
        isDragging={isDragging}
        isDragOver={isDragOver}
        onRemove={onRemove}
        onCycleSize={onCycleSize}
        dragHandle={dragHandle}
      >
        {topReferrers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No referrer data yet.</p>
        ) : (
          <div className="space-y-2.5">
            {topReferrers.map((ref) => {
              const pct = (ref.views / maxRefViews) * 100;
              return (
                <div key={ref.referer} className="flex items-center gap-3 text-sm">
                  <span className="w-28 truncate text-foreground/80 shrink-0" title={ref.referer}>
                    {ref.referer === "direct" ? "Direct" : ref.referer}
                  </span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                    {ref.views.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </ContentWidget>
    );
  }

  function renderTopPages() {
    return (
      <ContentWidget
        title="Top Pages"
        size={widget.size}
        isDragging={isDragging}
        isDragOver={isDragOver}
        onRemove={onRemove}
        onCycleSize={onCycleSize}
        dragHandle={dragHandle}
      >
        {(!analytics?.topPaths || analytics.topPaths.length === 0) ? (
          <p className="text-xs text-muted-foreground">No page data yet.</p>
        ) : (
          <>
            {/* Mini bar chart */}
            <div className="flex items-end gap-1 h-20">
              {analytics.topPaths.slice(0, 10).map((p, i) => {
                const maxVal = Math.max(...analytics.topPaths.slice(0, 10).map((d) => d.views), 1);
                const pct = (p.views / maxVal) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end min-w-0"
                    title={`${p.path}: ${p.views.toLocaleString()}`}
                  >
                    <div
                      className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 space-y-1">
              {analytics.topPaths.slice(0, 5).map((p) => (
                <div key={p.path} className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground truncate font-mono">{p.path}</span>
                  <span className="tabular-nums shrink-0 ml-2">{formatNumber(p.views)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </ContentWidget>
    );
  }

  function renderAiInsights() {
    return (
      <ContentWidget
        title="AI Insights"
        size={widget.size}
        isDragging={isDragging}
        isDragOver={isDragOver}
        onRemove={onRemove}
        onCycleSize={onCycleSize}
        dragHandle={dragHandle}
      >
        {!insights ? (
          <p className="text-xs text-muted-foreground">Loading insights...</p>
        ) : (
          <div className="space-y-4">
            {/* Trending tags */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Trending Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {insights.trending_tags.slice(0, 8).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Spotlight */}
            {insights.spotlight_tag && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Spotlight
                </p>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  {insights.spotlight_tag}
                </Badge>
              </div>
            )}

            {/* Content advice */}
            {insights.content_advice && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Content Strategy
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {insights.content_advice}
                </p>
              </div>
            )}

            {/* Trending posts */}
            {insights.trending_slugs.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Trending Posts
                </p>
                <div className="space-y-1">
                  {insights.trending_slugs.slice(0, 3).map((slug) => (
                    <p key={slug} className="text-sm text-foreground/70 font-mono">
                      /{slug}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ContentWidget>
    );
  }
}