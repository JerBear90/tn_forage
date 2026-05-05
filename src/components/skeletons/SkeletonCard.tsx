"use client";

/**
 * ForageWise — SkeletonCard Component
 *
 * Reusable skeleton loading placeholder for card-based layouts.
 * Supports three variants matching the real card structures:
 *   - species: image placeholder + name + scientific name + category/edibility badges
 *   - sighting: image placeholder + header + notes area
 *   - park: image placeholder + name + region badge
 *
 * Uses TailwindCSS `animate-pulse` for a shimmer effect to indicate loading.
 */

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SkeletonCardProps {
  /** Card layout variant matching the real card it replaces */
  variant: "species" | "sighting" | "park";
}

// ---------------------------------------------------------------------------
// Variant renderers
// ---------------------------------------------------------------------------

/** Species card skeleton — matches SpeciesCard in field-guide/page.tsx */
function SpeciesSkeleton() {
  return (
    <div className="rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 overflow-hidden animate-pulse">
      {/* Image placeholder (aspect 4:3) */}
      <div className="aspect-[4/3] bg-brand-sand/40 dark:bg-brand-charcoal/40" />

      {/* Card body */}
      <div className="p-3 space-y-2">
        {/* Common name */}
        <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-3/4" />
        {/* Scientific name */}
        <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-1/2" />
        {/* Badges */}
        <div className="flex gap-1.5">
          <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-full w-16" />
          <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

/** Sighting card skeleton — matches SightingCard in community/page.tsx */
function SightingSkeleton() {
  return (
    <div className="rounded-xl border border-brand-teal/15 bg-white/80 dark:bg-brand-charcoal/60 p-4 animate-pulse">
      {/* Species image placeholder */}
      <div className="w-full h-36 rounded-lg bg-brand-sand/40 dark:bg-brand-charcoal/40 mb-3" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Species guess / title */}
          <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-2/3" />
          {/* Date */}
          <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-1/3" />
        </div>
        {/* Visibility badge */}
        <div className="h-5 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-full w-16 shrink-0" />
      </div>

      {/* Notes area */}
      <div className="space-y-1.5 mb-2">
        <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-full" />
        <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-4/5" />
      </div>

      {/* Action buttons placeholder */}
      <div className="flex items-center gap-2 border-t border-brand-teal/10 pt-3">
        <div className="h-8 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-lg w-24" />
        <div className="h-8 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-lg w-24" />
      </div>
    </div>
  );
}

/** Park card skeleton — matches park cards in ParkPicker.tsx */
function ParkSkeleton() {
  return (
    <div className="rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 overflow-hidden animate-pulse">
      {/* Park image placeholder */}
      <div className="w-full h-28 bg-brand-sand/40 dark:bg-brand-charcoal/40" />

      {/* Park info */}
      <div className="p-2.5 space-y-2">
        {/* Park name */}
        <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-3/4" />
        {/* Region badge */}
        <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-full w-16" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SkeletonCard({ variant }: SkeletonCardProps) {
  return (
    <div role="status" aria-label={`Loading ${variant} card`}>
      {variant === "species" && <SpeciesSkeleton />}
      {variant === "sighting" && <SightingSkeleton />}
      {variant === "park" && <ParkSkeleton />}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
