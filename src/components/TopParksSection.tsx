'use client';

/**
 * ForageWise — TopParksSection Component
 *
 * Displays the top parks where a species can be found in the Field Guide.
 * Uses the useTopParks hook to compute park associations from IndexedDB.
 *
 * - Shows animated skeleton placeholder while loading
 * - Returns null (hides section entirely) when no parks are associated
 * - Each park name is a clickable link navigating to the park detail page
 * - Displays park name and region for each entry
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7
 */

import Link from 'next/link';
import { useTopParks } from '@/hooks/useTopParks';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TopParksSectionProps {
  speciesId: string;
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function TopParksSkeleton() {
  return (
    <div role="status" aria-label="Loading top parks" className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 p-3 animate-pulse"
        >
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-2/3" />
            <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-1/3" />
          </div>
          <div className="h-4 w-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded shrink-0 ml-2" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TopParksSection({ speciesId }: TopParksSectionProps): JSX.Element | null {
  const { parks, loading } = useTopParks(speciesId);

  // Hide section entirely when not loading and no parks found
  if (!loading && parks.length === 0) {
    return null;
  }

  return (
    <section className="mt-6" aria-labelledby="top-parks-heading">
      <h2
        id="top-parks-heading"
        className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2"
      >
        Top Parks
      </h2>

      {loading ? (
        <TopParksSkeleton />
      ) : (
        <ul className="space-y-2" aria-label="Parks where this species is found">
          {parks.map((park) => (
            <li key={park.id}>
              <Link
                href={`/parks/${park.id}`}
                className="flex items-center justify-between rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 p-3 hover:bg-brand-teal/5 hover:border-brand-teal/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
                aria-label={`View ${park.name} park details`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-charcoal dark:text-dark-text truncate">
                    {park.name}
                  </p>
                  <p className="text-xs text-brand-charcoal/60 dark:text-dark-text/60 truncate">
                    {park.region}
                  </p>
                </div>
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 text-brand-teal dark:text-brand-teal-300 shrink-0 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
