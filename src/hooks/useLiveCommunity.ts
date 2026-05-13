'use client';

/**
 * ForageWise — useLiveCommunity Hook
 *
 * Fetches live community posts from PocketBase when online, caches them
 * to IndexedDB, and falls back to cached posts when offline.
 *
 * Exports a pure `filterAndSortPosts` function for testability.
 *
 * Requirements: 8.1, 8.2, 8.3
 */

import { useState, useEffect } from 'react';
import { pb } from '@/auth/authService';
import { getAllRecords, putRecord } from '@/offline/db';
import type { CommunityDraft } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommunityPost {
  id: string;
  authorName: string;
  notes: string;
  visibility: 'public' | 'private';
  createdAt: string;
}

export interface UseLiveCommunityResult {
  posts: CommunityPost[];
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Pure Logic (exported for testability)
// ---------------------------------------------------------------------------

/**
 * Pure logic: filter to public posts, sort by createdAt desc, limit to max.
 * Exported for testability.
 */
export function filterAndSortPosts(
  posts: CommunityPost[],
  maxPosts: number = 3
): CommunityPost[] {
  return posts
    .filter((post) => post.visibility === 'public')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, maxPosts);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook that fetches live community posts from PocketBase when online,
 * caches them to IndexedDB, and falls back to cached posts when offline.
 *
 * @param maxPosts - Maximum number of posts to return (default 3)
 */
export function useLiveCommunity(maxPosts: number = 3): UseLiveCommunityResult {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      try {
        if (navigator.onLine) {
          // Online: fetch from PocketBase
          const result = await pb.collection('community_posts').getList(1, 20, {
            sort: '-created',
            filter: 'visibility = "public"',
          });

          if (cancelled) return;

          const fetchedPosts: CommunityPost[] = result.items.map((item) => ({
            id: item.id,
            authorName: (item['userName'] as string) || 'Anonymous',
            notes: (item['notes'] as string) || '',
            visibility: (item['visibility'] as 'public' | 'private') || 'public',
            createdAt: (item['created'] as string) || '',
          }));

          // Cache fetched posts to IndexedDB for offline access
          for (const post of fetchedPosts) {
            try {
              await putRecord('communityDrafts', {
                id: post.id,
                userId: '',
                notes: post.notes,
                visibility: post.visibility,
                photos: [],
                createdAt: post.createdAt,
                updatedAt: post.createdAt,
                displayName: post.authorName,
                source: 'remote',
              } as CommunityDraft & { source: string });
            } catch {
              // Cache is best-effort — don't fail the whole operation
            }
          }

          const filtered = filterAndSortPosts(fetchedPosts, maxPosts);
          setPosts(filtered);
        } else {
          // Offline: fall back to IndexedDB cached posts
          const cachedDrafts = await getAllRecords('communityDrafts');

          if (cancelled) return;

          const cachedPosts: CommunityPost[] = (cachedDrafts as (CommunityDraft & { source?: string })[])
            .map((draft) => ({
              id: draft.id,
              authorName: draft.displayName || 'Anonymous',
              notes: draft.notes,
              visibility: draft.visibility as 'public' | 'private',
              createdAt: draft.createdAt,
            }));

          const filtered = filterAndSortPosts(cachedPosts, maxPosts);
          setPosts(filtered);
        }
      } catch (err) {
        if (cancelled) return;

        // If PocketBase fetch fails, try IndexedDB fallback
        try {
          const cachedDrafts = await getAllRecords('communityDrafts');

          if (cancelled) return;

          const cachedPosts: CommunityPost[] = (cachedDrafts as (CommunityDraft & { source?: string })[])
            .map((draft) => ({
              id: draft.id,
              authorName: draft.displayName || 'Anonymous',
              notes: draft.notes,
              visibility: draft.visibility as 'public' | 'private',
              createdAt: draft.createdAt,
            }));

          const filtered = filterAndSortPosts(cachedPosts, maxPosts);
          setPosts(filtered);
        } catch (cacheErr) {
          if (!cancelled) {
            setError(
              cacheErr instanceof Error
                ? cacheErr.message
                : 'Failed to load community posts'
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, [maxPosts]);

  return { posts, loading, error };
}
