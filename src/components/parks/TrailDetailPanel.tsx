'use client';

/**
 * TrailDetailPanel — Displays extended trail metadata for a single trail.
 *
 * Shows trail length, elevation gain, estimated hiking time, difficulty badge,
 * trail type, surface type, and trailhead locations with "Get Directions" links.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 */

import type { TrailExtended, Coordinates } from '@/types';
import { estimateHikingTime, formatHikingTime } from '@/utils/trailUtils';
import { buildDirectionsUrl } from '@/utils/directionsUtils';

// ---------------------------------------------------------------------------
// Difficulty badge colors (matches park detail page pattern)
// ---------------------------------------------------------------------------

const difficultyColors: Record<string, string> = {
  easy: 'bg-brand-moss-100 text-brand-moss-700 dark:bg-brand-moss-800 dark:text-brand-moss-200',
  moderate: 'bg-brand-earth-100 text-brand-earth-700 dark:bg-brand-earth-800 dark:text-brand-earth-200',
  hard: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  expert: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
};

// ---------------------------------------------------------------------------
// Trail type display labels
// ---------------------------------------------------------------------------

const trailTypeLabels: Record<string, string> = {
  loop: 'Loop',
  'out-and-back': 'Out & Back',
  'point-to-point': 'Point-to-Point',
};

// ---------------------------------------------------------------------------
// Surface type display labels
// ---------------------------------------------------------------------------

const surfaceTypeLabels: Record<string, string> = {
  paved: 'Paved',
  gravel: 'Gravel',
  dirt: 'Dirt',
  rocky: 'Rocky',
  mixed: 'Mixed',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TrailDetailPanelProps {
  trail: TrailExtended;
  parkCoordinates: Coordinates;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrailDetailPanel({ trail, parkCoordinates }: TrailDetailPanelProps) {
  const hikingMinutes = estimateHikingTime(trail.distance, trail.elevationGain ?? 0);
  const hikingTimeStr = formatHikingTime(hikingMinutes);

  return (
    <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 p-4">
      {/* Trail name */}
      <h3 className="text-base font-semibold text-brand-forest dark:text-brand-moss font-heading">
        {trail.name}
      </h3>

      {/* Stats row: distance, elevation, time */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-charcoal/80 dark:text-dark-text-muted">
        <span>{trail.distance} {trail.distance === 1 ? 'mile' : 'miles'}</span>
        {trail.elevationGain != null && trail.elevationGain > 0 && (
          <span>{trail.elevationGain.toLocaleString()} ft gain</span>
        )}
        <span>~{hikingTimeStr}</span>
      </div>

      {/* Badges row: difficulty, trail type, surface type */}
      <div className="mt-3 flex flex-wrap gap-2">
        {/* Difficulty badge */}
        <span
          className={`inline-block text-xs font-medium rounded-full px-2.5 py-1 ${difficultyColors[trail.difficulty] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
        >
          {trail.difficulty.charAt(0).toUpperCase() + trail.difficulty.slice(1)}
        </span>

        {/* Trail type badge */}
        {trail.trailType && (
          <span className="inline-block text-xs font-medium rounded-full px-2.5 py-1 bg-brand-teal/10 text-brand-teal dark:bg-brand-teal/20 dark:text-brand-teal-300">
            {trailTypeLabels[trail.trailType] ?? trail.trailType}
          </span>
        )}

        {/* Surface type badge */}
        {trail.surfaceType && (
          <span className="inline-block text-xs font-medium rounded-full px-2.5 py-1 bg-brand-sand/40 text-brand-charcoal/70 dark:bg-brand-charcoal/40 dark:text-dark-text-muted">
            {surfaceTypeLabels[trail.surfaceType] ?? trail.surfaceType}
          </span>
        )}
      </div>

      {/* Trailheads with directions links */}
      {trail.trailheads && trail.trailheads.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-brand-charcoal/60 dark:text-dark-text-muted uppercase tracking-wide">
            Trailheads
          </p>
          {trail.trailheads.map((trailhead, idx) => (
            <div key={`${trailhead.name}-${idx}`} className="flex items-center justify-between gap-2">
              <span className="text-sm text-brand-charcoal dark:text-dark-text truncate">
                {trailhead.name}
              </span>
              <a
                href={buildDirectionsUrl(trailhead.coordinates)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 min-h-[44px] text-xs font-medium text-brand-teal hover:text-brand-teal/80 hover:bg-brand-teal/5 transition-colors"
                aria-label={`Get directions to ${trailhead.name}`}
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Get Directions
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Fallback: directions to park if no trailheads */}
      {(!trail.trailheads || trail.trailheads.length === 0) && (
        <a
          href={buildDirectionsUrl(trail.coordinates?.[0] ?? parkCoordinates)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 min-h-[44px] text-xs font-medium text-brand-teal hover:text-brand-teal/80 hover:bg-brand-teal/5 transition-colors"
          aria-label={`Get directions to ${trail.name} trailhead`}
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          Get Directions to Trailhead
        </a>
      )}
    </div>
  );
}
