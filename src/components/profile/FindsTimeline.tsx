'use client';

/**
 * ForageWise — FindsTimeline Component
 *
 * Instagram-style grid showing the user's community posts and expedition finds.
 * Each card shows a photo (or placeholder), species name, date, and location.
 * Clickable to view the species detail or expedition log.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllRecords } from '@/offline/db';
import type { ExpeditionLog, CommunityDraft } from '@/types';

interface FindEntry {
  id: string;
  speciesName: string;
  speciesId: string | null;
  date: string;
  location: string | null;
  photoUrl: string | null;
  type: 'expedition' | 'community';
}

export default function FindsTimeline({ userId }: { userId: string }) {
  const [finds, setFinds] = useState<FindEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFinds() {
      try {
        // Load expedition logs
        const logs = await getAllRecords('expeditionLogs');
        const expeditionEntries: FindEntry[] = logs
          .filter((log) => (log as ExpeditionLog).userId === userId || userId === 'local-user')
          .map((log) => {
            const l = log as ExpeditionLog;
            return {
              id: l.id,
              speciesName: l.speciesGuess || 'Unknown species',
              speciesId: null,
              date: l.createdAt || '',
              location: l.habitat || null,
              photoUrl: l.photos?.[0] || null,
              type: 'expedition' as const,
            };
          });

        // Load community drafts (shared sightings)
        const drafts = await getAllRecords('communityDrafts');
        const communityEntries: FindEntry[] = drafts
          .filter((d) => (d as CommunityDraft).userId === userId || userId === 'local-user')
          .map((d) => {
            const draft = d as CommunityDraft;
            return {
              id: draft.id,
              speciesName: draft.speciesGuess || 'Community Post',
              speciesId: null,
              date: draft.createdAt || '',
              location: null,
              photoUrl: draft.photos?.[0] || null,
              type: 'community' as const,
            };
          });

        if (cancelled) return;

        const allFinds = [...expeditionEntries, ...communityEntries]
          .sort((a, b) => b.date.localeCompare(a.date));

        setFinds(allFinds);
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
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square rounded-lg bg-brand-charcoal/10 dark:bg-brand-sand/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (finds.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-3xl mb-2 block" aria-hidden="true">🍄</span>
        <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
          No posts yet. Share your discoveries with the community!
        </p>
        <div className="flex gap-3 justify-center mt-3">
          <Link
            href="/expedition"
            className="inline-block text-xs font-medium text-brand-teal hover:underline min-h-[44px] flex items-center"
          >
            Log a Find →
          </Link>
          <Link
            href="/community"
            className="inline-block text-xs font-medium text-brand-moss hover:underline min-h-[44px] flex items-center"
          >
            View Community →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Instagram-style grid */}
      <div className="grid grid-cols-3 gap-1" role="list" aria-label="Your finds and posts">
        {finds.map((find) => (
          <FindCard key={find.id} find={find} />
        ))}
      </div>

      {/* View all link */}
      <div className="text-center pt-2">
        <Link
          href="/community"
          className="text-xs font-medium text-brand-teal hover:underline"
        >
          View all in Community →
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Find Card (Instagram-style square)
// ---------------------------------------------------------------------------

function FindCard({ find }: { find: FindEntry }) {
  const href = find.speciesId
    ? `/field-guide/${find.speciesId}`
    : find.type === 'expedition'
      ? '/expedition'
      : '/community';

  return (
    <Link
      href={href}
      role="listitem"
      aria-label={`${find.speciesName} — ${find.date ? new Date(find.date).toLocaleDateString() : 'No date'}`}
      className="relative aspect-square rounded-lg overflow-hidden bg-brand-charcoal/5 dark:bg-brand-charcoal/20 group hover:ring-2 hover:ring-brand-teal/40 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
    >
      {/* Photo or placeholder */}
      {find.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={find.photoUrl}
          alt={find.speciesName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-teal/10 to-brand-moss/10 dark:from-brand-teal/20 dark:to-brand-moss/20">
          <span className="text-2xl" aria-hidden="true">
            {find.type === 'community' ? '👥' : '🍄'}
          </span>
        </div>
      )}

      {/* Overlay with species name */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
        <p className="text-[10px] font-medium text-white leading-tight truncate">
          {find.speciesName}
        </p>
        {find.date && (
          <p className="text-[9px] text-white/70">
            {new Date(find.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Type badge */}
      <div className="absolute top-1.5 right-1.5">
        <span className={`inline-block rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
          find.type === 'community'
            ? 'bg-brand-moss/80 text-white'
            : 'bg-brand-teal/80 text-white'
        }`}>
          {find.type === 'community' ? 'POST' : 'LOG'}
        </span>
      </div>
    </Link>
  );
}
