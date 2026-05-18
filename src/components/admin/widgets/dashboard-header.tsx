"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetPicker } from "./widget-picker";
import type { WidgetLayout } from "./types";

interface DashboardHeaderProps {
  layout: WidgetLayout[];
  onAdd: (id: string) => void;
  onReset: () => void;
}

export function DashboardHeader({ layout, onAdd, onReset }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <WidgetPicker layout={layout} onAdd={onAdd} />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
        onClick={onReset}
        title="Reset to default layout"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset Layout
      </Button>
    </div>
  );
}