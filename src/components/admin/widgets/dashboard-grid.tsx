"use client";

import { useWidgetLayout } from "./use-widget-layout";
import { useDragReorder } from "./drag-helpers";
import { WidgetRenderer } from "./widget-renderer";
import { DashboardHeader } from "./dashboard-header";
import { SIZE_TO_SPAN } from "./types";
import { WIDGET_MAP } from "./registry";
import type { PostData, AnalyticsData } from "@/app/admin/admin-client-types";
import type { CommunityInsights } from "@/lib/community-insights";

interface DashboardGridProps {
  posts: PostData[];
  analytics: AnalyticsData | null;
  insights: CommunityInsights | null;
  analyticsDays: number;
  totalBlogViews: number;
  publishedCount: number;
  draftCount: number;
  onNavigatePosts: () => void;
  onNavigateAnalytics: () => void;
  onStartEdit: (post: PostData) => void;
}

export function DashboardGrid({
  posts,
  analytics,
  insights,
  analyticsDays,
  totalBlogViews,
  publishedCount,
  draftCount,
  onNavigatePosts,
  onNavigateAnalytics,
  onStartEdit,
}: DashboardGridProps) {
  const { layout, add, remove, reorder, reset, cycleSize } = useWidgetLayout();
  const { isDragging, dragOverId, handlers } = useDragReorder(layout, reorder);

  // Sort by order
  const sortedLayout = [...layout].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <DashboardHeader layout={layout} onAdd={add} onReset={reset} />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-auto">
        {sortedLayout.map((widget) => {
          const def = WIDGET_MAP.get(widget.id);
          if (!def) return null;

          const span = SIZE_TO_SPAN[widget.size];
          const dragging = isDragging === widget.id;
          const over = dragOverId === widget.id;

          return (
            <div
              key={widget.id}
              data-widget-id={widget.id}
              style={{ gridColumn: `span ${span}` }}
              className={`transition-all ${dragging ? "opacity-50" : ""} ${
                over ? "ring-2 ring-primary/30 rounded-lg" : ""
              }`}
              {...handlers(widget.id)}
            >
              <WidgetRenderer
                widget={widget}
                posts={posts}
                analytics={analytics}
                insights={insights}
                analyticsDays={analyticsDays}
                totalBlogViews={totalBlogViews}
                publishedCount={publishedCount}
                draftCount={draftCount}
                isDragging={dragging}
                isDragOver={over}
                onRemove={() => remove(widget.id)}
                onCycleSize={() => cycleSize(widget.id)}
                onNavigatePosts={onNavigatePosts}
                onNavigateAnalytics={onNavigateAnalytics}
                onStartEdit={onStartEdit}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
