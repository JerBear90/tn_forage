'use client';

interface ChartWidgetProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  onExport?: () => void;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12" aria-label="Loading chart data">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" />
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="flex items-center justify-center py-12 text-red-600 dark:text-red-400"
      role="alert"
    >
      <svg
        className="mr-2 h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm">{message}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
      <span className="text-sm">No data available</span>
    </div>
  );
}

export default function ChartWidget({
  title,
  subtitle,
  children,
  loading = false,
  error,
  onExport,
}: ChartWidgetProps) {
  const hasContent = children !== null && children !== undefined && children !== false;

  return (
    <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal-800 p-4 md:p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-brand-charcoal dark:text-brand-sand">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            aria-label={`Export ${title} data`}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-brand-teal hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </button>
        )}
      </div>

      {/* Content area */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : hasContent ? (
        <div>{children}</div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
