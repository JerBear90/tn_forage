'use client';

/**
 * ForageWise — Trips Page
 *
 * Lists all saved trips from IndexedDB with search/filter, sync status
 * badges, delete with confirmation, loading skeleton, and empty state.
 * Includes a "Suggested for You" section with park recommendations
 * based on past trips, recent searches, and popular parks.
 * Mobile-first, accessible, works offline.
 */

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTrips, type TripWithLocation } from '@/hooks/useTrips';
import { getAllRecords } from '@/offline/db';
import { getRecentSearches } from '@/offline/recentSearches';
import type { SyncStatus, Park } from '@/types';

// ---------------------------------------------------------------------------
// Sync status badge config
// ---------------------------------------------------------------------------

const syncBadgeConfig: Record<
  SyncStatus,
  { className: string; label: string }
> = {
  pending: {
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    label: 'Pending',
  },
  synced: {
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    label: 'Synced',
  },
  failed: {
    className:
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    label: 'Failed',
  },
  conflict: {
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    label: 'Conflict',
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SyncBadge({ status }: { status: SyncStatus }) {
  const config = syncBadgeConfig[status] ?? syncBadgeConfig.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold leading-tight ${config.className}`}
      aria-label={`Sync status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}

function TripCard({
  trip,
  onDelete,
}: {
  trip: TripWithLocation;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = useMemo(() => {
    try {
      return new Date(trip.date + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return trip.date;
    }
  }, [trip.date]);

  return (
    <article
      className="rounded-xl border border-brand-teal/15 bg-white/90 dark:bg-brand-charcoal/70 p-4 shadow-sm transition-shadow hover:shadow-md"
      aria-label={`Trip to ${trip.locationName} on ${formattedDate}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold text-sm text-brand-forest dark:text-brand-moss truncate">
            {trip.locationName}
          </h3>
          <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5">
            {formattedDate}
          </p>
        </div>
        <SyncBadge status={trip.syncStatus} />
      </div>

      {/* Target species */}
      {trip.targetSpecies.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {trip.targetSpecies.map((species) => (
            <span
              key={species}
              className="inline-block rounded-full bg-brand-teal/10 px-2 py-0.5 text-xs font-medium text-brand-teal dark:text-brand-teal"
            >
              {species}
            </span>
          ))}
        </div>
      )}

      {/* Notes preview */}
      {trip.notes && (
        <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 line-clamp-2 mb-3">
          {trip.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-teal/10">
        {confirmDelete ? (
          <div className="flex items-center gap-2" role="alert">
            <span className="text-xs text-red-600 dark:text-red-400">
              Delete this trip?
            </span>
            <button
              type="button"
              onClick={() => onDelete(trip.id)}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
              aria-label={`Confirm delete trip to ${trip.locationName}`}
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-md border border-brand-teal/20 px-3 py-1.5 text-xs font-medium text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
              aria-label="Cancel delete"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-md border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
            aria-label={`Delete trip to ${trip.locationName}`}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading trips" role="status">
      <span className="sr-only">Loading trips…</span>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-brand-teal/10 bg-white/60 dark:bg-brand-charcoal/40 p-4 animate-pulse"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 rounded bg-brand-teal/10" />
              <div className="h-3 w-1/3 rounded bg-brand-teal/10" />
            </div>
            <div className="h-5 w-14 rounded-full bg-brand-teal/10" />
          </div>
          <div className="flex gap-1 mb-3">
            <div className="h-5 w-20 rounded-full bg-brand-teal/10" />
            <div className="h-5 w-16 rounded-full bg-brand-teal/10" />
          </div>
          <div className="h-3 w-full rounded bg-brand-teal/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        aria-hidden="true"
        className="w-16 h-16 text-brand-teal/20 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 6.75V15m6-6v8.25m.503-12.713l5.248-2.187A.75.75 0 0121.75 3v14.25a.75.75 0 01-.497.702l-5.253 2.188a.75.75 0 01-.503 0L9.75 17.953a.75.75 0 00-.503 0l-5.248 2.187A.75.75 0 013 19.39V5.14a.75.75 0 01.497-.702l5.253-2.188a.75.75 0 01.503 0L15 5.327"
        />
      </svg>
      <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-1">
        No trips yet
      </h2>
      <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 mb-4 max-w-xs">
        Create your first trip to start planning a foraging outing at a
        Tennessee park or trail.
      </p>
      <Link
        href="/trips/new"
        className="rounded-lg bg-brand-teal text-white font-semibold text-sm px-6 py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98]"
      >
        Create Your First Trip
      </Link>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Suggested Parks Section
// ---------------------------------------------------------------------------

interface SuggestedPark {
  id: string;
  name: string;
  region: string;
  image?: string;
  reason: string; // e.g. "Visited before", "Near your searches", "Popular"
}

function SuggestedParks({ trips }: { trips: TripWithLocation[] }) {
  const [suggestions, setSuggestions] = useState<SuggestedPark[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function buildSuggestions() {
      try {
        const parks = await getAllRecords('parks');
        if (cancelled || parks.length === 0) return;

        const result: SuggestedPark[] = [];
        const usedIds = new Set<string>();

        // 1. Parks from past trips (revisit suggestions)
        const visitedParkIds = new Set(
          trips
            .filter((t) => t.locationType === 'park' && t.locationId)
            .map((t) => t.locationId!),
        );
        for (const park of parks) {
          if (result.length >= 3) break;
          if (visitedParkIds.has(park.id) && !usedIds.has(park.id)) {
            result.push({
              id: park.id,
              name: park.name,
              region: park.region,
              image: park.image,
              reason: 'Visited before',
            });
            usedIds.add(park.id);
          }
        }

        // 2. Parks matching recent searches
        if (result.length < 3) {
          const recentSearches = getRecentSearches();
          for (const query of recentSearches) {
            if (result.length >= 3) break;
            const q = query.toLowerCase();
            const match = parks.find(
              (p) =>
                !usedIds.has(p.id) &&
                (p.name.toLowerCase().includes(q) ||
                  p.region.toLowerCase().includes(q)),
            );
            if (match) {
              result.push({
                id: match.id,
                name: match.name,
                region: match.region,
                image: match.image,
                reason: 'Matches your search',
              });
              usedIds.add(match.id);
            }
          }
        }

        // 3. Fill remaining with popular/random parks
        if (result.length < 3) {
          // Pick parks with the most amenities as a proxy for "popular"
          const sorted = [...parks]
            .filter((p) => !usedIds.has(p.id))
            .sort((a, b) => b.amenities.length - a.amenities.length);
          for (const park of sorted) {
            if (result.length >= 3) break;
            result.push({
              id: park.id,
              name: park.name,
              region: park.region,
              image: park.image,
              reason: 'Popular park',
            });
            usedIds.add(park.id);
          }
        }

        if (!cancelled) {
          setSuggestions(result.slice(0, 3));
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    }

    buildSuggestions();
    return () => { cancelled = true; };
  }, [trips]);

  if (!loaded || suggestions.length === 0) return null;

  return (
    <section className="mb-6" aria-label="Suggested parks">
      <h2 className="font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-3">
        Suggested for You
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {suggestions.map((park) => (
          <Link
            key={park.id}
            href={`/trips/new`}
            className="shrink-0 w-40 rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            {/* Park image */}
            <div className="relative w-full h-24 bg-brand-sand/60 dark:bg-dark-surface/80 overflow-hidden">
              {park.image ? (
                <Image
                  src={park.image}
                  alt={park.name}
                  width={320}
                  height={192}
                  sizes="160px"
                  quality={65}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 text-brand-charcoal/15 dark:text-brand-sand/15"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
              )}
            </div>
            {/* Park info */}
            <div className="p-2.5">
              <p className="font-semibold text-xs text-brand-charcoal dark:text-dark-text truncate leading-snug">
                {park.name}
              </p>
              <p className="text-[10px] text-brand-teal mt-0.5">
                {park.reason}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TripsPage() {
  const { trips, loading, error, deleteTrip } = useTrips();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter trips by search query (location name, notes, species)
  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.toLowerCase();
    return trips.filter(
      (trip) =>
        trip.locationName.toLowerCase().includes(q) ||
        trip.notes.toLowerCase().includes(q) ||
        trip.targetSpecies.some((s) => s.toLowerCase().includes(q)),
    );
  }, [trips, searchQuery]);

  const hasTrips = trips.length > 0;
  const hasResults = filteredTrips.length > 0;

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
            My Trips
          </h1>
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
            Plan outings, track progress, and review past trips.
          </p>
        </div>
        <Link
          href="/trips/new"
          className="shrink-0 rounded-lg bg-brand-teal text-white font-semibold text-sm px-4 py-2.5 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98]"
        >
          + New Trip
        </Link>
      </header>

      {/* Suggested parks — based on past trips, searches, and popular parks */}
      {!loading && <SuggestedParks trips={trips} />}

      {/* Search — only show when there are trips */}
      {hasTrips && (
        <div className="mb-6">
          <label htmlFor="trips-search" className="sr-only">
            Search trips
          </label>
          <div className="relative">
            <svg
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/40 dark:text-brand-sand/40 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="trips-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location, notes, or species…"
              className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 pl-10 pr-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && <LoadingSkeleton />}

      {/* Empty state */}
      {!loading && !hasTrips && <EmptyState />}

      {/* No search results */}
      {!loading && hasTrips && !hasResults && (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
            No trips match &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Trip cards */}
      {!loading && hasResults && (
        <div className="space-y-4" role="list" aria-label="Saved trips">
          {filteredTrips.map((trip) => (
            <div key={trip.id} role="listitem">
              <TripCard trip={trip} onDelete={deleteTrip} />
            </div>
          ))}
        </div>
      )}

      {/* Offline note */}
      <p className="text-xs text-center text-brand-charcoal/50 dark:text-brand-sand/50 mt-auto pt-6">
        Trips are saved locally and sync when you&apos;re back online.
      </p>

      {/* Fixed "Plan a Visit" button at bottom */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <Link
            href="/trips/new"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 shadow-lg hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] min-h-[44px]"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Plan a Visit
          </Link>
        </div>
      </div>
    </main>
  );
}
