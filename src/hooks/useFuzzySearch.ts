'use client';

/**
 * ForageWise — Fuzzy Search Hook
 *
 * Manages search query state with 200ms debounce. On debounced query change,
 * gathers searchable items from IndexedDB (species, parks) and PocketBase
 * (posts, users via community_posts), runs fuzzySearch, groups results by
 * category, and caps at 5 per category.
 *
 * Requirements: 9.3, 9.4, 9.7
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { fuzzySearch, type SearchableItem, type SearchResult } from '@/utils/fuzzySearch';
import { getAllRecords } from '@/offline/db';
import { pb } from '@/auth/authService';

/** Grouped search results by category. */
export interface FuzzySearchResults {
  posts: SearchResult[];
  species: SearchResult[];
  parks: SearchResult[];
  users: SearchResult[];
}

const EMPTY_RESULTS: FuzzySearchResults = {
  posts: [],
  species: [],
  parks: [],
  users: [],
};

const MAX_PER_CATEGORY = 5;
const DEBOUNCE_MS = 200;

export function useFuzzySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FuzzySearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    abortRef.current = false;

    try {
      const allItems: SearchableItem[] = [];

      // Load all IndexedDB stores in parallel for speed
      const [speciesResult, plantsResult, treesResult, parksResult] = await Promise.allSettled([
        getAllRecords('species'),
        getAllRecords('plants'),
        getAllRecords('trees'),
        getAllRecords('parks'),
      ]);

      // Process species (mushrooms)
      if (speciesResult.status === 'fulfilled') {
        for (const s of speciesResult.value) {
          const rec = s as unknown as { id: string; commonName?: string; scientificName?: string; images?: string[] };
          allItems.push({
            id: rec.id,
            type: 'species',
            title: rec.commonName || rec.scientificName || rec.id,
            subtitle: rec.scientificName,
            imageUrl: rec.images?.[0] || undefined,
            route: `/field-guide/${rec.id}`,
          });
        }
      }

      // Process plants
      if (plantsResult.status === 'fulfilled') {
        for (const p of plantsResult.value) {
          const rec = p as unknown as { id: string; commonName?: string; scientificName?: string; images?: string[] };
          allItems.push({
            id: rec.id,
            type: 'species',
            title: rec.commonName || rec.scientificName || rec.id,
            subtitle: rec.scientificName,
            imageUrl: rec.images?.[0] || undefined,
            route: `/field-guide/${rec.id}`,
          });
        }
      }

      // Process trees
      if (treesResult.status === 'fulfilled') {
        for (const t of treesResult.value) {
          const rec = t as unknown as { id: string; commonName?: string; scientificName?: string; images?: string[] };
          allItems.push({
            id: rec.id,
            type: 'species',
            title: rec.commonName || rec.scientificName || rec.id,
            subtitle: rec.scientificName,
            imageUrl: rec.images?.[0] || undefined,
            route: `/field-guide/${rec.id}`,
          });
        }
      }

      // Process parks
      if (parksResult.status === 'fulfilled') {
        for (const p of parksResult.value) {
          const rec = p as unknown as { id: string; name?: string; region?: string; image?: string };
          allItems.push({
            id: rec.id,
            type: 'park',
            title: rec.name || rec.id,
            subtitle: rec.region,
            imageUrl: rec.image || undefined,
            route: `/parks/${rec.id}`,
          });
        }
      }

      // Load recent posts from PocketBase (top 50)
      try {
        const postsResult = await pb.collection('community_posts').getList(1, 50, {
          sort: '-created',
        });

        const seenUserIds = new Set<string>();

        for (const post of postsResult.items) {
          // Build first photo URL if available
          const photoFiles = post.photos as string[] | string | undefined;
          let postImageUrl: string | undefined;
          if (photoFiles) {
            const files = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
            if (files[0]) {
              postImageUrl = `${pb.baseURL}/api/files/community_posts/${post.id}/${files[0]}`;
            }
          }

          allItems.push({
            id: post.id,
            type: 'post',
            title: (post.speciesGuess as string) || (post.notes as string)?.slice(0, 60) || 'Post',
            subtitle: (post.userName as string) || undefined,
            imageUrl: postImageUrl,
            route: '/community#feed',
          });

          // Collect unique users from posts
          const userId = post.userId as string;
          if (userId && !seenUserIds.has(userId)) {
            seenUserIds.add(userId);
            const avatarUrl = (post.avatarUrl as string) || undefined;
            allItems.push({
              id: userId,
              type: 'user',
              title: (post.userName as string) || `Forager ${userId.slice(0, 8)}`,
              subtitle: undefined,
              imageUrl: avatarUrl && avatarUrl.startsWith('http') ? avatarUrl : undefined,
              route: `/community/user/${userId}`,
            });
          }
        }
      } catch {
        // PocketBase unavailable — continue without posts/users
      }

      if (abortRef.current) return;

      // Run fuzzy search
      const searchResults = fuzzySearch(searchQuery, allItems);

      // Group by type and cap at 5 per category
      // Note: result.type is singular ('park', 'post', 'user', 'species')
      // but FuzzySearchResults keys are plural ('parks', 'posts', 'users', 'species')
      const typeToCategory: Record<string, keyof FuzzySearchResults> = {
        post: 'posts',
        species: 'species',
        park: 'parks',
        user: 'users',
      };

      const grouped: FuzzySearchResults = {
        posts: [],
        species: [],
        parks: [],
        users: [],
      };

      for (const result of searchResults) {
        const category = typeToCategory[result.type];
        if (category && grouped[category].length < MAX_PER_CATEGORY) {
          grouped[category].push(result);
        }
      }

      if (!abortRef.current) {
        setResults(grouped);
      }
    } catch {
      // Search failed — show empty results
      if (!abortRef.current) {
        setResults(EMPTY_RESULTS);
      }
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounce query changes
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      abortRef.current = true;
    };
  }, [query, performSearch]);

  return { query, setQuery, results, loading };
}
