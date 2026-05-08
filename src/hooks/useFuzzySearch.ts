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

      // Load species from IndexedDB
      try {
        const speciesRecords = await getAllRecords('species');
        for (const s of speciesRecords) {
          const species = s as { commonName?: string; scientificName?: string; images?: string[] };
          allItems.push({
            id: s.id,
            type: 'species',
            title: species.commonName || species.scientificName || s.id,
            subtitle: species.scientificName,
            imageUrl: species.images?.[0] || undefined,
            route: `/field-guide/${s.id}`,
          });
        }
      } catch {
        // IndexedDB species read failed — continue without species
      }

      // Load parks from IndexedDB
      try {
        const parkRecords = await getAllRecords('parks');
        for (const p of parkRecords) {
          const park = p as { name?: string; region?: string; image?: string };
          allItems.push({
            id: p.id,
            type: 'park',
            title: park.name || p.id,
            subtitle: park.region,
            imageUrl: park.image || undefined,
            route: `/parks/${p.id}`,
          });
        }
      } catch {
        // IndexedDB parks read failed — continue without parks
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
      const grouped: FuzzySearchResults = {
        posts: [],
        species: [],
        parks: [],
        users: [],
      };

      for (const result of searchResults) {
        const category = result.type as keyof FuzzySearchResults;
        if (grouped[category] && grouped[category].length < MAX_PER_CATEGORY) {
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
