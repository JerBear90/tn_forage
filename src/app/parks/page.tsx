'use client';

/**
 * ForageFlow — Parks Browse Page
 *
 * Shows all Tennessee state parks as browsable cards with images,
 * region filters, and a link to plan a trip from each park.
 * Accessible from the "Plan a Visit" bottom nav item.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllRecords } from '@/offline/db';
import { seedDatabase } from '@/data/seedDatabase';
import { useEffect } from 'react';
import type { Park, TnRegion } from '@/types';

const REGION_FILTERS: { label: string; value: TnRegion | 'all' }[] = [
  { label: 'All Regions', value: 'all' },
  { label: 'East TN', value: 'East TN' },
  { label: 'Middle TN', value: 'Middle TN' },
  { label: 'West TN', value: 'West TN' },
];

export default function ParksPage() {
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<TnRegion | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await seedDatabase();
        const records = await getAllRecords('parks');
        if (!cancelled) {
          setParks(records.sort((a, b) => a.name.localeCompare(b.name)));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = parks;
    if (selectedRegion !== 'all') {
      result = result.filter((p) => p.region === selectedRegion);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [parks, selectedRegion, search]);

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-2xl mx-auto pb-28">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Plan a Visit
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-dark-text-muted mt-1">
          Browse Tennessee state parks and plan your next foraging trip.
        </p>
      </header>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search parks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-dark-surface/60 px-4 py-3 text-sm text-brand-charcoal dark:text-dark-text placeholder:text-brand-charcoal/40 dark:placeholder:text-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
        />
      </div>

      {/* Region filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" role="group" aria-label="Region filters">
        {REGION_FILTERS.map((filter) => {
          const isActive = selectedRegion === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelectedRegion(filter.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                isActive
                  ? 'bg-brand-teal text-white border-brand-teal'
                  : 'bg-white/60 dark:bg-dark-surface/60 text-brand-charcoal dark:text-dark-text border-brand-teal/20 hover:bg-brand-teal/10'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-brand-charcoal/50 dark:text-dark-text-muted mb-3">
          {filtered.length} {filtered.length === 1 ? 'park' : 'parks'} found
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 overflow-hidden animate-pulse">
              <div className="h-36 bg-brand-sand/40 dark:bg-brand-charcoal/40" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-3/4" />
                <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Park cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((park) => (
            <Link
              key={park.id}
              href={`/parks/${park.id}`}
              className="block rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 overflow-hidden hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            >
              <div className="relative h-36 bg-brand-sand/60 dark:bg-dark-surface/80 overflow-hidden">
                {park.image ? (
                  <Image
                    src={park.image}
                    alt={park.name}
                    width={600}
                    height={300}
                    sizes="(max-width: 640px) 100vw, 300px"
                    quality={70}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-brand-charcoal/15">
                    <svg aria-hidden="true" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-heading font-semibold text-sm text-brand-charcoal dark:text-dark-text leading-tight">
                  {park.name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-block rounded-full bg-brand-teal/10 text-brand-teal text-xs font-medium px-2 py-0.5">
                    {park.region}
                  </span>
                  <span className="text-xs text-brand-charcoal/50 dark:text-dark-text-muted">
                    {park.amenities.length} amenities
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
            No parks match your search.
          </p>
        </div>
      )}
    </main>
  );
}
