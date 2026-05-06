'use client';

interface OverviewCardProps {
  title: string;
  value: string | number;
  change?: { value: number; direction: 'up' | 'down' | 'flat' };
  icon: React.ReactNode;
  loading?: boolean;
}

function ChangeIndicator({ change }: { change: { value: number; direction: 'up' | 'down' | 'flat' } }) {
  if (change.direction === 'flat') {
    return (
      <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
        <svg className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
        {change.value}%
      </span>
    );
  }

  const isUp = change.direction === 'up';
  const colorClass = isUp
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <span className={`inline-flex items-center text-xs ${colorClass}`}>
      {isUp ? (
        <svg className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
      {change.value}%
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading card data">
      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
      <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-1" />
      <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export default function OverviewCard({ title, value, change, icon, loading = false }: OverviewCardProps) {
  return (
    <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal-800 p-4 md:p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
                {value}
              </p>
              {change && (
                <div className="mt-1">
                  <ChangeIndicator change={change} />
                </div>
              )}
            </>
          )}
        </div>
        <div
          className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-teal-50 dark:bg-brand-teal-900 text-brand-teal"
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
