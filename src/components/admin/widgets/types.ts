import type { ReactNode } from "react";

export type WidgetSize = "sm" | "md" | "lg";

export interface WidgetDef {
  id: string;
  title: string;
  icon: ReactNode;
  defaultSize: WidgetSize;
  category: "stat" | "content" | "ai";
}

export interface WidgetLayout {
  id: string;
  size: WidgetSize;
  order: number;
}

export const SIZE_TO_SPAN: Record<WidgetSize, number> = {
  sm: 1,
  md: 2,
  lg: 3,
};

export const ACCENT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  primary: { border: "border-l-primary", bg: "bg-primary/10", text: "text-primary" },
  emerald: { border: "border-l-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500" },
  blue: { border: "border-l-blue-500", bg: "bg-blue-500/10", text: "text-blue-500" },
  amber: { border: "border-l-amber-500", bg: "bg-amber-500/10", text: "text-amber-500" },
  purple: { border: "border-l-purple-500", bg: "bg-purple-500/10", text: "text-purple-500" },
  rose: { border: "border-l-rose-500", bg: "bg-rose-500/10", text: "text-rose-500" },
};