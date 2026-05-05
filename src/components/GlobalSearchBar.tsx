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
    <div ref={panelRef} className="relative flex-1 max-w-md mx-2">
      {/* Search Input */}
      <div className="flex items-center gap-2 bg-white dark:bg-dark-card rounded-lg border border-brand-charcoal/20 dark:border-dark-border px-3 py-1.5 shadow-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-charcoal/50 dark:text-dark-text/50 shrink-0"
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
          className="flex-1 bg-transparent text-sm text-brand-charcoal dark:text-dark-text placeholder:text-brand-charcoal/40 dark:placeholder:text-dark-text/40 outline-none"
        />
        {loading && (
          <div
            className="w-4 h-4 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin"
            aria-label="Searching"
          />
        )}
        <button
          onClick={handleClose}
          aria-label="Close search"
          className="p-0.5 rounded text-brand-charcoal/50 dark:text-dark-text/50 hover:text-brand-charcoal dark:hover:text-dark-text"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Dropdown Panel */}
      {(showRecent || showResults) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-card rounded-lg border border-brand-charcoal/20 dark:border-dark-border shadow-lg max-h-80 overflow-y-auto z-50">
          {/* Recent Searches */}
          {showRecent && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-brand-charcoal/60 dark:text-dark-text/60 uppercase tracking-wide">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecent}
                  className="text-xs text-brand-teal hover:text-brand-teal/80 transition-colors"
                >
                  Clear
                </button>
              </div>
              <ul role="list">
                {recentSearches.map((recent) => (
                  <li key={recent}>
                    <button
                      onClick={() => handleRecentSearchClick(recent)}
                      className="w-full text-left px-2 py-1.5 text-sm text-brand-charcoal dark:text-dark-text hover:bg-brand-sand/50 dark:hover:bg-dark-border/30 rounded transition-colors"
                    >
                      {recent}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Search Results */}
          {showResults && !loading && results.length === 0 && (
            <div className="p-4 text-center text-sm text-brand-charcoal/50 dark:text-dark-text/50">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {showResults && results.length > 0 && (
            <div className="py-2">
              {results.map((group: SearchResultGroup) => (
                <div key={group.category}>
                  <div className="px-3 py-1.5">
                    <span className="text-xs font-medium text-brand-charcoal/60 dark:text-dark-text/60 uppercase tracking-wide">
                      {group.category}
                    </span>
                  </div>
                  <ul role="list">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleSelectResult(item.href, item.title)}
                          className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-brand-sand/50 dark:hover:bg-dark-border/30 transition-colors"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt=""
                              className="w-8 h-8 rounded object-cover shrink-0"
                              loading="lazy"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-brand-charcoal dark:text-dark-text truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-brand-charcoal/50 dark:text-dark-text/50 truncate">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
