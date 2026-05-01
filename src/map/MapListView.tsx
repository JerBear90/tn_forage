'use client';

import { useState, useCallback } from 'react';
import type { Park, Trail, TrailDifficulty } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ListTab = 'parks' | 'trails';

export interface MapListViewProps {
  parks: Park[];
  trails: Trail[];
  /** Look up a park name by its ID */
  getParkName: (parkId: string) => string | undefined;
  /** Called when a card is tapped — opens the detail panel */
  onItemClick: (type: 'park' | 'trail', id: string) => void;
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

// ---------------------------------------------------------------------------
// Image Placeholder (shared between park and trail cards)
// ---------------------------------------------------------------------------

function ImagePlaceholder({
  color,
  label,
  imageUrl,
}: {
  color: 'teal' | 'moss';
  label: string;
  imageUrl?: string;
}) {
  // Use the provided image URL, or fall back to a local placeholder
  const fallback = color === 'teal' ? '/images/park-placeholder.jpg' : '/images/trail-placeholder.jpg';
  const src = imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('http')) ? imageUrl : fallback;

  return (
    <div className="w-full aspect-[16/9] rounded-t-xl overflow-hidden bg-brand-charcoal/5 dark:bg-brand-charcoal/20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          // If the external URL fails, swap to local placeholder
          const target = e.currentTarget;
          if (target.src !== fallback && !target.src.endsWith(fallback)) {
            target.src = fallback;
          }
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Park Card — Large image card
// ---------------------------------------------------------------------------

function ParkCard({
  park,
  onClick,
}: {
  park: Park;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-xl bg-white dark:bg-dark-surface border border-brand-forest/10 dark:border-dark-border shadow-sm hover:shadow-md hover:border-brand-teal/30 transition-all touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal overflow-hidden"
        style={{ minHeight: '44px', minWidth: '44px' }}
        aria-label={`View details for ${park.name}`}
      >
        {/* Image area — occupies ~40%+ of card height via aspect ratio */}
        <ImagePlaceholder
          color="teal"
          label={park.name}
          imageUrl={park.image}
        />

        {/* Content area */}
        <div className="px-3 py-3">
          <h3 className="text-base font-bold text-brand-forest dark:text-brand-moss font-heading truncate">
            {park.name}
          </h3>
          <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-0.5">
            {park.region}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-brand-charcoal/70 dark:text-dark-text-muted">
            <span className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0a2.999 2.999 0 00.97-1.599L5.49 3h13.02l1.52 4.75A2.999 2.999 0 0021 9.349"
                />
              </svg>
              {park.amenities.length} amenities
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3l8.735 8.735m0 0a.374.374 0 11.53.53m-.53-.53l.53.53m0 0L21 21M14.652 9.348a3.75 3.75 0 010 5.304m2.121-7.425a6.75 6.75 0 010 9.546"
                />
              </svg>
              {park.trails.length} trail{park.trails.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Trail Card — Large image card
// ---------------------------------------------------------------------------

function TrailCard({
  trail,
  parkName,
  onClick,
}: {
  trail: Trail;
  parkName?: string;
  onClick: () => void;
}) {
  // Use the first trail image if available
  const imageUrl = trail.images?.[0] || undefined;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-xl bg-white dark:bg-dark-surface border border-brand-forest/10 dark:border-dark-border shadow-sm hover:shadow-md hover:border-brand-moss/30 transition-all touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal overflow-hidden"
        style={{ minHeight: '44px', minWidth: '44px' }}
        aria-label={`View details for ${trail.name}`}
      >
        {/* Image area — occupies ~40%+ of card height via aspect ratio */}
        <ImagePlaceholder
          color="moss"
          label={trail.name}
          imageUrl={imageUrl}
        />

        {/* Content area */}
        <div className="px-3 py-3">
          <h3 className="text-base font-bold text-brand-forest dark:text-brand-moss font-heading truncate">
            {trail.name}
          </h3>
          {parkName && (
            <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-0.5 truncate">
              {parkName}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-brand-charcoal/70 dark:text-dark-text-muted font-medium">
              {trail.distance} mi
            </span>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${DIFFICULTY_COLORS[trail.difficulty]}`}
            >
              {trail.difficulty}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main List View Component
// ---------------------------------------------------------------------------

export default function MapListView({
  parks,
  trails,
  getParkName,
  onItemClick,
}: MapListViewProps) {
  const [activeTab, setActiveTab] = useState<ListTab>('parks');

  const handleParkClick = useCallback(
    (parkId: string) => onItemClick('park', parkId),
    [onItemClick]
  );

  const handleTrailClick = useCallback(
    (trailId: string) => onItemClick('trail', trailId),
    [onItemClick]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div
        className="shrink-0 flex border-b border-brand-forest/10 dark:border-dark-border px-1"
        role="tablist"
        aria-label="List view tabs"
      >
        <button
          type="button"
          role="tab"
          id="tab-parks"
          aria-selected={activeTab === 'parks'}
          aria-controls="tabpanel-parks"
          onClick={() => setActiveTab('parks')}
          className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors touch-manipulation ${
            activeTab === 'parks'
              ? 'text-brand-teal border-b-2 border-brand-teal'
              : 'text-brand-charcoal/50 dark:text-dark-text-muted hover:text-brand-charcoal/70 dark:hover:text-dark-text'
          }`}
          style={{ minHeight: '44px' }}
        >
          Parks ({parks.length})
        </button>
        <button
          type="button"
          role="tab"
          id="tab-trails"
          aria-selected={activeTab === 'trails'}
          aria-controls="tabpanel-trails"
          onClick={() => setActiveTab('trails')}
          className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors touch-manipulation ${
            activeTab === 'trails'
              ? 'text-brand-moss border-b-2 border-brand-moss'
              : 'text-brand-charcoal/50 dark:text-dark-text-muted hover:text-brand-charcoal/70 dark:hover:text-dark-text'
          }`}
          style={{ minHeight: '44px' }}
        >
          Trails ({trails.length})
        </button>
      </div>

      {/* Parks tab panel */}
      <div
        id="tabpanel-parks"
        role="tabpanel"
        aria-labelledby="tab-parks"
        className={`flex-1 overflow-y-auto overscroll-contain ${activeTab === 'parks' ? '' : 'hidden'}`}
      >
        {parks.length === 0 ? (
          <p className="text-sm text-brand-charcoal/50 dark:text-dark-text-muted text-center py-8">
            No parks available.
          </p>
        ) : (
          <ul className="flex flex-col gap-3 p-3" aria-label="Parks list">
            {parks.map((park) => (
              <ParkCard
                key={park.id}
                park={park}
                onClick={() => handleParkClick(park.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Trails tab panel */}
      <div
        id="tabpanel-trails"
        role="tabpanel"
        aria-labelledby="tab-trails"
        className={`flex-1 overflow-y-auto overscroll-contain ${activeTab === 'trails' ? '' : 'hidden'}`}
      >
        {trails.length === 0 ? (
          <p className="text-sm text-brand-charcoal/50 dark:text-dark-text-muted text-center py-8">
            No trails available.
          </p>
        ) : (
          <ul className="flex flex-col gap-3 p-3" aria-label="Trails list">
            {trails.map((trail) => (
              <TrailCard
                key={trail.id}
                trail={trail}
                parkName={getParkName(trail.parkId)}
                onClick={() => handleTrailClick(trail.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
