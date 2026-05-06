"use client";

/**
 * ForageWise — SkeletonDetail Component
 *
 * Full-page skeleton loading placeholder matching the species/plant detail
 * page layout. Displays animated placeholders for:
 *   - Title + scientific name + badges (header)
 *   - Image gallery hero
 *   - Habitat section
 *   - Identification steps section
 *   - Safety notes / toxic lookalikes section
 *   - Sources section
 *
 * Uses TailwindCSS `animate-pulse` for a shimmer effect to indicate loading.
 */

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading species details">
      {/* ---- Header ---- */}
      <header className="space-y-2">
        {/* Common name */}
        <div className="h-7 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-3/4" />
        {/* Scientific name */}
        <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-1/2" />
        {/* Badges */}
        <div className="flex gap-2 mt-3">
          <div className="h-5 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-full w-20" />
          <div className="h-5 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-full w-28" />
        </div>
      </header>

      {/* ---- Image gallery hero ---- */}
      <div className="h-48 bg-brand-sand/40 dark:bg-brand-charcoal/40 rounded-lg" />

      {/* ---- Habitat section ---- */}
      <section className="space-y-2">
        <div className="h-5 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-24" />
        <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-full" />
        <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-5/6" />
      </section>

      {/* ---- Tree associations section ---- */}
      <section className="space-y-2">
        <div className="h-5 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-36" />
        <div className="flex gap-2">
          <div className="h-6 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-full w-20" />
          <div className="h-6 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-full w-24" />
          <div className="h-6 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-full w-16" />
        </div>
      </section>

      {/* ---- Identification steps section ---- */}
      <section className="space-y-2">
        <div className="h-5 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-40" />
        <div className="space-y-1.5">
          <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-full" />
          <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-11/12" />
          <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-5/6" />
          <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-full" />
        </div>
      </section>

      {/* ---- Toxic lookalikes / safety section ---- */}
      <section className="space-y-2">
        <div className="h-5 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-36" />
        <div className="rounded-lg border-2 border-brand-charcoal/5 dark:border-brand-sand/5 p-3 space-y-2">
          <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-full" />
          <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-3/4" />
        </div>
      </section>

      {/* ---- Safety notes section ---- */}
      <section className="space-y-2">
        <div className="h-5 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-28" />
        <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-full" />
        <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-2/3" />
      </section>

      {/* ---- Sources section ---- */}
      <section className="space-y-2">
        <div className="h-5 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-20" />
        <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-4/5" />
        <div className="h-3 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-3/5" />
      </section>

      <span className="sr-only">Loading species details…</span>
    </div>
  );
}
