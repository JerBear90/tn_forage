"use client";

/**
 * ForageFlow — SeasonalHighlights Component
 *
 * Renders seasonal species highlights with images, common name,
 * active season, and habitat. Each highlight is tappable and
 * navigates to `/field-guide/{species-id}`.
 *
 * Requirements: 11.1, 11.7
 */

import Link from "next/link";
import { useSeasonalHighlights } from "@/hooks/useSeasonalHighlights";

export default function SeasonalHighlights() {
  const { highlights, currentSeason, loading, error } =
    useSeasonalHighlights();

  if (loading) {
    return (
      <section aria-label="Seasonal highlights" className="space-y-3">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          {currentSeason} Highlights
        </h2>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          aria-busy="true"
          aria-live="polite"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-44 h-52 rounded-xl bg-brand-charcoal/5 dark:bg-brand-sand/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Seasonal highlights" className="space-y-3">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          {currentSeason} Highlights
        </h2>
        <div
          role="alert"
          className="rounded-lg border border-brand-earth/20 bg-brand-earth/10 p-4 text-center"
        >
          <p className="text-sm text-brand-earth dark:text-brand-earth-200">
            Unable to load seasonal highlights.
          </p>
        </div>
      </section>
    );
  }

  if (highlights.length === 0) {
    return (
      <section aria-label="Seasonal highlights" className="space-y-3">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          {currentSeason} Highlights
        </h2>
        <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 p-6 text-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            No species highlights for this season yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Seasonal highlights" className="space-y-3">
      <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
        {currentSeason} Highlights
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {highlights.map((item) => (
          <Link
            key={item.id}
            href={`/field-guide/${item.id}`}
            className="flex-shrink-0 w-44 rounded-xl border border-brand-teal/10 bg-white/80 dark:bg-dark-surface/80 overflow-hidden transition-colors hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98]"
            aria-label={`View ${item.commonName}`}
          >
            {/* Image */}
            <div className="relative w-full h-28 bg-brand-charcoal/5 dark:bg-brand-sand/5">
              {item.images.length > 0 ? (
                <img
                  src={item.images[0]}
                  alt={item.commonName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 text-brand-charcoal/20 dark:text-brand-sand/20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3">
              <p className="font-semibold text-sm text-brand-charcoal dark:text-dark-text truncate">
                {item.commonName}
              </p>
              <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-0.5 line-clamp-2">
                {item.habitat}
              </p>
              <span className="inline-block mt-1.5 text-xs font-medium text-brand-teal bg-brand-teal/10 rounded-full px-2 py-0.5">
                {item.season.join(", ")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
