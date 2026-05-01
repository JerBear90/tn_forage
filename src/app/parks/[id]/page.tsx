'use client';

/**
 * ForageFlow — Park Detail Page
 *
 * Shows detailed information for a single park including image, amenities,
 * trails, region, foraging rules, and a "Plan a Trip Here" button.
 * Reads from IndexedDB and works offline.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { getRecord, getDB } from '@/offline/db';
import { seedDatabase } from '@/data/seedDatabase';
import { buildWeatherUrl } from '@/utils/weatherUtils';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getPhotos } from '@/social/photoService';
import TrailDetailPanel from '@/components/parks/TrailDetailPanel';
import PhotoTour from '@/components/parks/PhotoTour';
import ReviewsSection from '@/components/parks/ReviewsSection';
import type { Park, Trail, TrailExtended, SocialPhoto } from '@/types';

const TrailMap = dynamic(() => import('@/components/parks/TrailMapRenderer'), { ssr: false });

export default function ParkDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const parkId = params.id ?? '';

  const isOnline = useOnlineStatus();
  const [park, setPark] = useState<Park | null>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPhotos, setUserPhotos] = useState<SocialPhoto[]>([]);
  const [expandedTrailMap, setExpandedTrailMap] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await seedDatabase();
        const parkRecord = await getRecord('parks', parkId);
        if (cancelled) return;

        if (!parkRecord) {
          setError('Park not found.');
          setLoading(false);
          return;
        }

        setPark(parkRecord);

        // Load trails for this park
        const db = await getDB();
        const parkTrails = await db.getAllFromIndex('trails', 'by-parkId', parkId);
        if (!cancelled) {
          setTrails(parkTrails.sort((a, b) => a.name.localeCompare(b.name)));
          setLoading(false);
        }

        // Load user photos for this park
        try {
          const photos = await getPhotos('park', parkId);
          if (!cancelled) {
            setUserPhotos(photos);
          }
        } catch {
          // Photos are non-critical; silently fail
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load park details.');
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [parkId]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col px-4 py-6 max-w-2xl mx-auto pb-28">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-brand-sand/40 dark:bg-brand-charcoal/40 rounded-xl" />
          <div className="h-7 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-3/4" />
          <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-1/2" />
          <div className="space-y-2 mt-6">
            <div className="h-5 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-24" />
            <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !park) {
    return (
      <main className="flex min-h-screen flex-col px-4 py-6 max-w-2xl mx-auto pb-28">
        <Link href="/parks" className="text-sm text-brand-teal hover:underline mb-4 inline-block">
          ← Back to Parks
        </Link>
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          <p>{error || 'Park not found.'}</p>
          <button type="button" onClick={() => router.push('/parks')} className="mt-3 text-xs font-medium text-brand-teal underline">
            Return to Parks
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Back link */}
      <Link href="/parks" className="text-sm text-brand-teal hover:underline mb-4 inline-block">
        ← Back to Parks
      </Link>

      {/* Hero image */}
      {park.image && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-brand-sand/60 dark:bg-dark-surface/80 mb-4">
          <Image
            src={park.image}
            alt={park.name}
            width={800}
            height={400}
            sizes="(max-width: 672px) 100vw, 672px"
            quality={75}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      )}

      {/* Park name and region */}
      <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
        {park.name}
      </h1>
      <span className="inline-block mt-2 rounded-full bg-brand-teal/10 text-brand-teal text-xs font-medium px-3 py-1 w-fit">
        {park.region}
      </span>

      {/* Description */}
      {park.description && (
        <p className="mt-3 text-sm text-brand-charcoal/80 dark:text-dark-text-muted leading-relaxed">
          {park.description}
        </p>
      )}

      {/* Plan a Trip button */}
      <Link
        href="/trips/new"
        className="mt-4 w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 text-center hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] block"
      >
        🌿 Plan a Trip Here
      </Link>

      {/* Info Grid: Hours, Fees, Park Size */}
      {(park.hours || park.fees || park.parkSize) && (
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {park.hours && (
            <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 p-3">
              <p className="text-xs font-medium text-brand-charcoal/60 dark:text-dark-text-muted uppercase tracking-wide">Hours</p>
              <p className="text-sm text-brand-charcoal dark:text-dark-text mt-0.5">{park.hours}</p>
            </div>
          )}
          {park.fees && (
            <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 p-3">
              <p className="text-xs font-medium text-brand-charcoal/60 dark:text-dark-text-muted uppercase tracking-wide">Fees</p>
              <p className="text-sm text-brand-charcoal dark:text-dark-text mt-0.5">{park.fees}</p>
            </div>
          )}
          {park.parkSize && (
            <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 p-3">
              <p className="text-xs font-medium text-brand-charcoal/60 dark:text-dark-text-muted uppercase tracking-wide">Park Size</p>
              <p className="text-sm text-brand-charcoal dark:text-dark-text mt-0.5">{park.parkSize}</p>
            </div>
          )}
        </section>
      )}

      {/* Highlights */}
      {park.highlights && park.highlights.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Highlights
          </h2>
          <ul className="space-y-1.5">
            {park.highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-start gap-2 text-sm text-brand-charcoal/80 dark:text-dark-text-muted"
              >
                <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-brand-teal" aria-hidden="true" />
                {highlight}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Photo Tour */}
      <section className="mt-6">
        <PhotoTour seedPhotos={park.image ? [park.image] : []} userPhotos={userPhotos} />
      </section>

      {/* Amenities */}
      {park.amenities.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Amenities
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {park.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-block rounded-full border border-brand-teal/20 bg-brand-teal/5 px-2.5 py-0.5 text-xs text-brand-teal dark:text-brand-teal-300"
              >
                {amenity}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Trails */}
      <section className="mt-6">
        <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
          Trails
        </h2>
        {trails.length === 0 ? (
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            No trail data available for this park yet.
          </p>
        ) : (
          <div className="space-y-4">
            {trails.map((trail) => {
              const ext = trail as TrailExtended;
              const isMapExpanded = expandedTrailMap === trail.id;

              return (
                <div key={trail.id}>
                  <TrailDetailPanel trail={ext} parkCoordinates={park.coordinates} />
                  <button
                    type="button"
                    onClick={() => setExpandedTrailMap(isMapExpanded ? null : trail.id)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 min-h-[44px] text-xs font-medium text-brand-teal hover:text-brand-teal/80 hover:bg-brand-teal/5 transition-colors"
                    aria-expanded={isMapExpanded}
                    aria-controls={`trail-map-${trail.id}`}
                  >
                    <svg
                      aria-hidden="true"
                      className={`w-4 h-4 transition-transform ${isMapExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {isMapExpanded ? 'Hide Map' : 'Show Map'}
                  </button>
                  {isMapExpanded && (
                    <div id={`trail-map-${trail.id}`} className="mt-2">
                      <TrailMap trail={ext} trailheads={ext.trailheads ?? []} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="mt-6">
        <ReviewsSection targetType="park" targetId={parkId} isAuthenticated={true} />
      </section>

      {/* Top Sights */}
      {trails.some((t) => (t as TrailExtended).topSights?.length) && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Top Sights
          </h2>
          <div className="space-y-3">
            {trails.map((t) => {
              const ext = t as TrailExtended;
              if (!ext.topSights?.length) return null;
              return (
                <div key={t.id}>
                  <h3 className="text-sm font-semibold text-brand-forest dark:text-brand-moss font-heading mb-1">
                    {t.name}
                  </h3>
                  <ul className="space-y-1">
                    {ext.topSights.map((sight) => (
                      <li
                        key={sight}
                        className="flex items-start gap-2 text-sm text-brand-charcoal/80 dark:text-dark-text-muted"
                      >
                        <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-brand-teal" aria-hidden="true" />
                        {sight}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Weather */}
      <section className="mt-6">
        <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
          Weather
        </h2>
        {isOnline ? (
          <a
            href={buildWeatherUrl(park.coordinates)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-2.5 text-sm font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors"
          >
            Check Weather at {park.name}
          </a>
        ) : (
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            Weather data requires an internet connection.
          </p>
        )}
      </section>

      {/* Foraging Rules */}
      {park.foragingRules && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Foraging Rules
          </h2>
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {park.foragingRules}
            </p>
          </div>
        </section>
      )}

      {/* Contact Info */}
      {(park.phone || park.address || park.email || park.website) && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Contact
          </h2>
          <div className="space-y-1.5 text-sm text-brand-charcoal/80 dark:text-dark-text-muted">
            {park.phone && (
              <p>
                <span className="font-medium text-brand-charcoal dark:text-dark-text">Phone:</span>{' '}
                <a href={`tel:${park.phone}`} className="text-brand-teal hover:underline">{park.phone}</a>
              </p>
            )}
            {park.email && (
              <p>
                <span className="font-medium text-brand-charcoal dark:text-dark-text">Email:</span>{' '}
                <a href={`mailto:${park.email}`} className="text-brand-teal hover:underline">{park.email}</a>
              </p>
            )}
            {park.website && (
              <p>
                <span className="font-medium text-brand-charcoal dark:text-dark-text">Website:</span>{' '}
                <a href={park.website} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline">
                  {park.website}
                </a>
              </p>
            )}
            {park.address && (
              <p>
                <span className="font-medium text-brand-charcoal dark:text-dark-text">Address:</span>{' '}
                {park.address}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Getting There */}
      {park.gettingThere && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Getting There
          </h2>
          <p className="text-sm text-brand-charcoal/80 dark:text-dark-text-muted leading-relaxed">
            {park.gettingThere}
          </p>
        </section>
      )}

      {/* Get Directions */}
      <section className="mt-6">
        <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
          Get Directions
        </h2>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${park.coordinates.lat},${park.coordinates.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-2.5 text-sm font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          Open in Google Maps
        </a>
      </section>

      {/* Source */}
      {park.sourceUrl && (
        <section className="mt-6">
          <a
            href={park.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-teal hover:underline"
          >
            View on tnstateparks.com →
          </a>
        </section>
      )}
    </main>
  );
}
