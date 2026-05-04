"use client";

import { useState } from "react";
import type { TrailConditionCategory } from "@/types";

interface TrailConditionReporterProps {
  trailId: string;
  onSubmit: (categories: TrailConditionCategory[], details?: string) => void;
}

const CATEGORIES: { value: TrailConditionCategory; label: string; emoji: string }[] = [
  { value: "clear", label: "Clear", emoji: "✅" },
  { value: "dry", label: "Dry", emoji: "☀️" },
  { value: "muddy", label: "Muddy", emoji: "💧" },
  { value: "snowy", label: "Snowy", emoji: "❄️" },
  { value: "issues", label: "Issues", emoji: "⚠️" },
  { value: "bad-closed", label: "Bad/Closed", emoji: "🚫" },
];

/**
 * Trail condition reporting form with category selection and optional details.
 * Requirements: 17.1–17.8
 */
export default function TrailConditionReporter({ trailId, onSubmit }: TrailConditionReporterProps) {
  const [selected, setSelected] = useState<TrailConditionCategory[]>([]);
  const [details, setDetails] = useState("");

  const toggleCategory = (cat: TrailConditionCategory) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    onSubmit(selected, details.trim() || undefined);
    setSelected([]);
    setDetails("");
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">Report Trail Conditions</h4>
      <div className="grid grid-cols-3 gap-2 mb-3" role="group" aria-label="Trail condition categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => toggleCategory(cat.value)}
            className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
              selected.includes(cat.value)
                ? "border-teal-500 bg-teal-50 text-teal-800"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
            aria-pressed={selected.includes(cat.value)}
          >
            <span className="block text-lg mb-0.5">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value.slice(0, 500))}
        placeholder="Optional details (max 500 chars)"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm mb-3 resize-none"
        rows={2}
        maxLength={500}
        aria-label="Condition details"
      />
      <button
        onClick={handleSubmit}
        disabled={selected.length === 0}
        className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        Submit Report
      </button>
    </div>
  );
}
