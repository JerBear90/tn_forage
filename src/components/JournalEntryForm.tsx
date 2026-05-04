"use client";

import { useState } from "react";
import type { Coordinates } from "@/types";

interface JournalEntryFormProps {
  onSubmit: (params: { speciesGuess: string; notes: string; coordinates: Coordinates }) => void;
  defaultSpecies?: string;
}

/**
 * Journal entry form for logging a find with species, notes, and location.
 * Requirements: 24.1–24.3
 */
export default function JournalEntryForm({ onSubmit, defaultSpecies }: JournalEntryFormProps) {
  const [species, setSpecies] = useState(defaultSpecies ?? "");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!species.trim()) return;
    setIsSubmitting(true);

    let coords: Coordinates = { lat: 35.9, lng: -84.1 };
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
        );
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch { /* Use default */ }
    }

    onSubmit({ speciesGuess: species.trim(), notes: notes.trim(), coordinates: coords });
    setSpecies("");
    setNotes("");
    setIsSubmitting(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Log a Find</h3>
      <input
        type="text"
        value={species}
        onChange={(e) => setSpecies(e.target.value)}
        placeholder="Species name or guess"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm mb-2"
        aria-label="Species name"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes about the find..."
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm mb-3 resize-none"
        rows={3}
        aria-label="Notes"
      />
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !species.trim()}
        className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Log Find"}
      </button>
    </div>
  );
}
