"use client";

/**
 * ForageFlow — useCompare Hook
 *
 * Manages species comparison state using URL search params.
 * Selected species IDs are stored in the `ids` query parameter
 * as a comma-separated list. This makes comparison links shareable
 * and keeps state in the URL for back/forward navigation.
 *
 * Constraints:
 * - Minimum 2 species to show comparison
 * - Maximum 4 species can be compared at once
 */

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export const MIN_COMPARE = 2;
export const MAX_COMPARE = 4;

export interface UseCompareResult {
  /** Currently selected species IDs */
  selectedIds: string[];
  /** Whether a species is currently selected */
  isSelected: (id: string) => boolean;
  /** Toggle a species in/out of the comparison set */
  toggle: (id: string) => void;
  /** Remove a species from the comparison set */
  remove: (id: string) => void;
  /** Clear all selections */
  clearAll: () => void;
  /** Whether the minimum selection count is met */
  canCompare: boolean;
  /** Whether the maximum selection count is reached */
  isFull: boolean;
  /** Number of currently selected species */
  count: number;
}

/**
 * Hook that manages comparison species selection via URL search params.
 */
export function useCompare(): UseCompareResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedIds = useMemo(() => {
    const raw = searchParams.get("ids");
    if (!raw) return [];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [searchParams]);

  const updateIds = useCallback(
    (ids: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (ids.length === 0) {
        params.delete("ids");
      } else {
        params.set("ids", ids.join(","));
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const toggle = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        updateIds(selectedIds.filter((s) => s !== id));
      } else if (selectedIds.length < MAX_COMPARE) {
        updateIds([...selectedIds, id]);
      }
    },
    [selectedIds, updateIds]
  );

  const remove = useCallback(
    (id: string) => {
      updateIds(selectedIds.filter((s) => s !== id));
    },
    [selectedIds, updateIds]
  );

  const clearAll = useCallback(() => {
    updateIds([]);
  }, [updateIds]);

  return {
    selectedIds,
    isSelected,
    toggle,
    remove,
    clearAll,
    canCompare: selectedIds.length >= MIN_COMPARE,
    isFull: selectedIds.length >= MAX_COMPARE,
    count: selectedIds.length,
  };
}
