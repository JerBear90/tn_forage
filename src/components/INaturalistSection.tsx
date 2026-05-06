'use client';

/**
 * ForageWise — INaturalistSection Component
 *
 * Displays iNaturalist community data on species detail pages:
 * - Observation count in Tennessee
 * - Monthly observation histogram
 * - Community photos (CC-licensed)
 */

import { useINaturalist } from '@/hooks/useINaturalist';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface INaturalistSectionProps {
  scientificName: string;
  commonName: string;
}

export default function INaturalistSection({ scientificName, commonName }: INaturalistSectionProps) {
  const { info, seasonality, loading } = useINaturalist(scientificName);

  // Don't render anything if offline or no data
  if (!info && !loading) return null;

  if (loading) {
    return (
      <section className="mt-6">
        <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
          Community Observations
        </h2>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-48" />
          <div className="h-20 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded" />
        </div>
      </section>
    );
  }

  if (!info) return null;

  const maxCount = Math.max(...seasonality.map((s) => s.count), 1);

  return (
    <section className="mt-6">
      <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2">
        Community Observations
      </h2>

      {/* Observation count badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-3 py-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {info.observationCount.toLocaleString()} observations in Tennessee
        </span>
      </div>

      {/* Seasonality histogram */}
      {seasonality.length > 0 && seasonality.some((s) => s.count > 0) && (
        <div className="mb-4">
          <p className="text-xs font-medium text-brand-charcoal/60 dark:text-brand-sand/60 mb-2">
            When people find {commonName} in Tennessee
          </p>
          <div className="flex items-end gap-1 h-16">
            {seasonality.map((s) => {
              const height = s.count > 0 ? Math.max((s.count / maxCount) * 100, 8) : 4;
              const isActive = s.count > 0;
              return (
                <div key={s.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isActive ? 'bg-brand-moss/60 dark:bg-brand-moss/40' : 'bg-brand-charcoal/10 dark:bg-brand-sand/10'
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${MONTH_LABELS[s.month - 1]}: ${s.count} observations`}
                    aria-label={`${MONTH_LABELS[s.month - 1]}: ${s.count} observations`}
                  />
                  <span className="text-[9px] text-brand-charcoal/40 dark:text-brand-sand/40">
                    {MONTH_LABELS[s.month - 1]}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
            Source: iNaturalist research-grade observations
          </p>
        </div>
      )}

      {/* Community photos */}
      {info.communityPhotos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-brand-charcoal/60 dark:text-brand-sand/60 mb-2">
            Community photos from Tennessee
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {info.communityPhotos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${commonName} observation ${i + 1} from iNaturalist`}
                className="shrink-0 w-24 h-24 rounded-lg object-cover border border-brand-charcoal/10 dark:border-dark-border"
                loading="lazy"
              />
            ))}
          </div>
          <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
            Photos © their respective observers on iNaturalist (CC BY-NC)
          </p>
        </div>
      )}
    </section>
  );
}
