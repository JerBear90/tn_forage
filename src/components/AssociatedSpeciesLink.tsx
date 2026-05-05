"use client";

/**
 * ForageWise — AssociatedSpeciesLink Component
 *
 * Renders an associated species name as a tappable link if the species ID
 * exists in IndexedDB, or as plain text if not found.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import Link from "next/link";

export interface AssociatedSpeciesLinkProps {
  /** The display name of the associated species */
  speciesName: string;
  /** Resolved species ID from IndexedDB lookup, or null if not found */
  speciesId: string | null;
}

/**
 * Renders an associated species name as a link (if ID is resolved) or plain text.
 * Links have a minimum 44x44px tap target per Requirement 12.4.
 */
export default function AssociatedSpeciesLink({
  speciesName,
  speciesId,
}: AssociatedSpeciesLinkProps) {
  if (speciesId) {
    return (
      <Link
        href={`/field-guide/${speciesId}`}
        className="inline-flex items-center rounded-full border border-brand-teal/20 bg-brand-teal/5 px-2.5 py-1.5 text-xs text-brand-teal dark:text-brand-teal-300 hover:bg-brand-teal/10 hover:border-brand-teal/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px] min-w-[44px]"
        aria-label={`View ${speciesName} in field guide`}
      >
        <svg
          aria-hidden="true"
          className="w-3 h-3 mr-1 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          />
        </svg>
        {speciesName}
      </Link>
    );
  }

  return (
    <span
      className="inline-block rounded-full border border-brand-teal/20 bg-brand-teal/5 px-2.5 py-0.5 text-xs text-brand-teal dark:text-brand-teal-300"
      role="listitem"
    >
      {speciesName}
    </span>
  );
}
