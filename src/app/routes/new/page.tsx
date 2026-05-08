"use client";

import { useState } from "react";
import type { RouteWaypoint, Coordinates } from "@/types";

/**
 * Route planner page for creating custom multi-stop routes.
 * Requirements: 9.1–9.8
 */
export default function NewRoutePage() {
  const [name, setName] = useState("");
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
  const [newLabel, setNewLabel] = useState("");

  const addWaypoint = () => {
    if (!newLabel.trim()) return;
    const wp: RouteWaypoint = {
      id: `wp-${Date.now()}`,
      order: waypoints.length + 1,
      type: "custom",
      label: newLabel.trim(),
      coordinates: { lat: 35.9, lng: -84.1 } as Coordinates,
    };
    setWaypoints([...waypoints, wp]);
    setNewLabel("");
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-brand-charcoal dark:text-brand-sand mb-4">Plan a Route</h1>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Route name"
        className="w-full rounded border border-brand-charcoal/10 dark:border-brand-sand/10 px-3 py-2 text-sm mb-4"
        aria-label="Route name"
      />

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-2">Waypoints</h2>
        {waypoints.map((wp, i) => (
          <div key={wp.id} className="flex items-center gap-2 mb-2 rounded border border-brand-charcoal/10 dark:border-brand-sand/10 p-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
              {i + 1}
            </span>
            <span className="flex-1 text-sm text-brand-charcoal dark:text-brand-sand">{wp.label}</span>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addWaypoint()}
            placeholder="Add stop (park, trail, or location)"
            className="flex-1 rounded border border-brand-charcoal/10 dark:border-brand-sand/10 px-2 py-1.5 text-sm"
            aria-label="New waypoint"
          />
          <button onClick={addWaypoint} className="rounded bg-teal-600 px-3 py-1.5 text-sm text-white hover:bg-teal-700">
            Add
          </button>
        </div>
      </div>

      <button
        disabled={!name.trim() || waypoints.length < 2}
        className="w-full rounded-md bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        Save Route
      </button>
    </div>
  );
}
