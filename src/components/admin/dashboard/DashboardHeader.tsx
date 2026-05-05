'use client';

interface DashboardHeaderProps {
  title?: string;
  onExport?: () => void;
  exportLoading?: boolean;
  exportError?: string | null;
  onRetryExport?: () => void;
}

export default function DashboardHeader({
  title = 'Analytics Dashboard',
  onExport,
  exportLoading = false,
  exportError = null,
  onRetryExport,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-heading font-bold text-brand-charcoal dark:text-brand-sand md:text-2xl">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {exportError && (
          <div className="flex items-center gap-2" role="alert">
            <span className="text-sm text-red-600 dark:text-red-400">{exportError}</span>
            {onRetryExport && (
              <button
                type="button"
                onClick={onRetryExport}
                aria-label="Retry export"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-red-700 hover:text-red-900 hover:underline dark:text-red-300 dark:hover:text-red-100"
              >
                Retry
              </button>
            )}
          </div>
        )}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            disabled={exportLoading}
            aria-label={exportLoading ? 'Exporting dashboard data…' : 'Export dashboard data'}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-teal-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
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
            )}
            {exportLoading ? 'Exporting…' : 'Export'}
          </button>
        )}
      </div>
    </header>
  );
}
