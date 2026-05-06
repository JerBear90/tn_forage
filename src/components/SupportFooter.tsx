'use client';

/**
 * ForageWise — SupportFooter Component
 *
 * A minimal footer with support link and copyright notice.
 */

import Link from 'next/link';

export default function SupportFooter() {
  return (
    <footer className="mt-8 pb-4 text-center space-y-2">
      <Link
        href="/support"
        className="inline-flex items-center gap-1.5 text-xs text-brand-charcoal/50 dark:text-brand-sand/50 hover:text-brand-teal dark:hover:text-brand-teal-300 transition-colors"
      >
        <svg
          aria-hidden="true"
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
        Need help? Contact Support
      </Link>
      <p className="text-[10px] text-brand-charcoal/30 dark:text-brand-sand/30">
        © {new Date().getFullYear()} ForageWise. All rights reserved.
      </p>
    </footer>
  );
}
