"use client";

import { TiptapEditor } from "@/components/tiptap-editor";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  FileText,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Pencil,
  Trash2,
  Plus,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Globe,
  Link2,
  Check,
  AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

interface PostData {
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

interface AISuggestion {
  title: string;
  slug: string;
  excerpt: string;
}

interface BlogViewCounts {
  [slug: string]: { views: number; requests: number };
}

interface AnalyticsData {
  period: { days: number; from: string; to: string };
  totals: { views: number; requests: number };
  blogViews: BlogViewCounts;
  topPaths: { path: string; views: number; requests: number }[];
  topReferrers: { referer: string; views: number }[];
  debug?: string;
}

type EditorMode = "list" | "edit" | "create";
type AdminTab = "dashboard" | "posts" | "analytics";

// ── Helpers ───────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

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

// ── Mini Bar Chart (CSS-only) ─────────────────────────────────

function MiniBarChart({
  data,
  maxBars = 10,
  height = 80,
}: {
  data: { label: string; value: number }[];
  maxBars?: number;
  height?: number;
}) {
  const sliced = data.slice(0, maxBars);
  const maxVal = Math.max(...sliced.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {sliced.map((d, i) => {
        const pct = (d.value / maxVal) * 100;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end min-w-0"
            title={`${d.label}: ${d.value.toLocaleString()}`}
          >
            <div
              className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors"
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Referrer Bar ──────────────────────────────────────────────

function ReferrerBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 truncate text-foreground/80 shrink-0" title={label}>
        {label}
      </span>
      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/70 rounded-full transition-all"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export function AdminClient() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [mode, setMode] = useState<EditorMode>("list");
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [editSlug, setEditSlug] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formPublished, setFormPublished] = useState(false);

  // AI suggestion state
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI format state
  const [aiFormatting, setAiFormatting] = useState(false);
  const [aiFormatError, setAiFormatError] = useState<string | null>(null);
  const [formatProgress, setFormatProgress] = useState("");

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts?all=1");
      if (res.ok) {
        const data: PostData[] = await res.json();
        setPosts(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (days: number) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/analytics/views?days=${days}`);
      if (res.ok) {
        const data: AnalyticsData = await res.json();
        setAnalytics(data);
      }
    } catch {
      // silently fail
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch analytics on dashboard and analytics tabs
  useEffect(() => {
    if (tab === "dashboard" || tab === "analytics") {
      fetchAnalytics(analyticsDays);
    }
  }, [tab, analyticsDays, fetchAnalytics]);

  const existingSlugs = useMemo(() => new Set(posts.map((p) => p.slug)), [posts]);

  const currentSlug = mode === "create" ? (editSlug || slugify(formTitle)) : editSlug;
  const slugCollision = mode === "create" && currentSlug && existingSlugs.has(currentSlug);

  // Derived stats for dashboard
  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;
  const totalBlogViews = Object.values(analytics?.blogViews ?? {}).reduce(
    (sum, v) => sum + v.views,
    0
  );

  function resetForm() {
    setEditSlug("");
    setFormTitle("");
    setFormExcerpt("");
    setFormCoverImage("");
    setFormContent("");
    setFormTags("");
    setFormPublished(false);
    setAiSuggestion(null);
    setAiError(null);
  }

  function startCreate() {
    resetForm();
    setMode("create");
  }

  function startEdit(post: PostData) {
    setEditSlug(post.slug);
    setFormTitle(post.title);
    setFormExcerpt(post.excerpt);
    setFormCoverImage((post as PostData & { coverImage?: string }).coverImage ?? "");
    setFormContent(post.content);
    setFormTags(post.tags.join(", "));
    setFormPublished(post.published);
    setAiSuggestion(null);
    setAiError(null);
    setMode("edit");
  }

  async function handleAiSuggest() {
    if (!formContent.trim()) {
      setAiError("Write some content first");
      return;
    }
    setAiSuggesting(true);
    setAiError(null);
    setAiSuggestion(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: formContent, title: formTitle || undefined }),
      });
      if (!res.ok) {
        const err: { error?: string } = await res.json();
        setAiError(err.error || "Failed to get suggestion");
        return;
      }
      const suggestion: AISuggestion = await res.json();
      setAiSuggestion(suggestion);
    } catch {
      setAiError("Network error");
    } finally {
      setAiSuggesting(false);
    }
  }

  function applySuggestion(field: "title" | "slug" | "excerpt") {
    if (!aiSuggestion) return;
    if (field === "title") setFormTitle(aiSuggestion.title);
    if (field === "slug") setEditSlug(aiSuggestion.slug);
    if (field === "excerpt") setFormExcerpt(aiSuggestion.excerpt);
  }

  async function handleFormatContent() {
    if (!formContent.trim()) return;
    setAiFormatting(true);
    setAiFormatError(null);
    setFormatProgress("Formatting...");
    try {
      const res = await fetch("/api/ai/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: formContent }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as { error?: string };
        setAiFormatError(data.error || "Format failed");
        setAiFormatting(false);
        setFormatProgress("");
        return;
      }
      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let result = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
          const displayResult = result
            .replace(/\n\n⏳ _Continuing formatting\.\.\.\n/g, "")
            .replace(/\n\n⚠️ _Formatting may be incomplete.*_/, "")
            .replace(/\n\n❌ _Format error.*_/, "")
            .replace(/\n\n⏱️ _Format timed out.*_/, "");
          setFormContent(displayResult);
        }
        const cleanResult = result
          .replace(/\n\n⏳ _Continuing formatting\.\.\.\n/g, "")
          .replace(/\n\n⚠️ _Formatting may be incomplete[^]*_/, "")
          .replace(/\n\n❌ _Format error[^]*_/, "")
          .replace(/\n\n⏱️ _Format timed out[^]*_/, "");
        if (cleanResult.trim()) setFormContent(cleanResult.trim());
      }
    } catch {
      setAiFormatError("Network error. Try again.");
      setAiFormatting(false);
      setFormatProgress("");
    }
    setAiFormatting(false);
    setFormatProgress("");
  }

  async function handleSave() {
    setSaving(true);
    const tags = formTags.split(",").map((t) => t.trim()).filter(Boolean);
    const body = {
      slug: editSlug || slugify(formTitle),
      title: formTitle,
      excerpt: formExcerpt,
      coverImage: formCoverImage || undefined,
      content: formContent,
      tags,
      published: formPublished,
    };
    try {
      if (mode === "create") {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          alert(err.error || "Failed to create post");
          return;
        }
        setEditSlug(body.slug);
        setMode("edit");
      } else {
        const res = await fetch(`/api/posts/${editSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          alert("Failed to update post");
          return;
        }
      }
      await fetchPosts();
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
      if (res.ok) {
        await fetchPosts();
        if (editSlug === slug) {
          resetForm();
          setMode("list");
        }
      }
    } catch {
      alert("Failed to delete post");
    }
  }

  // ── Sidebar Nav ────────────────────────────────────────────

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "posts", label: "Posts", icon: <FileText className="h-4 w-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  // ── Dashboard View ────────────────────────────────────────

  function renderDashboard() {
    const recentPosts = [...posts]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    const blogPostViews = posts
      .map((post) => ({
        ...post,
        views: analytics?.blogViews[post.slug]?.views ?? 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const topReferrers = analytics?.topReferrers?.slice(0, 5) ?? [];
    const maxRefViews = topReferrers.length > 0 ? topReferrers[0].views : 1;

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Page Views</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(analytics?.totals.views ?? 0)}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Last {analyticsDays} days</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Blog Views</p>
                  <p className="text-2xl font-bold mt-1">{formatNumber(totalBlogViews)}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Post-specific views</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Published</p>
                  <p className="text-2xl font-bold mt-1">{publishedCount}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">{draftCount} draft{draftCount !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Referrers</p>
                  <p className="text-2xl font-bold mt-1">{topReferrers.length}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">Traffic sources</p>
            </CardContent>
          </Card>
        </div>

        {/* Two column: Recent Posts + Top Blog Views */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Posts */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent Posts</CardTitle>
                <button
                  onClick={() => setTab("posts")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentPosts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No posts yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {recentPosts.map((post) => (
                    <div
                      key={post.slug}
                      className="flex items-start gap-3 group cursor-pointer"
                      onClick={() => startEdit(post)}
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
                        <p className="text-[11px] text-muted-foreground">
                          {timeAgo(post.updatedAt)}
                        </p>
                      </div>
                      <Badge variant={post.published ? "default" : "secondary"} className="text-[9px] shrink-0 mt-0.5">
                        {post.published ? "Live" : "Draft"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Blog Posts by Views */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Top Posts by Views</CardTitle>
                <button
                  onClick={() => setTab("analytics")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  Details <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {blogPostViews.every((p) => p.views === 0) ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No blog post views yet</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">Views will appear as visitors read your posts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blogPostViews.filter((p) => p.views > 0).map((post) => {
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
            </CardContent>
          </Card>
        </div>

        {/* Top Referrers + Top Pages */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {topReferrers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No referrer data yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {topReferrers.map((ref) => (
                    <ReferrerBar
                      key={ref.referer}
                      label={ref.referer === "direct" ? "Direct" : ref.referer}
                      value={ref.views}
                      max={maxRefViews}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Top Pages</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {(!analytics?.topPaths || analytics.topPaths.length === 0) ? (
                <p className="text-xs text-muted-foreground">No page data yet.</p>
              ) : (
                <MiniBarChart
                  data={analytics.topPaths.slice(0, 10).map((p) => ({
                    label: p.path,
                    value: p.views,
                  }))}
                  height={80}
                />
              )}
              <div className="mt-2 space-y-1">
                {analytics?.topPaths.slice(0, 5).map((p) => (
                  <div key={p.path} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground truncate font-mono">{p.path}</span>
                    <span className="tabular-nums shrink-0 ml-2">{formatNumber(p.views)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug */}
        {analytics?.debug && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {analytics.debug}
          </div>
        )}
      </div>
    );
  }

  // ── Analytics View ─────────────────────────────────────────

  function renderAnalytics() {
    const blogPosts = posts
      .map((post) => ({
        ...post,
        views: analytics?.blogViews[post.slug]?.views ?? 0,
      }))
      .sort((a, b) => b.views - a.views);

    const maxPostViews = blogPosts[0]?.views || 1;
    const topReferrers = analytics?.topReferrers ?? [];
    const maxRefViews = topReferrers[0]?.views || 1;

    return (
      <div className="space-y-6">
        {/* Time range selector */}
        <div className="flex items-center gap-2">
          {[
            { days: 7, label: "7 days" },
            { days: 30, label: "30 days" },
            { days: 90, label: "90 days" },
          ].map(({ days: d, label }) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setAnalyticsDays(d);
                setAnalytics(null);
                fetchAnalytics(d);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                analyticsDays === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
          {analyticsLoading && (
            <span className="text-xs text-muted-foreground">Loading…</span>
          )}
        </div>

        {analytics?.debug && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {analytics.debug}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Page Views</p>
              <p className="text-2xl font-bold mt-1">{formatNumber(analytics?.totals.views ?? 0)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Last {analyticsDays} days</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Blog Post Views</p>
              <p className="text-2xl font-bold mt-1">{formatNumber(totalBlogViews)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{Object.keys(analytics?.blogViews ?? {}).length} posts with views</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Traffic Sources</p>
              <p className="text-2xl font-bold mt-1">{topReferrers.length}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Unique referrers</p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Blog post views — bar chart style */}
        <div>
          <h3 className="text-sm font-semibold mb-4">Blog Post Views</h3>
          {blogPosts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No posts yet.</p>
          ) : blogPosts.every((p) => p.views === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No blog post views in this period</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Views will appear as visitors read your posts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blogPosts.filter((p) => p.views > 0).map((post) => {
                const pct = (post.views / maxPostViews) * 100;
                return (
                  <div
                    key={post.slug}
                    className="group cursor-pointer"
                    onClick={() => startEdit(post)}
                  >
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate group-hover:text-primary transition-colors">
                          {post.title}
                        </span>
                        <Badge variant={post.published ? "default" : "secondary"} className="text-[9px] shrink-0">
                          {post.published ? "Live" : "Draft"}
                        </Badge>
                      </div>
                      <span className="tabular-nums font-medium shrink-0 ml-3">{post.views.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full group-hover:bg-primary transition-colors"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Two column: Top Paths + Referrers */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold mb-4">Top Pages</h3>
            {analytics && analytics.topPaths.length > 0 ? (
              <div className="space-y-1">
                {analytics.topPaths.slice(0, 15).map((item, i) => (
                  <div key={item.path} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground tabular-nums w-5 shrink-0">{i + 1}</span>
                      <span className="font-mono truncate">{item.path}</span>
                    </div>
                    <span className="tabular-nums shrink-0 ml-2 font-medium">{formatNumber(item.views)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No data yet.</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4">Referrers</h3>
            {topReferrers.length > 0 ? (
              <div className="space-y-2.5">
                {topReferrers.map((item) => (
                  <ReferrerBar
                    key={item.referer}
                    label={item.referer === "direct" ? "Direct" : item.referer}
                    value={item.views}
                    max={maxRefViews}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No referrer data yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Posts View ─────────────────────────────────────────────

  function renderPosts() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Posts</h2>
          <Button onClick={startCreate} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Post
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">No posts yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Create your first post to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <Card key={post.slug} className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  {/* Status icon */}
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    {post.published ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium truncate">{post.title}</h3>
                      <Badge variant={post.published ? "default" : "secondary"} className="text-[9px] shrink-0">
                        {post.published ? "Live" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      /{post.slug} · {post.readingTime} · {timeAgo(post.updatedAt)}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] text-muted-foreground/70 bg-muted/50 rounded px-1.5 py-0.5">
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground/50">+{post.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(post)} className="h-8 w-8 p-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(post.slug)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Editor View (create / edit) ─────────────────────────────

  if (mode === "edit" || mode === "create") {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "New Post" : "Edit Post"}
          </h1>
          <Button variant="ghost" size="sm" onClick={() => { resetForm(); setMode("list"); }}>
            ← Back
          </Button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="My Awesome Post"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Slug {mode === "edit" && <span className="text-muted-foreground">(read-only)</span>}
            </label>
            <input
              type="text"
              value={currentSlug}
              onChange={(e) => mode === "create" && setEditSlug(e.target.value)}
              readOnly={mode === "edit"}
              placeholder="my-awesome-post"
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                slugCollision ? "border-destructive ring-1 ring-destructive" : "border-input"
              }`}
              disabled={mode === "edit"}
            />
            {slugCollision && (
              <p className="mt-1 text-xs text-destructive font-medium">
                ⚠️ Slug &quot;{currentSlug}&quot; is already taken
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Excerpt</label>
            <textarea
              value={formExcerpt}
              onChange={(e) => setFormExcerpt(e.target.value)}
              placeholder="A brief description of this post..."
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Cover Image URL</label>
            <input
              type="url"
              value={formCoverImage}
              onChange={(e) => setFormCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {formCoverImage && (
              <img src={formCoverImage} alt="Cover preview" className="mt-2 rounded-md max-h-40 object-cover" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Content</label>
            <TiptapEditor
              value={formContent}
              onChange={setFormContent}
              enableDictation
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="ai, gaming, llm"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={formPublished}
              onClick={() => setFormPublished(!formPublished)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formPublished ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formPublished ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <label className="text-sm font-medium">
              {formPublished ? "Published" : "Draft"}
            </label>
          </div>

          <Separator />

          {/* AI Tools */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">AI Tools</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFormatContent}
                  disabled={aiFormatting || !formContent.trim()}
                >
                  {aiFormatting ? (formatProgress || "Formatting...") : "📝 Format"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAiSuggest}
                  disabled={aiSuggesting || !formContent.trim()}
                >
                  {aiSuggesting ? "Thinking..." : "✨ Suggest"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              <strong>Format</strong> — fix paragraphs, headings, punctuation from voice dictation.{" "}
              <strong>Suggest</strong> — generate title, slug & excerpt.
            </p>

            {(aiError || aiFormatError) && (
              <p className="text-xs text-destructive mb-2">{aiError || aiFormatError}</p>
            )}

            {aiSuggestion && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground w-12 pt-0.5 shrink-0">Title</span>
                  <button
                    type="button"
                    onClick={() => applySuggestion("title")}
                    className="flex-1 text-left text-sm rounded-md border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1.5 hover:bg-primary/10 hover:border-primary/60 transition-colors"
                    title="Click to apply"
                  >
                    {aiSuggestion.title}
                  </button>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground w-12 pt-0.5 shrink-0">Slug</span>
                  <button
                    type="button"
                    onClick={() => applySuggestion("slug")}
                    className="flex-1 text-left text-sm rounded-md border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1.5 hover:bg-primary/10 hover:border-primary/60 transition-colors"
                    title="Click to apply"
                  >
                    {aiSuggestion.slug}
                  </button>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground w-12 pt-0.5 shrink-0">Excerpt</span>
                  <button
                    type="button"
                    onClick={() => applySuggestion("excerpt")}
                    className="flex-1 text-left text-sm rounded-md border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1.5 hover:bg-primary/10 hover:border-primary/60 transition-colors"
                    title="Click to apply"
                  >
                    {aiSuggestion.excerpt}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Click any suggestion to apply it</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || !formTitle || !formContent || !!slugCollision}>
              {saving ? "Saving..." : mode === "create" ? "Create Post" : "Save Changes"}
            </Button>
            <Button variant="ghost" onClick={() => { resetForm(); setMode("list"); }}>
              Cancel
            </Button>
            {slugCollision && (
              <span className="text-xs text-destructive">Fix the slug collision before saving</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main Layout (sidebar + content) ────────────────────────

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden sm:flex w-56 flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold">moikapy.dev</h1>
          <p className="text-[11px] text-muted-foreground">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                tab === id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
            className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around py-2 px-4">
        {navItems.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[11px] transition-colors ${
              tab === id
                ? "text-primary font-medium"
                : "text-muted-foreground"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/admin/login";
          }}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8 overflow-auto">
        {/* Mobile header */}
        <div className="sm:hidden flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold">Admin</h1>
        </div>

        {tab === "dashboard" && renderDashboard()}
        {tab === "posts" && renderPosts()}
        {tab === "analytics" && renderAnalytics()}
      </main>
    </div>
  );
}