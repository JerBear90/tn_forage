'use client';

/**
 * ForageWise — LifeList Component
 *
 * Shows the user's "life list" — total unique species they've observed.
 * Inspired by iNaturalist's species count badge. Pulls from expedition logs.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllRecords } from '@/offline/db';
import type { ExpeditionLog } from '@/types';

export default function LifeList({ userId }: { userId: string }) {
  const [speciesCount, setSpeciesCount] = useState(0);
  const [observationCount, setObservationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const logs = await getAllRecords('expeditionLogs');
        const userLogs = logs.filter(
          (l) => (l as ExpeditionLog).userId === userId || userId === 'local-user'
        );

        const uniqueSpecies = new Set<string>();
        for (const log of userLogs) {
          const l = log as ExpeditionLog;
          if (l.speciesGuess) uniqueSpecies.add(l.speciesGuess);
        }

        if (!cancelled) {
          setSpeciesCount(uniqueSpecies.size);
          setObservationCount(userLogs.length);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <p className="text-xl font-bold text-brand-teal">{speciesCount}</p>
        <p className="text-[10px] text-brand-charcoal/60 dark:text-brand-sand/60">Species</p>
      </div>
      <div className="w-px h-8 bg-brand-charcoal/10 dark:bg-brand-sand/10" />
      <div className="text-center">
        <p className="text-xl font-bold text-brand-moss">{observationCount}</p>
        <p className="text-[10px] text-brand-charcoal/60 dark:text-brand-sand/60">Observations</p>
      </div>
      <div className="w-px h-8 bg-brand-charcoal/10 dark:bg-brand-sand/10" />
      <Link
        href="/expedition"
        className="text-[10px] text-brand-teal font-medium hover:underline"
      >
        + Log a find
      </Link>
    </div>
  );
}
