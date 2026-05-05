'use client';

/**
 * ForageWise — BreadcrumbNavigator Component
 *
 * Contextual breadcrumb navigation for detail pages. Reads sessionStorage
 * to determine if the user arrived from another detail page, and renders
 * a back link to that page. Falls back to the Field Guide index when no
 * referrer exists (direct navigation).
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BreadcrumbReferrer } from '@/types';
import {
  readReferrer,
  writeReferrer,
  clearReferrer,
  BREADCRUMB_STORAGE_KEY,
} from '@/utils/breadcrumbReferrer';

export { readReferrer, writeReferrer, clearReferrer, BREADCRUMB_STORAGE_KEY };

export interface BreadcrumbNavigatorProps {
  /** Current page title */
  currentTitle: string;
  /** Current page category: 'species' | 'plant' | 'tree' | 'mushroom' */
  currentCategory: string;
  /** Fallback parent link (default: /field-guide) */
  fallbackHref?: string;
  /** Fallback link label (default: "Field Guide") */
  fallbackLabel?: string;
}

export default function BreadcrumbNavigator({
  currentTitle,
  currentCategory,
  fallbackHref = '/field-guide',
  fallbackLabel = 'Field Guide',
}: BreadcrumbNavigatorProps) {
  const [referrer, setReferrer] = useState<BreadcrumbReferrer | null>(null);

  useEffect(() => {
    setReferrer(readReferrer());
  }, []);

  const linkHref = referrer ? referrer.href : fallbackHref;
  const linkLabel = referrer ? `← ${referrer.title}` : `← ${fallbackLabel}`;
  const ariaLabelText = referrer
    ? `Back to ${referrer.title}`
    : `Back to ${fallbackLabel}`;

  return (
    <nav aria-label="Breadcrumb navigation" className="mb-4">
      <Link
        href={linkHref}
        className="inline-flex items-center min-h-[44px] min-w-[44px] px-2 py-2 text-sm text-brand-teal hover:text-brand-teal-600 dark:text-brand-teal-300 dark:hover:text-brand-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors rounded-md"
        aria-label={ariaLabelText}
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
        <span>{referrer ? referrer.title : fallbackLabel}</span>
      </Link>
    </nav>
  );
}
