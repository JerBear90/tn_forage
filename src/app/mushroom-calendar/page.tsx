'use client';

/**
 * ForageFlow — Mushroom Calendar Page
 *
 * Displays all 12 months of the year with mushroom species in season,
 * image thumbnails, monthly foraging tips, and a safety disclaimer.
 * Current month is highlighted with a visual indicator.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 10.1, 10.3
 */

import Link from 'next/link';
import { useMushroomCalendar } from '@/hooks/useMushroomCalendar';
import DismissibleDisclaimer from '@/components/DismissibleDisclaimer';
import SpeciesImage, { pickImageUrl } from '@/components/SpeciesImage';

export default function MushroomCalendarPage() {
  const { months, currentMonth, loading, error } = useMushroomCalendar();

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 pb-24 max-w-2xl mx-auto">
      {/* Breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <Link
          href="/field-guide"
          className="inline-flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-teal-600 dark:text-brand-teal-300 dark:hover:text-brand-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
          aria-label="Back to Field Guide"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Field Guide
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Mushroom Calendar
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-dark-text-muted mt-1">
          See which mushrooms are in season each month in Tennessee.
        </p>
      </header>

      {/* Safety disclaimer — Requirement 10.3 (dismissible) */}
      <DismissibleDisclaimer storageKey="forageflow-calendar-disclaimer-ack">
        <p>
          All identifications shown are possible matches only. Always verify
          with a qualified expert before consuming any foraged species.
        </p>
      </DismissibleDisclaimer>

      {/* Error state */}
      {error && (
        <div
          className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 mb-6 text-sm text-red-700 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div role="status" aria-label="Loading mushroom calendar">
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-brand-charcoal/10 dark:border-dark-border p-4 animate-pulse"
              >
                <div className="h-6 w-32 bg-brand-charcoal/10 dark:bg-dark-border rounded mb-3" />
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="shrink-0 w-24">
                      <div className="w-24 h-20 bg-brand-charcoal/10 dark:bg-dark-border rounded-lg mb-2" />
                      <div className="h-3 w-20 bg-brand-charcoal/10 dark:bg-dark-border rounded" />
                    </div>
                  ))}
                </div>
                <div className="h-4 w-full bg-brand-charcoal/10 dark:bg-dark-border rounded mt-3" />
              </div>
            ))}
          </div>
          <span className="sr-only">Loading mushroom calendar…</span>
        </div>
      )}

      {/* Month sections */}
      {!loading && !error && (
        <div className="space-y-6">
          {months.map((monthData) => {
            const isCurrent = monthData.month === currentMonth;

            return (
              <section
                key={monthData.month}
                aria-label={`${monthData.label}${isCurrent ? ' (current month)' : ''}`}
                className={`rounded-xl border p-4 transition-colors ${
                  isCurrent
                    ? 'ring-2 ring-brand-moss border-brand-moss/40 bg-brand-moss/5 dark:bg-brand-moss/10'
                    : 'border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80'
                }`}
              >
                {/* Month heading */}
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text">
                    {monthData.label}
                  </h2>
                  {isCurrent && (
                    <span className="inline-flex items-center rounded-full bg-brand-moss/20 text-brand-moss px-2 py-0.5 text-xs font-medium">
                      Current
                    </span>
                  )}
                </div>

                {/* Species grid */}
                {monthData.species.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {monthData.species.map((species) => (
                      <Link
                        key={species.id}
                        href={`/field-guide/${species.id}`}
                        className="shrink-0 w-28 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal rounded-lg"
                      >
                        <SpeciesImage
                          src={pickImageUrl(species.image ? [species.image] : [])}
                          alt={species.commonName}
                          variant="seasonal"
                          className="w-28 h-20 rounded-lg"
                        />
                        <p className="mt-1.5 text-xs font-medium text-brand-charcoal dark:text-dark-text leading-tight group-hover:text-brand-teal transition-colors line-clamp-2">
                          {species.commonName}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-charcoal/50 dark:text-dark-text-muted italic">
                    No mushroom species in season this month.
                  </p>
                )}

                {/* Monthly foraging tip — Requirements 8.1, 8.2, 8.3, 8.4 */}
                {monthData.foragingTip && (
                  <div className="mt-3 pt-3 border-t border-brand-charcoal/10 dark:border-dark-border">
                    <p className="text-xs text-brand-charcoal/70 dark:text-dark-text-muted leading-relaxed">
                      <span className="font-semibold text-brand-earth dark:text-brand-earth">
                        Foraging tip:
                      </span>{' '}
                      {monthData.foragingTip}
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
