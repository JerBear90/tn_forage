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
      <h1 className="text-xl font-bold text-gray-800 mb-4">Route Details</h1>
      <p className="text-sm text-gray-600">Route ID: {params.id}</p>
      <p className="text-xs text-gray-500 mt-2">Route map and waypoints will display here.</p>
    </div>
  );
}
