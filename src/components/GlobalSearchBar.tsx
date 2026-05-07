'use client';

/**
 * ForageWise — GlobalSearchBar Component
 *
 * Search icon button in the AppShell header that expands into a search
 * input overlay. Shows recent searches when opened without typing,
 * and grouped results (Species, Parks, Trails) when query >= 3 characters.
 *
 * Selecting a result navigates to the corresponding detail page.
 * Functions offline by searching IndexedDB data.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import type { SearchResultGroup } from '@/offline/search';

export default function GlobalSearchBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    results,
    loading,
    recentSearches,
    clearRecent,
    saveSearch,
  } = useGlobalSearch();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, [setQuery]);

  const handleSelectResult = useCallback(
    (href: string, title: string) => {
      saveSearch(query || title);
      setIsOpen(false);
      setQuery('');
      router.push(href);
    },
    [query, saveSearch, setQuery, router],
  );

  const handleRecentSearchClick = useCallback(
    (recentQuery: string) => {
      setQuery(recentQuery);
    },
    [setQuery],
  );

  const showRecent = isOpen && query.trim().length < 3 && recentSearches.length > 0;
  const showResults = isOpen && query.trim().length >= 3;

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        aria-label="Open search"
        className="p-1.5 rounded-md text-brand-charcoal/70 dark:text-dark-text/70 hover:bg-brand-charcoal/10 dark:hover:bg-dark-border/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-white dark:bg-brand-charcoal" ref={panelRef}>
      {/* Search Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-charcoal/10 dark:border-brand-sand/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-charcoal/50 dark:text-brand-sand/50 shrink-0"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search species, parks, trails…"
          aria-label="Search species, parks, and trails"
          className="flex-1 bg-transparent text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 outline-none min-h-[44px]"
        />
        {loading && (
          <div
            className="w-4 h-4 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin shrink-0"
            aria-label="Searching"
          />
        )}
        <button
          onClick={handleClose}
          aria-label="Close search"
          className="p-2 rounded-lg text-brand-charcoal/60 dark:text-brand-sand/60 hover:bg-brand-charcoal/10 dark:hover:bg-brand-sand/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          Cancel
        </button>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent Searches */}
        {showRecent && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-brand-charcoal/60 dark:text-brand-sand/60 uppercase tracking-wide">
                Recent Searches
              </span>
              <button
                onClick={clearRecent}
                className="text-xs text-brand-teal hover:text-brand-teal/80 transition-colors"
              >
                Clear
              </button>
            </div>
            <ul role="list" className="space-y-1">
              {recentSearches.map((recent) => (
                <li key={recent}>
                  <button
                    onClick={() => handleRecentSearchClick(recent)}
                    className="w-full text-left px-3 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand hover:bg-brand-sand/50 dark:hover:bg-brand-charcoal/60 rounded-lg transition-colors min-h-[44px] flex items-center"
                  >
                    <svg className="w-4 h-4 mr-3 text-brand-charcoal/30 dark:text-brand-sand/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {recent}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Results */}
        {showResults && !loading && results.length === 0 && (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-brand-charcoal/20 dark:text-brand-sand/20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.3-4.3" />
            </svg>
            <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-brand-charcoal/30 dark:text-brand-sand/30 mt-2">
              Try visiting the Field Guide or Map to load species and park data first.
            </p>
          </div>
        )}

        {/* Search Results */}
        {showResults && results.length > 0 && (
          <div className="py-2">
            {results.map((group: SearchResultGroup) => (
              <div key={group.category} className="mb-2">
                <div className="px-4 py-2">
                  <span className="text-xs font-semibold text-brand-charcoal/60 dark:text-brand-sand/60 uppercase tracking-wide">
                    {group.category}
                  </span>
                </div>
                <ul role="list">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSelectResult(item.href, item.title)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-brand-sand/50 dark:hover:bg-brand-charcoal/60 transition-colors min-h-[44px]"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                            loading="lazy"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-brand-charcoal dark:text-brand-sand truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 truncate">
                            {item.subtitle}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-brand-charcoal/30 dark:text-brand-sand/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Empty state when just opened */}
        {isOpen && query.trim().length < 3 && recentSearches.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-brand-charcoal/40 dark:text-brand-sand/40">
              Search species, parks, and trails
            </p>
            <p className="text-xs text-brand-charcoal/30 dark:text-brand-sand/30 mt-1">
              Type at least 3 characters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
