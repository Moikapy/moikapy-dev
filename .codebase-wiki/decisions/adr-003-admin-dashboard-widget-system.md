# ADR-003: Admin Dashboard Widget System

> **Status**: Proposed

## Context
Admin dashboard has 6 stat cards and 3 content sections hardcoded in a 1300-line JSX component. Hard to customize, hard to add new widgets. Need a flexible widget system.

## Decision
Refactor admin dashboard into a widget registry with drag-and-drop reordering, localStorage persistence, 3 size presets (sm/md/lg), add/remove widget picker. No external DnD library — use HTML5 Drag and Drop API. Warm editorial theme throughout. 9 v1 widgets covering all current dashboard functionality.

## Consequences
- (to be determined)

## Alternatives Considered
Keep hardcoded dashboard; Use a heavy DnD library like react-beautiful-dnd; Build from scratch with HTML5 DnD

## References
- Created: 2026-05-18

## See Also
- [[index]]
