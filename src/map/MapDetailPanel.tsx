'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Park, Trail, Route, TrailDifficulty } from '@/types';
import type { ParkCondition, ConditionRating } from '@/hooks/useForagingConditions';

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
  /** Foraging conditions lookup — keyed by parkId */
  conditionsMap?: Record<string, ParkCondition>;
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
// Foraging Condition Badge
// ---------------------------------------------------------------------------

const CONDITION_STYLES: Record<ConditionRating, { bg: string; icon: string; label: string }> = {
  excellent: { bg: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700', icon: '🟢', label: 'Excellent' },
  good:      { bg: 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-700', icon: '🟡', label: 'Good' },
  fair:      { bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700', icon: '🟠', label: 'Fair' },
  poor:      { bg: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600', icon: '⚪', label: 'Poor' },
};

/** Compact inline condition summary for the preview */
function ConditionSummary({ condition }: { condition: ParkCondition }) {
  const style = CONDITION_STYLES[condition.rating];
  return (
    <div className={`rounded-lg border px-2.5 py-2 text-xs ${style.bg}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">{style.icon} {style.label}</span>
        <span className="font-bold">{condition.score}/100</span>
      </div>
      <div className="flex items-center gap-2 mt-1.5 opacity-80">
        <span title="Mushroom">🍄 {condition.mushroom.score}</span>
        <span title="Plant">🌿 {condition.plant.score}</span>
        <span title="Tree">🌳 {condition.tree.score}</span>
      </div>
      {condition.weather && (
        <div className="flex items-center gap-2.5 mt-1.5 text-[11px] opacity-70">
          <span>☀️ {condition.weather.conditions}</span>
          <span>🌡️ {condition.weather.temperatureF}°F</span>
          <span>💧 {condition.weather.humidity}%</span>
        </div>
      )}
    </div>
  );
}

/** Full condition badge with per-category breakdown */
function ConditionBadge({ condition }: { condition: ParkCondition }) {
  const style = CONDITION_STYLES[condition.rating];
  const categories = [
    { key: 'mushroom', icon: '🍄', label: 'Mushroom', data: condition.mushroom },
    { key: 'plant', icon: '🌿', label: 'Plant', data: condition.plant },
    { key: 'tree', icon: '🌳', label: 'Tree', data: condition.tree },
  ] as const;

  return (
    <div className={`rounded-lg border p-2.5 ${style.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">
          {style.icon} Foraging: {style.label}
        </span>
        <span className="text-xs font-bold">{condition.score}/100</span>
      </div>
      <div className="flex gap-2 mb-2">
        {categories.map((cat) => (
          <div
            key={cat.key}
            className="flex-1 rounded-md bg-white/50 dark:bg-black/10 px-2 py-1.5 text-center"
          >
            <span className="text-sm" aria-hidden="true">{cat.icon}</span>
            <p className="text-[10px] font-semibold mt-0.5">{cat.data.score}</p>
            <p className="text-[9px] opacity-70">{cat.data.rating}</p>
          </div>
        ))}
      </div>
      {condition.weather && (
        <div className="flex items-center gap-3 text-[11px] mt-1">
          <span className="flex items-center gap-1">
            <span aria-hidden="true">☀️</span>
            <span className="font-medium">{condition.weather.conditions}</span>
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden="true">🌡️</span>
            <span>{condition.weather.temperatureF}°F</span>
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden="true">💧</span>
            <span>{condition.weather.humidity}%</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Park Detail (full expanded view)
// ---------------------------------------------------------------------------

function ParkDetail({ park, condition, imgSrc }: { park: Park; condition?: ParkCondition; imgSrc: string | null }) {
  return (
    <div className="space-y-3">
      {/* Park image — always visible */}
      {imgSrc && (
        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-brand-charcoal/5 dark:bg-brand-charcoal/20 -mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={park.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = '/images/park-placeholder.jpg'; }}
          />
        </div>
      )}

      {/* Foraging Conditions */}
      {condition && <ConditionBadge condition={condition} />}

      {/* Hours & Fees */}
      {park.hours && (
        <div>
          <h4 className="text-xs font-semibold text-brand-charcoal/70 dark:text-dark-text-muted mb-0.5">Hours</h4>
          <p className="text-sm text-brand-charcoal dark:text-dark-text">{park.hours}</p>
        </div>
      )}
      {park.fees && (
        <div>
          <h4 className="text-xs font-semibold text-brand-charcoal/70 dark:text-dark-text-muted mb-0.5">Fees</h4>
          <p className="text-sm text-brand-charcoal dark:text-dark-text">{park.fees}</p>
        </div>
      )}

      {/* Amenities */}
      {park.amenities.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-brand-charcoal/70 dark:text-dark-text-muted mb-1">Amenities</h4>
          <div className="flex flex-wrap gap-1.5">
            {park.amenities.map((amenity) => (
              <span key={amenity} className="inline-block px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal text-xs">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Foraging Rules */}
      <div className="rounded-lg bg-brand-earth/10 dark:bg-brand-earth/20 border border-brand-earth/20 px-3 py-2">
        <h4 className="text-xs font-semibold text-brand-earth mb-0.5">Foraging Rules</h4>
        <p className="text-xs text-brand-charcoal/80 dark:text-dark-text-muted">{park.foragingRules}</p>
      </div>

      {/* Trails link */}
      {park.trails.length > 0 && (
        <p className="text-xs text-brand-teal font-medium">
          {park.trails.length} trail{park.trails.length !== 1 ? 's' : ''} in this park
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trail / Route Detail
// ---------------------------------------------------------------------------

function TrailRouteDetail({
  parkName,
  distance,
  difficulty,
  likelyTrees,
  likelySpecies,
  isRoute,
}: {
  parkName?: string;
  distance: number;
  difficulty: TrailDifficulty;
  likelyTrees: string[];
  likelySpecies: string[];
  isRoute: boolean;
}) {
  return (
    <div className="space-y-3">
      {parkName && (
        <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted font-medium uppercase tracking-wide">
          {parkName}
        </p>
      )}
      <div className="flex items-center gap-3">
        <span className="text-sm text-brand-charcoal dark:text-dark-text font-medium">{distance} mi</span>
        <DifficultyBadge difficulty={difficulty} />
        {isRoute && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-brand-earth/15 text-brand-earth text-xs font-semibold">Route</span>
        )}
      </div>
      {likelyTrees.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-brand-charcoal/70 dark:text-dark-text-muted mb-1">Likely Trees</h4>
          <div className="flex flex-wrap gap-1.5">
            {likelyTrees.map((tree) => (
              <span key={tree} className="inline-block px-2 py-0.5 rounded-full bg-brand-forest/10 text-brand-forest dark:bg-brand-forest/20 dark:text-brand-moss text-xs">{tree}</span>
            ))}
          </div>
        </div>
      )}
      {likelySpecies.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-brand-charcoal/70 dark:text-dark-text-muted mb-1">Likely Species</h4>
          <div className="flex flex-wrap gap-1.5">
            {likelySpecies.map((species) => (
              <span key={species} className="inline-block px-2 py-0.5 rounded-full bg-brand-moss/10 text-brand-moss text-xs">
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

export default function MapDetailPanel({ item, onClose, conditionsMap }: MapDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  // Reset expanded state when item changes
  useEffect(() => {
    setExpanded(false);
  }, [item?.type === 'park' ? item.data.id : item?.type === 'trail' ? item.data.id : item?.data?.id]);

  // Focus the close button when the panel opens
  useEffect(() => {
    if (item && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [item]);

  // Escape to close
  useEffect(() => {
    if (!item) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  // Focus trap
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, []);

  useEffect(() => {
    if (!item) return;
    document.addEventListener('keydown', handleFocusTrap);
    return () => document.removeEventListener('keydown', handleFocusTrap);
  }, [item, handleFocusTrap]);

  if (!item) return null;

  const title = item.data.name;
  const typeLabel = item.type === 'park' ? 'Park' : item.type === 'trail' ? 'Trail' : 'Route';

  // Determine the ID for "Plan a Visit" link
  const planVisitId = item.type === 'park'
    ? item.data.id
    : item.type === 'trail'
      ? item.data.parkId
      : item.data.parkId;

  const condition = item.type === 'park' ? conditionsMap?.[item.data.id] : undefined;

  // Image for preview
  const imgSrc = item.type === 'park'
    ? (item.data.image && (item.data.image.startsWith('/') || item.data.image.startsWith('http'))
        ? item.data.image
        : '/images/park-placeholder.jpg')
    : null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`${typeLabel} details: ${title}`}
      aria-modal="false"
      className="absolute top-0 left-0 right-0 z-[1000] animate-slide-down"
    >
      <div className="mx-2 mt-2 max-h-[50vh] rounded-xl bg-white dark:bg-dark-surface border border-brand-forest/10 dark:border-dark-border shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-brand-forest/5 dark:border-dark-border shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-brand-forest dark:text-brand-moss font-heading truncate">
              {title}
            </h3>
            {item.type === 'park' && (
              <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-0.5">
                {item.data.region}
              </p>
            )}
            {(item.type === 'trail' || item.type === 'route') && item.parkName && (
              <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-0.5">
                {item.parkName}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${typeLabel.toLowerCase()} details`}
            className="shrink-0 -mt-1 -mr-1 p-2 rounded-lg hover:bg-brand-charcoal/5 dark:hover:bg-white/10 transition-colors touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <svg aria-hidden="true" className="w-5 h-5 text-brand-charcoal/60 dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-4 py-3 overscroll-contain">
          {/* Preview: image + condition summary + action buttons */}
          {!expanded && (
            <div className="space-y-3">
              {/* Park image preview */}
              {imgSrc && (
                <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-brand-charcoal/5 dark:bg-brand-charcoal/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/images/park-placeholder.jpg'; }}
                  />
                </div>
              )}

              {/* Trail/Route quick info */}
              {(item.type === 'trail' || item.type === 'route') && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-brand-charcoal dark:text-dark-text font-medium">
                    {item.data.distance} mi
                  </span>
                  <DifficultyBadge difficulty={item.data.difficulty} />
                  {item.type === 'route' && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-brand-earth/15 text-brand-earth text-xs font-semibold">Route</span>
                  )}
                </div>
              )}

              {/* Condition summary */}
              {condition && <ConditionSummary condition={condition} />}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-brand-teal/30 bg-white dark:bg-dark-surface px-3 py-2.5 text-sm font-semibold text-brand-teal hover:bg-brand-teal/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/trips/new?parkId=${planVisitId}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-brand-teal px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-teal/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Plan a Visit
                </button>
              </div>
            </div>
          )}

          {/* Expanded: full detail content */}
          {expanded && (
            <>
              {item.type === 'park' && (
                <ParkDetail park={item.data} condition={condition} imgSrc={imgSrc} />
              )}
              {item.type === 'trail' && (
                <TrailRouteDetail
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
                  parkName={item.parkName}
                  distance={item.data.distance}
                  difficulty={item.data.difficulty}
                  likelyTrees={item.data.likelyTrees}
                  likelySpecies={item.data.likelySpecies}
                  isRoute={true}
                />
              )}

              {/* Plan a Visit button at bottom of expanded view too */}
              <div className="mt-4 pt-3 border-t border-brand-forest/5 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => router.push(`/trips/new?parkId=${planVisitId}`)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-brand-teal px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-teal/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Plan a Visit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
