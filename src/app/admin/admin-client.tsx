"use client";

import { TiptapEditor } from "@/components/tiptap-editor";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PostData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  readingTime: string;
}

type EditorMode = "list" | "edit" | "create";

export function AdminClient() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [mode, setMode] = useState<EditorMode>("list");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [editSlug, setEditSlug] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formPublished, setFormPublished] = useState(false);

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
  }, [fetchPosts]);

  function resetForm() {
    setEditSlug("");
    setFormTitle("");
    setFormExcerpt("");
    setFormContent("");
    setFormTags("");
    setFormPublished(false);
  }

  function startCreate() {
    resetForm();
    setMode("create");
  }

  function startEdit(post: PostData) {
    setEditSlug(post.slug);
    setFormTitle(post.title);
    setFormExcerpt(post.excerpt);
    setFormContent(post.content);
    setFormTags(post.tags.join(", "));
    setFormPublished(post.published);
    setMode("edit");
  }

  async function handleSave() {
    setSaving(true);
    const tags = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const body = {
      slug: editSlug || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      title: formTitle,
      excerpt: formExcerpt,
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
      <div className="mx-auto max-w-4xl px-6 py-8">
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
                <CardContent className="flex items-center justify-between py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{post.title}</h3>
                      {post.published ? (
                        <Badge variant="default" className="text-[10px]">Published</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      /{post.slug} · {post.readingTime} · {new Date(post.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
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
    <div className="mx-auto max-w-3xl px-6 py-8">
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
            value={mode === "create" ? (editSlug || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) : editSlug}
            onChange={(e) => mode === "create" && setEditSlug(e.target.value)}
            readOnly={mode === "edit"}
            placeholder="my-awesome-post"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            disabled={mode === "edit"}
          />
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

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Content</label>
          <TiptapEditor value={formContent} onChange={setFormContent} />
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

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving || !formTitle || !formContent}>
            {saving ? "Saving..." : mode === "create" ? "Create Post" : "Save Changes"}
          </Button>
          <Button variant="ghost" onClick={() => { resetForm(); setMode("list"); }}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}