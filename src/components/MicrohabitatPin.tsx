"use client";

import type { MicrohabitatPinRecord } from "@/types";

interface MicrohabitatPinProps {
  pin: MicrohabitatPinRecord;
  successRate: number;
  onRecordVisit: (speciesFound: boolean, notes?: string) => void;
  onDelete: () => void;
}

/**
 * Private microhabitat pin UI with visit history and success rate.
 * Requirements: 28.1–28.9
 */
export default function MicrohabitatPin({ pin, successRate, onRecordVisit, onDelete }: MicrohabitatPinProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-800">
            {pin.associatedSpeciesId ? `Habitat Pin` : "Microhabitat Pin"}
          </h4>
          <p className="text-xs text-gray-500">
            {pin.substrate} · {pin.slopeAspect ?? "flat"} slope
            {pin.nearWater && " · near water"}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          pin.syncPreference === "local-only" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-600"
        }`}>
          {pin.syncPreference === "local-only" ? "🔒 Private" : "☁️ Synced"}
        </span>
      </div>

      {pin.dominantTrees.length > 0 && (
        <p className="text-xs text-gray-600 mb-2">Trees: {pin.dominantTrees.join(", ")}</p>
      )}

      {pin.notes && <p className="text-xs text-gray-600 mb-2">{pin.notes}</p>}

      <div className="flex items-center gap-4 mb-3">
        <div className="text-center">
          <p className="text-lg font-bold text-teal-700">{successRate}%</p>
          <p className="text-[10px] text-gray-500">Success rate</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-700">{pin.visits.length}</p>
          <p className="text-[10px] text-gray-500">Visits</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onRecordVisit(true)}
          className="flex-1 rounded-md bg-green-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          ✓ Found
        </button>
        <button
          onClick={() => onRecordVisit(false)}
          className="flex-1 rounded-md bg-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300"
        >
          ✗ Not found
        </button>
        <button
          onClick={onDelete}
          className="rounded-md bg-red-100 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
          aria-label="Delete pin"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
