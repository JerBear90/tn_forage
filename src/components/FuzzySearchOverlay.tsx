'use client';

/**
 * ForageWise — Full-Screen Fuzzy Search Overlay
 *
 * Provides a full-screen search experience with auto-focused input,
 * grouped results by category, and navigation on tap.
 *
 * Requirements: 9.2, 9.4, 9.6, 9.7, 9.8, 9.9
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import type { SearchResult } from '@/utils/fuzzySearch';

interface FuzzySearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Category display labels and order. */
const CATEGORY_CONFIG: { key: 'posts' | 'species' | 'parks' | 'users'; label: string }[] = [
  { key: 'species', label: 'Species' },
  { key: 'parks', label: 'Parks' },
  { key: 'posts', label: 'Posts' },
  { key: 'users', label: 'Users' },
];

export default function FuzzySearchOverlay({ isOpen, onClose }: FuzzySearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, loading } = useFuzzySearch();

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the overlay is rendered before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen, setQuery]);

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;
  const hasResults = CATEGORY_CONFIG.some(({ key }) => results[key].length > 0);

  function handleResultTap(result: SearchResult) {
    router.push(result.route);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white dark:bg-brand-charcoal flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Header with input and close button */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-charcoal/10 dark:border-dark-border">
        {/* Search icon */}
        <svg
          className="w-5 h-5 text-brand-charcoal/50 dark:text-brand-sand/50 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search species, parks, posts, users..."
          className="flex-1 bg-transparent text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 text-base outline-none"
          aria-label="Search input"
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-brand-charcoal/60 dark:text-brand-sand/60 hover:bg-brand-charcoal/10 dark:hover:bg-brand-sand/10 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Loading indicator */}
        {loading && hasQuery && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" aria-label="Searching..." />
          </div>
        )}

        {/* Results grouped by category */}
        {!loading && hasQuery && hasResults && (
          <div className="space-y-4">
            {CATEGORY_CONFIG.map(({ key, label }) => {
              const categoryResults = results[key];
              if (categoryResults.length === 0) return null;

              return (
                <section key={key} aria-label={`${label} results`}>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/50 dark:text-brand-sand/50 mb-2">
                    {label}
                  </h2>
                  <ul className="space-y-1">
                    {categoryResults.map((result) => (
                      <li key={`${result.type}-${result.id}`}>
                        <button
                          type="button"
                          onClick={() => handleResultTap(result)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-left hover:bg-brand-teal/10 dark:hover:bg-brand-teal/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                          aria-label={`Go to ${result.title}`}
                        >
                          <CategoryIcon type={result.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand truncate">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        {/* No results state */}
        {!loading && hasQuery && !hasResults && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="w-12 h-12 text-brand-charcoal/20 dark:text-brand-sand/20 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
              No results found
            </p>
            <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
              Try a different search term
            </p>
          </div>
        )}

        {/* Empty state with search tips */}
        {!hasQuery && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="w-12 h-12 text-brand-charcoal/20 dark:text-brand-sand/20 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 mb-2">
              Search ForageWise
            </p>
            <div className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 space-y-1">
              <p>Try searching for mushroom species, parks, or community posts</p>
              <p>Example: &quot;chanterelle&quot;, &quot;Fall Creek Falls&quot;, or a username</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small icon for each result category. */
function CategoryIcon({ type }: { type: string }) {
  const className = "w-4 h-4 text-brand-charcoal/40 dark:text-brand-sand/40 shrink-0";

  switch (type) {
    case 'species':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      );
    case 'park':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      );
    case 'post':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      );
    case 'user':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
    default:
      return null;
  }
}
