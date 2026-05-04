"use client";

import { useState } from "react";
import type { SustainabilityLevel, Coordinates } from "@/types";

interface HarvestLogProps {
  onLogHarvest: (params: { speciesGuess: string; quantity: string; coordinates: Coordinates; notes?: string }) => Promise<{ sustainability: SustainabilityLevel }>;
}

const SUSTAINABILITY_COLORS: Record<SustainabilityLevel, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
};

/**
 * Harvest recording component with sustainability level display.
 * Requirements: 27.1–27.7
 */
export default function HarvestLog({ onLogHarvest }: HarvestLogProps) {
  const [species, setSpecies] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [sustainability, setSustainability] = useState<SustainabilityLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!species.trim() || !quantity.trim()) return;
    setIsSubmitting(true);

    try {
      // Use current position or default
      const coords: Coordinates = { lat: 35.9, lng: -84.1 }; // Default TN coords
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
          );
          coords.lat = pos.coords.latitude;
          coords.lng = pos.coords.longitude;
        } catch { /* Use default */ }
      }

      const result = await onLogHarvest({
        speciesGuess: species.trim(),
        quantity: quantity.trim(),
        coordinates: coords,
        notes: notes.trim() || undefined,
      });

      setSustainability(result.sustainability);
      setSpecies("");
      setQuantity("");
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Log Harvest</h3>

      <input
        type="text"
        value={species}
        onChange={(e) => setSpecies(e.target.value)}
        placeholder="Species name"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm mb-2"
        aria-label="Species name"
      />
      <input
        type="text"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Quantity (e.g., 2 lbs, handful)"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm mb-2"
        aria-label="Quantity"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm mb-3 resize-none"
        rows={2}
        aria-label="Notes"
      />

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !species.trim() || !quantity.trim()}
        className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {isSubmitting ? "Logging..." : "Log Harvest"}
      </button>

      {sustainability && (
        <div className={`mt-3 rounded-md p-2 text-center text-xs font-medium ${SUSTAINABILITY_COLORS[sustainability]}`}>
          Sustainability: {sustainability.toUpperCase()}
        </div>
      )}
    </div>
  );
}
