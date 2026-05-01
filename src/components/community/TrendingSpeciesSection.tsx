'use client';

/**
 * ForageFlow — TrendingSpeciesSection Component
 *
 * Displays a horizontal scrollable row of trending species cards on the
 * Community Feed page. Aggregates sighting counts by speciesGuess from
 * community sightings created in the current calendar month, matches
 * against known species/plants in IndexedDB for images, and shows the
 * top 3 trending species with name, count, and image.
 *
 * Shows "Not enough sighting data this month" when fewer than 3 species
 * are available. Loads all data from IndexedDB and functions fully offline.
 *
 * Requirements: 8.1, 8.3, 8.4, 8.5
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getAllRecords } from '@/offline/db';
import {
  aggregateTrendingSpecies,
  type TrendingSpecies,
  type KnownSpeciesRecord,
} from '@/services/trending';
import type { CommunityDraft } from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TrendingSpeciesSectionProps {
  sightings: CommunityDraft[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrendingSpeciesSection({
  sightings,
}: TrendingSpeciesSectionProps) {
  const [trending, setTrending] = useState<TrendingSpecies[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTrending() {
      setLoading(true);
      try {
        // Load known species and plants from IndexedDB for image matching
        const [speciesRecords, plantRecords] = await Promise.all([
          getAllRecords('species'),
          getAllRecords('plants'),
        ]);

        // Combine into a single KnownSpeciesRecord array
        const knownSpecies: KnownSpeciesRecord[] = [
          ...speciesRecords.map((s) => ({
            id: s.id,
            commonName: s.commonName,
            images: s.images,
          })),
          ...plantRecords.map((p) => ({
            id: p.id,
            commonName: p.commonName,
            images: p.images,
          })),
        ];

        const results = aggregateTrendingSpecies(sightings, knownSpecies);

        if (!cancelled) {
          setTrending(results);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setTrending([]);
          setLoading(false);
        }
      }
    }

    loadTrending();
    return () => {
      cancelled = true;
    };
  }, [sightings]);

  // ---- Loading state ----
  if (loading) {
    return (
      <section aria-label="Trending species" className="space-y-3 mb-6">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Trending This Month
        </h2>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          aria-busy="true"
          aria-live="polite"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-36 h-44 rounded-xl bg-brand-charcoal/5 dark:bg-brand-sand/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  // ---- Not enough data state ----
  if (trending.length < 3) {
    return (
      <section aria-label="Trending species" className="space-y-3 mb-6">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Trending This Month
        </h2>

        {/* Show any available species even if fewer than 3 */}
        {trending.length > 0 && (
          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
            role="list"
            aria-label="Trending species this month"
          >
            {trending.map((species) => (
              <TrendingCard key={species.speciesGuess} species={species} />
            ))}
          </div>
        )}

        <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 p-4 text-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            Not enough sighting data this month
          </p>
        </div>
      </section>
    );
  }

  // ---- Normal state with 3+ trending species ----
  return (
    <section aria-label="Trending species" className="space-y-3 mb-6">
      <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
        Trending This Month
      </h2>

      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
        role="list"
        aria-label="Trending species this month"
      >
        {trending.map((species) => (
          <TrendingCard key={species.speciesGuess} species={species} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Trending Card
// ---------------------------------------------------------------------------

function TrendingCard({ species }: { species: TrendingSpecies }) {
  const hasImage =
    species.image &&
    (species.image.startsWith('/') || species.image.startsWith('http'));

  return (
    <div
      role="listitem"
      className="shrink-0 w-36 rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden flex flex-col"
    >
      {/* Species image */}
      <div className="relative w-full h-24 bg-brand-sand/60 dark:bg-dark-surface/80 overflow-hidden">
        {hasImage ? (
          <Image
            src={species.image!}
            alt={species.speciesGuess}
            width={288}
            height={192}
            sizes="144px"
            quality={65}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <PlaceholderIcon />
          </div>
        )}
      </div>

      {/* Species info */}
      <div className="flex-1 flex flex-col p-2.5">
        <p className="font-semibold text-sm text-brand-charcoal dark:text-dark-text truncate leading-snug">
          {species.speciesGuess}
        </p>
        <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-1">
          {species.count} sighting{species.count !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placeholder icon (used when no species image is available)
// ---------------------------------------------------------------------------

function PlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-8 h-8 text-brand-charcoal/20 dark:text-brand-sand/20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
      />
    </svg>
  );
}
