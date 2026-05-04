"use client";

import type { AggregatedCondition } from "@/utils/trailConditionAggregator";

interface TrailConditionDisplayProps {
  condition: AggregatedCondition | null;
}

const COLOR_CLASSES = {
  green: "bg-green-100 text-green-800 border-green-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

/**
 * Displays aggregated trail condition indicators with color coding.
 * Requirements: 10.1, 10.3, 10.5, 10.6
 */
export default function TrailConditionDisplay({ condition }: TrailConditionDisplayProps) {
  if (!condition || !condition.hasData) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
        No recent reports
      </span>
    );
  }

  const colorClass = condition.color ? COLOR_CLASSES[condition.color] : "bg-gray-100 text-gray-600";
  const label = condition.displayedCategory?.replace("-", "/") ?? "Unknown";

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${colorClass}`}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      <span className="text-xs font-medium capitalize">{label}</span>
      {condition.lastReportedAt && (
        <span className="text-[10px] opacity-70">
          · {new Date(condition.lastReportedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
