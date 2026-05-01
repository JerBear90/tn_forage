"use client";

/**
 * ForageFlow — usePreloadSpecies Hook
 *
 * Preloads species/plant/tree detail data from IndexedDB into an in-memory
 * cache on hover or focus. The species detail page can check this cache
 * before issuing its own IndexedDB read, enabling instant navigation.
 *
 * Usage:
 *   const { preload, getCached } = usePreloadSpecies();
 *   // On hover/focus of a species card:
 *   preload(speciesId);
 *   // On the detail page, before loading from IndexedDB:
 *   const cached = getCached(id);
 *
 * Requirements: 13.1, 13.2, 13.3
 */

import { useRef, useCallback } from "react";
import { getRecord } from "@/offline/db";
import type { Species, Plant, Tree } from "@/types";

/** Discriminated union matching the detail page's SpeciesDetailRecord type */
export type PreloadedRecord =
  | { kind: "species"; data: Species }
  | { kind: "plant"; data: Plant }
  | { kind: "tree"; data: Tree };

/**
 * Hook that provides `preload` and `getCached` functions for species detail
 * data preloading. Uses a `Map` ref so the cache persists across renders
 * without triggering re-renders.
 */
export function usePreloadSpecies() {
  const cacheRef = useRef<Map<string, PreloadedRecord>>(new Map());
  /** Track in-flight preloads to avoid duplicate requests */
  const pendingRef = useRef<Set<string>>(new Set());

  /**
   * Preload a species/plant/tree record by ID from IndexedDB into the cache.
   * Tries each store in order: species → plants → trees (same order as
   * useSpeciesDetail). No-ops if the record is already cached or a preload
   * is already in flight for this ID.
   */
  const preload = useCallback((id: string) => {
    // Skip if already cached or already loading
    if (cacheRef.current.has(id) || pendingRef.current.has(id)) {
      return;
    }

    pendingRef.current.add(id);

    // Fire-and-forget — we don't need to await this
    (async () => {
      try {
        const species = await getRecord("species", id);
        if (species) {
          cacheRef.current.set(id, { kind: "species", data: species });
          return;
        }

        const plant = await getRecord("plants", id);
        if (plant) {
          cacheRef.current.set(id, { kind: "plant", data: plant });
          return;
        }

        const tree = await getRecord("trees", id);
        if (tree) {
          cacheRef.current.set(id, { kind: "tree", data: tree });
        }
      } catch {
        // Silently ignore preload failures — the detail page will fall back
        // to its standard loading behavior with SkeletonDetail
      } finally {
        pendingRef.current.delete(id);
      }
    })();
  }, []);

  /**
   * Retrieve a previously preloaded record from the cache.
   * Returns `undefined` if the record hasn't been preloaded yet.
   */
  const getCached = useCallback(
    (id: string): PreloadedRecord | undefined => {
      return cacheRef.current.get(id);
    },
    [],
  );

  return { preload, getCached };
}
