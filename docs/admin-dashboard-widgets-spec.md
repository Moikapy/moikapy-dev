# Spec: Admin Dashboard Widgets — Drag-and-Drop Layout with Customizable Cards

## 1. Overview

Refactor the admin dashboard from hardcoded card positions to a configurable widget system where users can:
- **Drag and drop** cards to rearrange their order
- **Add/remove** widgets from a widget picker
- **Resize** widgets (small/medium/large)
- **Persist** layout to localStorage (client-side, per-device)

The dashboard currently has 6 fixed stat cards in a `lg:grid-cols-3` grid, followed by 4 fixed content sections. This spec replaces that with a widget registry, a layout persistence layer, and drag-and-drop interactions.

## 2. Scope (v1)

**In:**
- Widget registry with type definitions
- Drag-and-drop reordering (mobile + desktop)
- Add/remove widgets via a picker
- 3 size presets: `sm` (1 col), `md` (2 col), `lg` (3 col)
- Layout persistence to localStorage
- Initial widget set covering current dashboard functionality
- Warm editorial theme integration

**Out (v2+):**
- Widget configuration panels (e.g., date range picker per-widget)
- Server-side layout sync (KV per user)
- Custom widget creation by admin
- Widget data refresh intervals
- Export/import widget layouts

## 3. Architecture

### 3.1 Widget Registry

Each widget is a self-contained component registered by type ID:

```typescript
// src/components/admin/widgets/types.ts

export type WidgetSize = "sm" | "md" | "lg";

export interface WidgetDef {
  id: string;           // e.g., "stat-page-views"
  title: string;        // e.g., "Page Views"
  icon: React.ReactNode; // Lucide icon
  defaultSize: WidgetSize;
  category: "stat" | "content" | "ai";
}

export interface WidgetLayout {
  id: string;           // matches WidgetDef.id
  size: WidgetSize;
  order: number;       // position in grid (0-based)
}
```

### 3.2 Layout Persistence

```typescript
// src/components/admin/widgets/use-widget-layout.ts

const STORAGE_KEY = "moikapy-admin-widget-layout";

export function useWidgetLayout(defaults: WidgetLayout[]): {
  layout: WidgetLayout[];
  update: (id: string, changes: Partial<WidgetLayout>) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  reset: () => void;
} {
  // Read from localStorage on mount
  // Track changes in React state
  // Write to localStorage on change (debounced)
  // Reset to defaults if localStorage is empty
}
```

### 3.3 Drag-and-Drop

Use HTML5 Drag and Drop API (no library). Mobile support via touch events with a polyfill approach.

```typescript
// src/components/admin/widgets/drag-helpers.ts

export function useDragReorder(
  layout: WidgetLayout[],
  update: (layout: WidgetLayout[]) => void
): {
  dragHandlers: (id: string) => DragEventHandlers;
  touchHandlers: (id: string) => TouchEventHandlers;
  isDragging: string | null; // id of widget being dragged
  dragOverId: string | null;  // id of widget being hovered
}
```

### 3.4 Default Layout

```typescript
const DEFAULT_LAYOUT: WidgetLayout[] = [
  { id: "stat-page-views", size: "sm", order: 0 },
  { id: "stat-blog-views", size: "sm", order: 1 },
  { id: "stat-published",  size: "sm", order: 2 },
  { id: "stat-referrers",  size: "sm", order: 3 },
  { id: "stat-unique",     size: "sm", order: 4 },
  { id: "stat-shares",     size: "sm", order: 5 },
  { id: "recent-posts",    size: "md", order: 6 },
  { id: "top-blog-views",  size: "md", order: 7 },
  { id: "ai-insights",    size: "lg", order: 8 },
];
```

## 4. Widget Definitions (v1)

### 4.1 Stat Widgets (`sm` size)

Each stat widget is a `Card` with:
- Border-left accent color (6 colors: gold, emerald, blue, amber, purple, rose)
- Title (xs uppercase tracking-wide)
- Value (text-2xl font-bold)
- Icon in top-right corner
- Subtitle (text-[11px] text-muted-foreground)

| ID | Title | Icon | Data Source | Accent |
|---|---|---|---|---|
| `stat-page-views` | Page Views | `Eye` | `analytics.totals.views` | gold (primary) |
| `stat-blog-views` | Blog Views | `TrendingUp` | `totalBlogViews` (computed) | emerald |
| `stat-published` | Published | `Check` | `publishedCount` | blue |
| `stat-referrers` | Referrers | `Globe` | `topReferrers.length` | amber |
| `stat-unique` | Unique Visitors | `Eye` (purple variant) | `analytics.uniqueViews` | purple |
| `stat-shares` | Shares | `Share2` | `analytics.totalShares` | rose |

### 4.2 Content Widgets (`md` / `lg` size)

| ID | Title | Default Size | Data Source |
|---|---|---|---|
| `recent-posts` | Recent Posts | `md` | `posts.slice(0, 5)` |
| `top-blog-views` | Top Blog Views | `md` | `analytics.blogViews` |
| `ai-insights` | AI Insights | `lg` | `/api/ai/insights` |
| `referrer-chart` | Referrer Breakdown | `md` | `analytics.topReferrers` |
| `views-chart` | Views Over Time | `lg` | `analytics.totals` (needs new time-series data) |

### 4.3 Widget Picker

A `+` button in the dashboard header opens a dropdown listing available widgets not yet on the dashboard. Each item shows icon + title. Clicking adds it at the end.

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <Plus className="h-4 w-4 mr-1" /> Add Widget
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {availableWidgets.map(w => (
      <DropdownMenuItem key={w.id} onClick={() => add(w.id)}>
        {w.icon} {w.title}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

## 5. Grid Layout

The dashboard uses CSS Grid with auto-flow and span-based sizing:

```
sm → grid-column: span 1
md → grid-column: span 2
lg → grid-column: span 3
```

On mobile (`sm` screen), all widgets span full width regardless of size setting.

```tsx
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-auto">
  {sortedLayout.map(widget => (
    <div
      key={widget.id}
      style={{ gridColumn: `span ${sizeToSpan[widget.size]}` }}
      className={`${isDragging === widget.id ? "opacity-50" : ""} transition-opacity`}
    >
      <WidgetRenderer def={registry[widget.id]} data={widgetData} />
    </div>
  ))}
</div>
```

## 6. Drag-and-Drop UX

### Desktop
- **Drag handle**: Small grip icon (⋮⋮) in top-left of each card
- **Drag start**: Card gets `opacity-50` and a shadow
- **Drag over**: Gap appears where the card would drop (CSS `transition` on grid)
- **Drop**: Card snaps into new position, layout updates

### Mobile
- **Long press** (300ms) to enter drag mode
- **Touch drag**: Same as mouse drag with touch events
- **Cancel**: Tap outside to cancel

### Keyboard
- **Tab** to focus a widget
- **Space/Enter** to pick up
- **Arrow keys** to move
- **Escape** to cancel

## 7. Warm Editorial Theme Integration

All new widgets follow the warm editorial palette defined in `globals.css`:
- Cards: `bg-card` (warm dark `#221e1b` in dark mode, warm white `#fdfcfa` in light)
- Borders: `border-border` (warm brown `#3d3530` / `#e0d5c8`)
- Headings: `font-heading` (Lora serif)
- Stat values: `text-2xl font-bold`
- Stat icons: colored per-accent (primary/emerald/blue/amber/purple/rose)

## 8. File Structure

```
src/components/admin/widgets/
├── types.ts              # WidgetDef, WidgetLayout, WidgetSize
├── registry.ts           # Widget registry (all widget definitions)
├── use-widget-layout.ts  # Layout persistence hook (localStorage)
├── drag-helpers.ts       # Drag and drop logic
├── widget-renderer.tsx   # Maps widget ID to component
├── stat-widget.tsx        # Stat card component (reusable)
├── recent-posts-widget.tsx
├── top-blog-views-widget.tsx
├── ai-insights-widget.tsx
├── referrer-chart-widget.tsx
├── views-chart-widget.tsx
├── widget-picker.tsx      # Dropdown for adding widgets
└── dashboard-grid.tsx    # Main grid layout with drag-and-drop
```

The existing `admin-client.tsx` will import `DashboardGrid` and pass data props down. The tab navigation stays the same — this only refactors the "dashboard" tab content.

## 9. Implementation Order

1. **Types + Registry** — Define widget types, create registry with all 9 v1 widgets
2. **Layout Hook** — `useWidgetLayout` with localStorage persistence
3. **StatWidget** — Extract reusable stat card from current hardcoded cards
4. **WidgetRenderer** — Maps widget ID to component, passes data props
5. **DashboardGrid** — CSS Grid layout with size-based column spans
6. **WidgetPicker** — Dropdown for adding widgets
7. **Drag-helpers** — Desktop drag (mousedown/mousemove/mouseup)
8. **Mobile drag** — Touch event support (touchstart/touchmove/touchend)
9. **Widget content** — Migrate existing content sections into widget components
10. **Polish** — Remove button per widget, resize handle, empty state

## 10. Testing Strategy

- **Unit**: `useWidgetLayout` — test localStorage read/write, reset, add/remove
- **Unit**: Widget registry — verify all IDs unique, all components exist
- **Integration**: DashboardGrid — renders all widgets in order, drag reorder updates layout
- **E2E**: Add widget → appears in grid → remove widget → disappears → refresh → layout persists

## 11. Dependencies

- **No new npm packages** — HTML5 drag-and-drop, no library needed
- **Existing**: `lucide-react` (icons), `@/components/ui/*` (Card, Button, Badge, DropdownMenu)
- **Data**: All data comes from existing sources (analytics state, posts state, insights fetch)

## 12. Migration Path

The refactored dashboard must render identically to the current one on first load (same 6 stat cards + 3 content sections in the same order). The localStorage key starts empty, so defaults are used.

Steps:
1. Create `src/components/admin/widgets/` directory and types
2. Build `StatWidget` component — verify it matches current card appearance
3. Build `DashboardGrid` — render all default widgets, verify visual match
4. Add layout persistence — verify localStorage read/write
5. Add `WidgetPicker` — verify add/remove
6. Add drag-and-drop — verify reorder
7. Replace `renderDashboard()` in `admin-client.tsx` with `<DashboardGrid />`
8. Remove old hardcoded dashboard JSX

## 13. Security Consider

- Widget layout is stored in **localStorage only** — no server-side data, no auth tokens exposed
- Widget `id` values are validated against the registry — arbitrary IDs are ignored
- No widget can execute arbitrary code — only pre-registered components render
- Widget data sources use existing authenticated API calls (analytics, posts, insights)