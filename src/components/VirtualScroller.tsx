"use client";

/**
 * VirtualScroller — Virtualized list wrapper using @tanstack/react-virtual.
 *
 * Renders only visible items plus an overscan buffer for smooth scrolling
 * performance with large datasets. Supports variable-height items via
 * estimateSize and measureElement.
 */

import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface VirtualScrollerProps<T> {
  /** The full array of items to virtualize. */
  items: T[];
  /** Estimated pixel height for each item (used before measurement). */
  estimateSize: (index: number) => number;
  /** Render function for each item. */
  renderItem: (item: T, index: number) => ReactNode;
  /** Number of items to render outside the visible area (default: 5). */
  overscan?: number;
  /** Optional CSS class for the outer scroll container. */
  className?: string;
  /** Optional inline styles for the outer scroll container. */
  style?: React.CSSProperties;
}

export default function VirtualScroller<T>({
  items,
  estimateSize,
  renderItem,
  overscan = 5,
  className,
  style,
}: VirtualScrollerProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
    measureElement: (el) => {
      // measureElement returns the actual height of the rendered element
      // so @tanstack/react-virtual can correct its estimates dynamically
      if (!el) return 0;
      return el.getBoundingClientRect().height;
    },
  });

  return (
    <div
      ref={parentRef}
      className={className}
      style={{ overflow: "auto", ...style }}
      role="list"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={(el) => {
              if (el) virtualizer.measureElement(el);
            }}
            role="listitem"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
