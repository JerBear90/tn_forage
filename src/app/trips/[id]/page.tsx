'use client';

/**
 * ForageWise — Trip Detail Page
 *
 * Shows full details of a saved trip including location, date,
 * target species, companions, safety notes, and notes.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllRecords } from '@/offline/db';
import type { Trip, Park } from '@/types';

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrip() {
      try {
        const trips = await getAllRecords('trips') as Trip[];
        const found = trips.find((t) => t.id === params.id);
        if (found) {
          setTrip(found);
          // Resolve location name
          if (found.customLocation) {
            setLocationName(found.customLocation);
          } else if (found.locationId) {
            try {
              const parks = await getAllRecords('parks') as Park[];
              const park = parks.find((p) => p.id === found.locationId);
              setLocationName(park?.name || found.locationId);
            } catch {
              setLocationName(found.locationId);
            }
          }
        }
      } catch {
        // IndexedDB may not be available
      } finally {
        setLoading(false);
      }
    }
    loadTrip();
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-6">
        <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">Trip not found.</p>
        <Link href="/trips" className="text-sm text-brand-teal hover:underline mt-2">← Back to Trips</Link>
      </main>
    );
  }

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
      <header className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-brand-teal hover:underline mb-2 inline-block"
        >
          ← Back to Trips
        </button>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          {locationName || 'Trip Details'}
        </h1>
        <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 mt-1">
          {formattedDate}
        </p>
      </header>

      <div className="space-y-4">
        {/* Location */}
        <DetailCard icon="📍" label="Location" value={locationName || 'Not specified'} />

        {/* Date */}
        <DetailCard icon="📅" label="Date" value={formattedDate} />

        {/* Target Species */}
        {trip.targetSpecies.length > 0 && (
          <div className="rounded-xl border border-brand-teal/15 bg-white/90 dark:bg-brand-charcoal/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span aria-hidden="true">🍄</span>
              <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">Target Species</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trip.targetSpecies.map((species) => (
                <span
                  key={species}
                  className="inline-block rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-medium text-brand-teal"
                >
                  {species}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Companions */}
        {trip.companions && (
          <DetailCard icon="👥" label="Companions" value={trip.companions} />
        )}

        {/* Notes */}
        {trip.notes && (
          <div className="rounded-xl border border-brand-teal/15 bg-white/90 dark:bg-brand-charcoal/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span aria-hidden="true">📝</span>
              <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">Notes</h2>
            </div>
            <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 whitespace-pre-wrap">
              {trip.notes}
            </p>
          </div>
        )}

        {/* Safety Notes */}
        {trip.safetyNotes && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span aria-hidden="true">⚠️</span>
              <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Safety Notes</h2>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400 whitespace-pre-wrap">
              {trip.safetyNotes}
            </p>
          </div>
        )}

        {/* Trip type info */}
        <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white/90 dark:bg-brand-charcoal/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50">Trip Type</span>
            <span className="text-xs font-medium text-brand-charcoal dark:text-brand-sand capitalize">{trip.locationType}</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-teal/15 bg-white/90 dark:bg-brand-charcoal/60 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span aria-hidden="true">{icon}</span>
        <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">{label}</h2>
      </div>
      <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 pl-7">{value}</p>
    </div>
  );
}
