"use client";

import { useState, useEffect, useCallback } from "react";
import type { WidgetLayout } from "./types";
import { DEFAULT_LAYOUT } from "./registry";

const STORAGE_KEY = "moikapy-admin-widget-layout";

export function useWidgetLayout() {
  const [layout, setLayout] = useState<WidgetLayout[]>(DEFAULT_LAYOUT);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WidgetLayout[];
        // Validate: all IDs must exist in registry
        if (Array.isArray(parsed) && parsed.every((w) => typeof w.id === "string" && typeof w.order === "number")) {
          setLayout(parsed);
        }
      }
    } catch {
      // Invalid JSON — stick with defaults
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // localStorage full or unavailable — silently fail
    }
  }, [layout]);

  const update = useCallback((id: string, changes: Partial<WidgetLayout>) => {
    setLayout((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...changes } : w))
    );
  }, []);

  const add = useCallback((id: string) => {
    setLayout((prev) => {
      if (prev.some((w) => w.id === id)) return prev; // Already present
      const maxOrder = prev.reduce((max, w) => Math.max(max, w.order), -1);
      return [...prev, { id, size: "sm" as const, order: maxOrder + 1 }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setLayout((prev) => {
      const filtered = prev.filter((w) => w.id !== id);
      // Re-order to close gaps
      return filtered.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const reorder = useCallback((newLayout: WidgetLayout[]) => {
    setLayout(newLayout.map((w, i) => ({ ...w, order: i })));
  }, []);

  const reset = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  const cycleSize = useCallback((id: string) => {
    setLayout((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const sizes: Array<"sm" | "md" | "lg"> = ["sm", "md", "lg"];
        const idx = sizes.indexOf(w.size);
        return { ...w, size: sizes[(idx + 1) % sizes.length] };
      })
    );
  }, []);

  return { layout, update, add, remove, reorder, reset, cycleSize };
}