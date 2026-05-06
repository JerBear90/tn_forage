'use client';

/**
 * ForageWise — NearbyNow Component
 *
 * "What's around me right now?" — Shows species likely to be found
 * based on the user's current location and the current month.
 * Inspired by iNaturalist's "Explore nearby" feature.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getAllRecords } from '@/offline/db';
import type { Species, Plant } from '@/types';

interface NearbySpecies {
  id: string;
  commonName: string;
  category: string;
  image: string | null;
}

const MONTH_TO_SEASON: Record<number, string[]> = {
  0: ['Winter'], 1: ['Winter'], 2: ['Spring'],
  3: ['Spring'], 4: ['Spring'], 5: ['Summer'],
  6: ['Summer'], 7: ['Summer'], 8: ['Fall'],
  9: ['Fall'], 10: ['Fall'], 11: ['Winter'],
};

export default function NearbyNow() {
  const { position, requestLocation } = useGeolocation();
  const [species, setSpecies] = useState<NearbySpecies[]>([]);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!position) return;

    let cancelled = false;
    setLoading(true);

    async function findNearby() {
      try {
        const currentMonth = new Date().getMonth();
        const currentSeasons = MONTH_TO_SEASON[currentMonth] || ['Spring'];

        const [allSpecies, allPlants] = await Promise.all([
          getAllRecords('species'),
          getAllRecords('plants'),
        ]);

        // Filter to species in season right now
        const inSeason: NearbySpecies[] = [];

        for (const s of allSpecies) {
          const sp = s as Species;
          if (sp.season.some((season) => currentSeasons.includes(season))) {
            inSeason.push({
              id: sp.id,
              commonName: sp.commonName,
              category: sp.category,
              image: sp.images?.[0] || null,
            });
          }
        }

        for (const p of allPlants) {
          const pl = p as Plant;
          if (pl.season.some((season) => currentSeasons.includes(season))) {
            inSeason.push({
              id: pl.id,
              commonName: pl.commonName,
              category: pl.category,
              image: pl.images?.[0] || null,
            });
          }
        }

        // Shuffle and take top 8
        const shuffled = inSeason.sort(() => Math.random() - 0.5).slice(0, 8);

        if (!cancelled) {
          setSpecies(shuffled);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    findNearby();
    return () => { cancelled = true; };
  }, [position]);

  if (!requested && !position) {
    return (
      <section className="mb-6">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-2">
          What&apos;s Around Me Now?
        </h2>
        <button
          type="button"
          onClick={() => { requestLocation(); setRequested(true); }}
          className="w-full rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-3 text-sm font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          Enable location to see what&apos;s in season near you
        </button>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mb-6">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-2">
          What&apos;s Around Me Now?
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shrink-0 w-28 h-36 rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (species.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-2">
        What&apos;s Around Me Now?
      </h2>
      <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mb-3">
        Species in season this month near your location
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        {species.map((s) => (
          <Link
            key={s.id}
            href={`/field-guide/${s.id}`}
            className="shrink-0 w-28 rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="w-full h-20 bg-brand-sand/60 dark:bg-dark-surface/80">
              {s.image ? (
                <img src={s.image} alt={s.commonName} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🍄</div>
              )}
            </div>
            <div className="p-2">
              <p className="text-[11px] font-medium text-brand-charcoal dark:text-dark-text leading-tight line-clamp-2">
                {s.commonName}
              </p>
              <p className="text-[9px] text-brand-charcoal/40 dark:text-brand-sand/40 mt-0.5 capitalize">
                {s.category}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
