'use client';

import { useEffect, useRef } from 'react';
import type { Park, Trail, Route, TrailDifficulty } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DetailPanelItem =
  | { type: 'park'; data: Park }
  | { type: 'trail'; data: Trail; parkName?: string }
  | { type: 'route'; data: Route; parkName?: string };

export interface MapDetailPanelProps {
  item: DetailPanelItem | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIFFICULTY_COLORS: Record<TrailDifficulty, string> = {
  easy: 'bg-brand-moss/20 text-brand-moss',
  moderate: 'bg-brand-earth/20 text-brand-earth',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  expert: 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

function DifficultyBadge({ difficulty }: { difficulty: TrailDifficulty }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${DIFFICULTY_COLORS[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Park Detail
// ---------------------------------------------------------------------------

function ParkDetail({ park }: { park: Park }) {
  return (
    <div className="space-y-3">
      {/* Region */}
      <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 font-medium uppercase tracking-wide">
        {park.region}
      </p>

      {/* Hours & Fees */}
      {park.hours && (
        <div>
          <h4 className="text-xs font-semibold text-brand-charcoal/70 dark:text-brand-sand/70 mb-0.5">
            Hours
          </h4>
          <p className="text-sm text-brand-charcoal dark:text-brand-sand">
            {park.hours}
          </p>
        </div>
      )}
      {park.fees && (
        <div>
          <h4 className="text-xs font-semibold text-brand-charcoal/70 dark:text-brand-sand/70 mb-0.5">
            Fees
          </h4>
          <p className="text-sm text-brand-charcoal dark:text-brand-sand">
            {park.fees}
          </p>
        </div>
      )}

      {/* Amenities */}
      {park.amenities.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">
            Amenities
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {park.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-block px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal text-xs"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Foraging Rules */}
      <div className="rounded-lg bg-brand-earth/10 dark:bg-brand-earth/20 border border-brand-earth/20 px-3 py-2">
        <h4 className="text-xs font-semibold text-brand-earth mb-0.5">
          Foraging Rules
        </h4>
        <p className="text-xs text-brand-charcoal/80 dark:text-brand-sand/80">
          {park.foragingRules}
        </p>
      </div>

      {/* Trails link */}
      {park.trails.length > 0 && (
        <p className="text-xs text-brand-teal font-medium">
          {park.trails.length} trail{park.trails.length !== 1 ? 's' : ''} in
          this park
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trail / Route Detail (shared layout)
// ---------------------------------------------------------------------------

function TrailRouteDetail({
  name,
  parkName,
  distance,
  difficulty,
  likelyTrees,
  likelySpecies,
  isRoute,
}: {
  name: string;
  parkName?: string;
  distance: number;
  difficulty: TrailDifficulty;
  likelyTrees: string[];
  likelySpecies: string[];
  isRoute: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Park name */}
      {parkName && (
        <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 font-medium uppercase tracking-wide">
          {parkName}
        </p>
      )}

      {/* Distance + Difficulty */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-brand-charcoal dark:text-brand-sand font-medium">
          {distance} mi
        </span>
        <DifficultyBadge difficulty={difficulty} />
        {isRoute && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-brand-earth/15 text-brand-earth text-xs font-semibold">
            Route
          </span>
        )}
      </div>

      {/* Likely Trees */}
      {likelyTrees.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">
            Likely Trees
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {likelyTrees.map((tree) => (
              <span
                key={tree}
                className="inline-block px-2 py-0.5 rounded-full bg-brand-forest/10 text-brand-forest dark:bg-brand-forest/20 dark:text-brand-moss text-xs"
              >
                {tree}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Likely Species */}
      {likelySpecies.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">
            Likely Species
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {likelySpecies.map((species) => (
              <span
                key={species}
                className="inline-block px-2 py-0.5 rounded-full bg-brand-moss/10 text-brand-moss text-xs"
              >
                {species.replace(/^sp-/, '').replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel Component
// ---------------------------------------------------------------------------

export default function MapDetailPanel({ item, onClose }: MapDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when the panel opens for accessibility
  useEffect(() => {
    if (item && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [item]);

  // Handle Escape key to close
  useEffect(() => {
    if (!item) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const title =
    item.type === 'park'
      ? item.data.name
      : item.type === 'trail'
        ? item.data.name
        : item.data.name;

  const typeLabel =
    item.type === 'park' ? 'Park' : item.type === 'trail' ? 'Trail' : 'Route';

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`${typeLabel} details: ${title}`}
      aria-modal="false"
      className="absolute bottom-0 left-0 right-0 z-[1000] animate-slide-up"
    >
      <div className="mx-2 mb-2 max-h-[60vh] rounded-xl bg-white dark:bg-brand-charcoal-800 border border-brand-forest/10 dark:border-brand-charcoal/30 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-brand-forest/5 dark:border-brand-charcoal/20 shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-brand-forest dark:text-brand-moss font-heading truncate">
              {title}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${typeLabel.toLowerCase()} details`}
            className="shrink-0 -mt-1 -mr-1 p-2 rounded-lg hover:bg-brand-charcoal/5 dark:hover:bg-white/10 transition-colors touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5 text-brand-charcoal/60 dark:text-brand-sand/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-4 py-3 overscroll-contain">
          {item.type === 'park' && <ParkDetail park={item.data} />}
          {item.type === 'trail' && (
            <TrailRouteDetail
              name={item.data.name}
              parkName={item.parkName}
              distance={item.data.distance}
              difficulty={item.data.difficulty}
              likelyTrees={item.data.likelyTrees}
              likelySpecies={item.data.likelySpecies}
              isRoute={false}
            />
          )}
          {item.type === 'route' && (
            <TrailRouteDetail
              name={item.data.name}
              parkName={item.parkName}
              distance={item.data.distance}
              difficulty={item.data.difficulty}
              likelyTrees={item.data.likelyTrees}
              likelySpecies={item.data.likelySpecies}
              isRoute={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
