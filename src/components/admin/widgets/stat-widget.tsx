"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCENT_COLORS, SIZE_TO_SPAN } from "./types";
import type { WidgetSize } from "./types";
import { GripVertical, X, Maximize2, Minimize2 } from "lucide-react";

interface StatWidgetProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  accent: string; // key into ACCENT_COLORS
  isDragging?: boolean;
  isDragOver?: boolean;
  onRemove?: () => void;
  onCycleSize?: () => void;
  dragHandle?: ReactNode;
}

export function StatWidget({
  title,
  value,
  subtitle,
  icon,
  accent,
  isDragging,
  isDragOver,
  onRemove,
  onCycleSize,
  dragHandle,
}: StatWidgetProps) {
  const colors = ACCENT_COLORS[accent] ?? ACCENT_COLORS.primary;

  return (
    <Card
      className={`border-l-4 ${colors.border} transition-all ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${isDragOver ? "ring-2 ring-primary/50" : ""}`}
    >
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {dragHandle}
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-9 w-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
              <span className={colors.text}>{icon}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          <div className="flex items-center gap-1">
            {onCycleSize && (
              <button
                onClick={onCycleSize}
                className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Change size"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Remove widget"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ContentWidgetProps {
  title: string;
  size: WidgetSize;
  children: ReactNode;
  headerRight?: ReactNode;
  isDragging?: boolean;
  isDragOver?: boolean;
  onRemove?: () => void;
  onCycleSize?: () => void;
  dragHandle?: ReactNode;
}

export function ContentWidget({
  title,
  size: _size,
  children,
  headerRight,
  isDragging,
  isDragOver,
  onRemove,
  onCycleSize,
  dragHandle,
}: ContentWidgetProps) {
  return (
    <Card
      className={`transition-all ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${isDragOver ? "ring-2 ring-primary/50" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dragHandle}
            <CardTitle className="text-sm font-medium font-heading">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {headerRight}
            {onCycleSize && (
              <button
                onClick={onCycleSize}
                className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Change size"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Remove widget"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}