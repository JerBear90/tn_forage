'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRecord } from '@/offline/db';
import type { Trip, Park, Trail } from '@/types';

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tripId = params.id ?? '';

  const [trip, setTrip] = useState<Trip | null>(null);
  const [parkName, setParkName] = useState<string | null>(null);
  const [trailName, setTrailName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTrip = async () => {
      try {
        const record = await getRecord('trips', tripId);
        if (cancelled) return;

        if (!record) {
          setError('Trip not found.');
          setLoading(false);
          return;
        }

        setTrip(record);

        // Load park name if it's a park-based trip
        if (record.locationId) {
          const park = await getRecord('parks', record.locationId);
          if (!cancelled && park) setParkName(park.name);
        }

        // Load trail name if specified
        if (record.trailId) {
          const trail = await getRecord('trails', record.trailId);
          if (!cancelled && trail) setTrailName(trail.name);
        }

        setLoading(false);
      } catch {
        if (!cancelled) {
          setError('Failed to load trip details.');
          setLoading(false);
        }
      }
    };

    loadTrip();
    return () => { cancelled = true; };
  }, [tripId]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-48" />
          <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-32" />
          <div className="h-32 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded" />
        </div>
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
        <Link href="/trips" className="text-sm text-brand-teal hover:underline mb-4 inline-block">
          ← Back to Trips
        </Link>
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          <p>{error || 'Trip not found.'}</p>
        </div>
      </main>
    );
  }

  const locationDisplay = parkName || trip.customLocation || 'Unknown location';
  const formattedDate = (() => {
    try {
      return new Date(trip.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return trip.date;
    }
  })();

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      <Link href="/trips" className="text-sm text-brand-teal hover:underline mb-4 inline-block">
        ← Back to Trips
      </Link>

      {/* Header */}
      <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
        {locationDisplay}
      </h1>
      <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 mt-1">
        {formattedDate}
      </p>

      {/* Location details */}
      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text">
          Location
        </h2>
        <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm" aria-hidden="true">📍</span>
            <span className="text-sm text-brand-charcoal dark:text-dark-text font-medium">{locationDisplay}</span>
          </div>
          {trailName && (
            <div className="flex items-center gap-2">
              <span className="text-sm" aria-hidden="true">🥾</span>
              <span className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80">Trail: {trailName}</span>
            </div>
          )}
          {parkName && trip.locationId && (
            <Link
              href={`/parks/${trip.locationId}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-teal hover:underline mt-1"
            >
              View park details →
            </Link>
          )}
        </div>
      </section>

      {/* Target species */}
      {trip.targetSpecies.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Target Species
          </h2>
          <div className="flex flex-wrap gap-2">
            {trip.targetSpecies.map((species) => (
              <span
                key={species}
                className="inline-block rounded-full bg-brand-teal/10 border border-brand-teal/20 px-3 py-1.5 text-xs font-medium text-brand-teal"
              >
                {species}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Notes */}
      {trip.notes && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Notes
          </h2>
          <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed whitespace-pre-wrap">
            {trip.notes}
          </p>
        </section>
      )}

      {/* Companions */}
      {trip.companions && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Companions
          </h2>
          <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80">
            {trip.companions}
          </p>
        </section>
      )}

      {/* Safety notes */}
      {trip.safetyNotes && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Safety Notes
          </h2>
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {trip.safetyNotes}
            </p>
          </div>
        </section>
      )}

      {/* Sync status */}
      <section className="mt-6">
        <div className="flex items-center gap-2 text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
          <span className={`w-2 h-2 rounded-full ${
            trip.syncStatus === 'synced' ? 'bg-green-500' :
            trip.syncStatus === 'pending' ? 'bg-amber-500' :
            'bg-red-500'
          }`} />
          <span className="capitalize">{trip.syncStatus}</span>
        </div>
      </section>
    </main>
  );
}
