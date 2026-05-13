'use client';

/**
 * ForageWise — BackToSettings Component
 *
 * Reusable back navigation button for legal pages (Privacy, Terms).
 * Always navigates to /settings via client-side routing regardless of
 * the user's navigation origin.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { useRouter } from 'next/navigation';

export default function BackToSettings(): JSX.Element {
  const router = useRouter();

  return (
    <nav aria-label="Back navigation" className="mb-4">
      <button
        type="button"
        onClick={() => router.push('/settings')}
        className="inline-flex items-center min-h-[44px] min-w-[44px] px-2 py-2 text-sm text-brand-teal hover:text-brand-teal-600 dark:text-brand-teal-300 dark:hover:text-brand-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors rounded-md"
        aria-label="Back to Settings"
      >
        <svg
          aria-hidden="true"
          className="w-4 h-4 mr-1.5 shrink-0"
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
        <span>Settings</span>
      </button>
    </nav>
  );
}
