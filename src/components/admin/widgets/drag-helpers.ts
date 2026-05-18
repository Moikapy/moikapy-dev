"use client";

import { useState, useCallback, useRef } from "react";
import type { WidgetLayout } from "./types";

interface DragState {
  isDragging: string | null; // widget ID being dragged
  dragOverId: string | null; // widget ID being hovered
}

export function useDragReorder(
  layout: WidgetLayout[],
  reorder: (layout: WidgetLayout[]) => void
) {
  const [state, setState] = useState<DragState>({
    isDragging: null,
    dragOverId: null,
  });

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  // HTML5 drag handlers (desktop)
  const handleDragStart = useCallback((id: string) => (e: React.DragEvent) => {
    setState({ isDragging: id, dragOverId: null });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    // Make the drag ghost semi-transparent
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "0.5";
  }, []);

  const handleDragOver = useCallback((id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setState((prev) => {
      if (prev.dragOverId !== id) return { ...prev, dragOverId: id };
      return prev;
    });
  }, []);

  const handleDragLeave = useCallback(() => {
    setState((prev) => ({ ...prev, dragOverId: null }));
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => (e: React.DragEvent) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");
      if (!draggedId || draggedId === targetId) {
        setState({ isDragging: null, dragOverId: null });
        return;
      }

      // Reorder: remove dragged from position, insert at target position
      const sorted = [...layout].sort((a, b) => a.order - b.order);
      const draggedIdx = sorted.findIndex((w) => w.id === draggedId);
      const targetIdx = sorted.findIndex((w) => w.id === targetId);

      if (draggedIdx === -1 || targetIdx === -1) {
        setState({ isDragging: null, dragOverId: null });
        return;
      }

      const [removed] = sorted.splice(draggedIdx, 1);
      sorted.splice(targetIdx, 0, removed);
      reorder(sorted);
      setState({ isDragging: null, dragOverId: null });
    },
    [layout, reorder]
  );

  const handleDragEnd = useCallback(() => {
    setState({ isDragging: null, dragOverId: null });
    // Reset opacity on all drag elements
    document.querySelectorAll("[data-widget-id]").forEach((el) => {
      (el as HTMLElement).style.opacity = "";
    });
  }, []);

  // Touch handlers (mobile)
  const handleTouchStart = useCallback((id: string) => (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    // Long press detection is handled by the parent component
    // We just track the start position here
    void id; // Will be used after long-press threshold
  }, []);

  const handleTouchMove = useCallback(
    (_id: string) => (e: React.TouchEvent) => {
      if (!state.isDragging) return;
      e.preventDefault();

      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const widgetEl = element?.closest("[data-widget-id]");
      if (widgetEl) {
        const overId = widgetEl.getAttribute("data-widget-id");
        if (overId) {
          setState((prev) => ({ ...prev, dragOverId: overId }));
        }
      }
    },
    [state.isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (state.isDragging && state.dragOverId && state.isDragging !== state.dragOverId) {
      const sorted = [...layout].sort((a, b) => a.order - b.order);
      const draggedIdx = sorted.findIndex((w) => w.id === state.isDragging);
      const targetIdx = sorted.findIndex((w) => w.id === state.dragOverId);

      if (draggedIdx !== -1 && targetIdx !== -1) {
        const [removed] = sorted.splice(draggedIdx, 1);
        sorted.splice(targetIdx, 0, removed);
        reorder(sorted);
      }
    }
    setState({ isDragging: null, dragOverId: null });
    dragStartPos.current = null;
  }, [layout, state.isDragging, state.dragOverId, reorder]);

  return {
    isDragging: state.isDragging,
    dragOverId: state.dragOverId,
    setIsDragging: (id: string | null) => setState((prev) => ({ ...prev, isDragging: id })),
    handlers: (id: string) => ({
      draggable: true,
      onDragStart: handleDragStart(id),
      onDragOver: handleDragOver(id),
      onDragLeave: handleDragLeave,
      onDrop: handleDrop(id),
      onDragEnd: handleDragEnd,
      onTouchStart: handleTouchStart(id),
      onTouchMove: handleTouchMove(id),
      onTouchEnd: handleTouchEnd,
    }),
  };
}