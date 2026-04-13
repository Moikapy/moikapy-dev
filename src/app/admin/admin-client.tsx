"use client";

import { TiptapEditor } from "@/components/tiptap-editor";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

type EditorMode = "list" | "edit" | "create";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function AdminClient() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [mode, setMode] = useState<EditorMode>("list");
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

  // Analytics state
  const [blogViews, setBlogViews] = useState<BlogViewCounts>({});

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

  useEffect(() => {
    fetchPosts();
    // Fetch view counts
    fetch("/api/analytics/views?days=30")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (data && typeof data === 'object' && 'blogViews' in data) {
          setBlogViews((data as { blogViews: BlogViewCounts }).blogViews);
        }
      })
      .catch(() => {/* analytics not critical */});
  }, [fetchPosts]);

  // Set of existing slugs for collision detection
  const existingSlugs = useMemo(() => new Set(posts.map((p) => p.slug)), [posts]);

  // The current slug value shown in the field
  const currentSlug = mode === "create"
    ? (editSlug || slugify(formTitle))
    : editSlug;

  const slugCollision = mode === "create" && currentSlug && existingSlugs.has(currentSlug);

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
        body: JSON.stringify({
          content: formContent,
          title: formTitle || undefined,
        }),
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

  async function handleSave() {
    setSaving(true);
    const tags = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
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

  // ── List View ─────────────────────────────────────────────
  if (mode === "list") {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin — Posts</h1>
          <div className="flex items-center gap-2">
            <Button onClick={startCreate} size="sm">
              + New Post
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/admin/login";
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet. Create your first one!</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.slug} className="transition-colors hover:border-primary/40">
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium truncate">{post.title}</h3>
                      {post.published ? (
                        <Badge variant="default" className="text-[10px]">Published</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      /{post.slug} · {post.readingTime} · {new Date(post.updatedAt).toLocaleDateString()}
                      {blogViews[post.slug] && (
                        <span className="text-muted-foreground/60"> · {blogViews[post.slug].views.toLocaleString()} views</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(post)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(post.slug)}
                    >
                      Delete
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

  // ── Editor View (create / edit) ───────────────────────────
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
        {/* Title */}
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

        {/* Slug (editable on create, display on edit) */}
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
              ⚠️ Slug &quot;{currentSlug}&quot; is already taken — change the slug or use the AI suggestion
            </p>
          )}
        </div>

        {/* Excerpt */}
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

        {/* Cover Image URL */}
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

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Content</label>
          <TiptapEditor
            value={formContent}
            onChange={setFormContent}
            enableDictation
          />
        </div>

        {/* Tags */}
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

        {/* Published toggle */}
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

        {/* AI Suggestions */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">AI Suggestions</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAiSuggest}
              disabled={aiSuggesting || !formContent.trim()}
            >
              {aiSuggesting ? "Thinking..." : "✨ Suggest"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Uses <code className="text-[11px] bg-muted px-1 rounded">glm-5.1</code> to suggest title, slug, and excerpt based on your content.
          </p>

          {aiError && (
            <p className="text-xs text-destructive mb-2">{aiError}</p>
          )}

          {aiSuggestion && (
            <div className="space-y-2">
              {/* Suggested Title */}
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
              {/* Suggested Slug */}
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
              {/* Suggested Excerpt */}
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

        {/* Actions */}
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