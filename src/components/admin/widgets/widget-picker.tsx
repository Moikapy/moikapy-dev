"use client";

import { useState, useRef, useEffect } from "react";
import { WIDGET_REGISTRY } from "./registry";
import type { WidgetLayout } from "./types";
import { Plus } from "lucide-react";

interface WidgetPickerProps {
  layout: WidgetLayout[];
  onAdd: (id: string) => void;
}

export function WidgetPicker({ layout, onAdd }: WidgetPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeIds = new Set(layout.map((w) => w.id));
  const available = WIDGET_REGISTRY.filter((w) => !activeIds.has(w.id));

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  if (available.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Widget
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border border-border bg-card shadow-lg py-1">
          {available.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                onAdd(w.id);
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
            >
              <span className="text-muted-foreground">{w.icon}</span>
              <span>{w.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}