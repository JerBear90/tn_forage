'use client';

/**
 * ForageFlow — useGlobalSearch Hook
 *
 * Provides debounced global search across IndexedDB stores (species, plants,
 * trees, parks, trails) and recent search management via localStorage.
 *
 * Debounces input by 300ms before executing the search.
 */

import { useState, useEffect, useCallback } from 'react';
import { searchIndexedDB, type SearchResultGroup } from '@/offline/search';
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
} from '@/offline/recentSearches';

export interface UseGlobalSearchResult {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResultGroup[];
  loading: boolean;
  recentSearches: string[];
  clearRecent: () => void;
  saveSearch: (query: string) => void;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

export function useGlobalSearch(): UseGlobalSearchResult {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const searchResults = await searchIndexedDB({ query: query.trim() });
        setResults(searchResults);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const saveSearch = useCallback((q: string) => {
    saveRecentSearch(q);
    setRecentSearches(getRecentSearches());
  }, []);

  const clearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    recentSearches,
    clearRecent,
    saveSearch,
  };
}
