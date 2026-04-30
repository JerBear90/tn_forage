"use client";

/**
 * ForageFlow — useCommunityPreview Hook
 *
 * Loads community drafts from IndexedDB `communityDrafts` store.
 * Filters to `visibility === 'public'` only, sorts by `createdAt`
 * descending, and returns at most 3 items.
 *
 * Requirements: 11.2
 */

import { useState, useEffect } from "react";
import { getAllRecords } from "@/offline/db";
import type { CommunityDraft } from "@/types";

export interface UseCommunityPreviewResult {
  previews: CommunityDraft[];
  loading: boolean;
  error: string | null;
}

/**
 * Pure filtering/sorting logic extracted for testability.
 *
 * Given a list of community drafts, returns at most `maxItems` public
 * drafts sorted by `createdAt` descending (most recent first).
 */
export function filterCommunityPreviews(
  drafts: CommunityDraft[],
  maxItems: number = 3
): CommunityDraft[] {
  return drafts
    .filter((d) => d.visibility === "public")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, maxItems);
}

/**
 * Hook that loads the 3 most recent public community drafts from IndexedDB.
 */
export function useCommunityPreview(): UseCommunityPreviewResult {
  const [previews, setPreviews] = useState<CommunityDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const drafts = await getAllRecords("communityDrafts");

        if (cancelled) return;

        const filtered = filterCommunityPreviews(drafts as CommunityDraft[]);
        setPreviews(filtered);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load community previews"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { previews, loading, error };
}
