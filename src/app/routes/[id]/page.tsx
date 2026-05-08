"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

/**
 * Saved route view page.
 * Requirements: 9.7
 */
export default function RouteDetailPage() {
  const params = useParams();

  return (
    <div className="p-4 pb-24">
      <Link href="/routes/new" className="text-xs text-teal-600 hover:underline mb-4 inline-block">← Back</Link>
      <h1 className="text-xl font-bold text-brand-charcoal dark:text-brand-sand mb-4">Route Details</h1>
      <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">Route ID: {params.id}</p>
      <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-2">Route map and waypoints will display here.</p>
    </div>
  );
}
