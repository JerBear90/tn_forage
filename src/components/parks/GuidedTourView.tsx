"use client";

import type { GuidedTour, TourWaypoint } from "@/types";

interface GuidedTourViewProps {
  tour: GuidedTour;
  currentWaypointIndex?: number;
  onWaypointSelect?: (index: number) => void;
}

/**
 * Guided tour view with waypoints and proximity-triggered descriptions.
 * Requirements: 15.1–15.7
 */
export default function GuidedTourView({
  tour,
  currentWaypointIndex,
  onWaypointSelect,
}: GuidedTourViewProps) {
  return (
    <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-4">
      <h3 className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand mb-1">{tour.title}</h3>
      <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mb-4">
        {tour.safetyReminder}
      </p>

      <div className="space-y-4">
        {tour.waypoints.map((wp, index) => (
          <WaypointCard
            key={wp.id}
            waypoint={wp}
            index={index}
            isActive={currentWaypointIndex === index}
            onSelect={() => onWaypointSelect?.(index)}
          />
        ))}
      </div>
    </div>
  );
}

function WaypointCard({
  waypoint,
  index,
  isActive,
  onSelect,
}: {
  waypoint: TourWaypoint;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        isActive
          ? "border-teal-500 bg-teal-50"
          : "border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-transparent hover:bg-brand-charcoal/5 dark:hover:bg-brand-sand/5"
      }`}
      aria-label={`Waypoint ${index + 1}: ${waypoint.title}`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          isActive ? "bg-teal-600 text-white" : "bg-brand-charcoal/10 dark:bg-brand-sand/10 text-brand-charcoal/70 dark:text-brand-sand/70"
        }`}>
          {index + 1}
        </span>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">{waypoint.title}</h4>
          <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mt-1 line-clamp-3">{waypoint.description}</p>
          {waypoint.ecologicalContext && (
            <p className="text-xs text-teal-700 mt-2 italic">{waypoint.ecologicalContext.slice(0, 100)}...</p>
          )}
        </div>
      </div>
    </button>
  );
}
