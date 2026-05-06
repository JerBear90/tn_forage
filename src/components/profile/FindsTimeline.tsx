'use client';

/**
 * ForageWise — FindsTimeline Component
 *
 * Shows a chronological timeline of species the user has found/logged.
 * Pulls from expedition logs and trip data in IndexedDB.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllRecords } from '@/offline/db';
import type { ExpeditionLog } from '@/types';

interface FindEntry {
  id: string;
  speciesName: string;
  speciesId: string | null;
  date: string;
  location: string | null;
  photoUrl: string | null;
}

export default function FindsTimeline({ userId }: { userId: string }) {
  const [finds, setFinds] = useState<FindEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFinds() {
      try {
        const logs = await getAllRecords('expeditionLogs');
        if (cancelled) return;

        const entries: FindEntry[] = logs
          .filter((log) => (log as ExpeditionLog).userId === userId || userId === 'local-user')
          .map((log) => {
            const l = log as ExpeditionLog;
            return {
              id: l.id,
              speciesName: l.speciesGuess || 'Unknown species',
              speciesId: l.matchedSpeciesId || null,
              date: l.createdAt || '',
              location: l.locationName || null,
              photoUrl: null, // Photos stored separately
            };
          })
          .sort((a, b) => b.date.localeCompare(a.date));

        setFinds(entries);
      } catch {
        // IndexedDB may not be available
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFinds();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-charcoal/10 dark:bg-brand-sand/10" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-32" />
              <div className="h-2 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (finds.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-3xl mb-2 block" aria-hidden="true">🍄</span>
        <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
          No finds yet. Start logging your discoveries in the Expedition Log!
        </p>
        <Link
          href="/expedition"
          className="inline-block mt-3 text-xs font-medium text-brand-teal hover:underline"
        >
          Go to Expedition Log →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {finds.map((find, i) => (
        <div key={find.id} className="flex gap-3 relative">
          {/* Timeline line */}
          {i < finds.length - 1 && (
            <div className="absolute left-[19px] top-10 bottom-0 w-px bg-brand-charcoal/10 dark:bg-brand-sand/10" />
          )}

          {/* Dot */}
          <div className="shrink-0 w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center mt-0.5">
            <span className="text-sm" aria-hidden="true">🍄</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-4">
            {find.speciesId ? (
              <Link
                href={`/field-guide/${find.speciesId}`}
                className="text-sm font-medium text-brand-charcoal dark:text-dark-text hover:text-brand-teal transition-colors"
              >
                {find.speciesName}
              </Link>
            ) : (
              <p className="text-sm font-medium text-brand-charcoal dark:text-dark-text">
                {find.speciesName}
              </p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              {find.date && (
                <span className="text-[11px] text-brand-charcoal/50 dark:text-brand-sand/50">
                  {new Date(find.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {find.location && (
                <span className="text-[11px] text-brand-charcoal/40 dark:text-brand-sand/40">
                  📍 {find.location}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
