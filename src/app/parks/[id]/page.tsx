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
import type { Park, Trail, TrailExtended, SocialPhoto, SocialPlatform, Coordinates } from '@/types';

const TrailMap = dynamic(() => import('@/components/parks/TrailMapRenderer'), { ssr: false });

// ---------------------------------------------------------------------------
// ParkWeatherCard — live weather for a specific park location
// ---------------------------------------------------------------------------

function ParkWeatherCard({ coordinates, parkName }: { coordinates: Coordinates; parkName: string }) {
  const [weather, setWeather] = useState<{ temp: number; forecast: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchWeather() {
      try {
        const pointRes = await fetch(
          `https://api.weather.gov/points/${coordinates.lat.toFixed(4)},${coordinates.lng.toFixed(4)}`,
          { headers: { 'User-Agent': 'ForageWise/1.0 (foragewise-app)' } }
        );
        if (!pointRes.ok) throw new Error('Failed');
        const pointData = await pointRes.json();
        const forecastUrl = pointData.properties?.forecastHourly;
        if (!forecastUrl) throw new Error('No forecast');

        const forecastRes = await fetch(forecastUrl, {
          headers: { 'User-Agent': 'ForageWise/1.0 (foragewise-app)' },
        });
        if (!forecastRes.ok) throw new Error('Failed');
        const forecastData = await forecastRes.json();
        const period = forecastData.properties?.periods?.[0];

        if (!cancelled && period) {
          const f = period.shortForecast.toLowerCase();
          let icon = '🌤️';
          if (f.includes('thunder') || f.includes('storm')) icon = '⛈️';
          else if (f.includes('rain') || f.includes('shower')) icon = '🌧️';
          else if (f.includes('snow')) icon = '🌨️';
          else if (f.includes('cloud') || f.includes('overcast')) icon = '☁️';
          else if (f.includes('clear') || f.includes('sunny')) icon = '☀️';

          setWeather({ temp: period.temperature, forecast: period.shortForecast, icon });
        }
      } catch {
        // Silently fail — weather is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchWeather();
    return () => { cancelled = true; };
  }, [coordinates]);

  if (loading) {
    return <div className="animate-pulse h-16 rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5" />;
  }

  if (!weather) {
    return (
      <a
        href={buildWeatherUrl(coordinates)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-2.5 text-sm font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors"
      >
        Check Weather at {parkName}
      </a>
    );
  }

  return (
    <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/5 dark:bg-brand-teal/10 p-3 flex items-center gap-3">
      <span className="text-3xl" aria-hidden="true">{weather.icon}</span>
      <div>
        <p className="text-lg font-bold text-brand-charcoal dark:text-dark-text">{weather.temp}°F</p>
        <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70">{weather.forecast}</p>
      </div>
    </div>
  );
}

/** Platform display names for aria-labels */
const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

/** SVG icons for each social platform */
function SocialIcon({ platform }: { platform: SocialPlatform }) {
  switch (platform) {
    case 'facebook':
      return (
        <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case 'x':
      return (
        <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
  }
}

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
        href={`/trips/new?parkId=${park.id}`}
        aria-label={`Plan a visit to ${park.name}`}
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
            {/* All trails map — shows trail overview */}
            {trails.some((t) => (t as TrailExtended).coordinates?.length) && (
              <div className="rounded-xl overflow-hidden border border-brand-forest/10 dark:border-dark-border" style={{ height: '250px' }}>
                <TrailMap
                  trail={trails.find((t) => (t as TrailExtended).coordinates?.length) as TrailExtended}
                  trailheads={(trails.find((t) => (t as TrailExtended).trailheads?.length) as TrailExtended)?.trailheads ?? []}
                />
              </div>
            )}

            {/* Trail list */}
            {trails.map((trail) => {
              const ext = trail as TrailExtended;
              return (
                <div key={trail.id}>
                  <TrailDetailPanel trail={ext} parkCoordinates={park.coordinates} />
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

      {/* Weather — live conditions based on park location */}
      <section className="mt-6">
        <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
          Weather
        </h2>
        {isOnline ? (
          <ParkWeatherCard coordinates={park.coordinates} parkName={park.name} />
        ) : (
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            Go online to see live weather for this park.
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

      {/* Social Profiles — Follow This Park */}
      {park.socialProfiles && Object.values(park.socialProfiles).some(Boolean) && (
        <section className="mt-6">
          <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
            Follow This Park
          </h2>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(park.socialProfiles) as [SocialPlatform, string | undefined][])
              .filter(([, url]) => !!url)
              .map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${park.name} on ${PLATFORM_NAMES[platform]}`}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-brand-teal/20 bg-brand-teal/5 text-brand-teal hover:bg-brand-teal/10 hover:border-brand-teal/40 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                >
                  <SocialIcon platform={platform} />
                </a>
              ))}
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
