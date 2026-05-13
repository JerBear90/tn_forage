"use client";

import { useState } from "react";

interface BeaconButtonProps {
  onActivate: (durationMinutes: number) => void;
  onDeactivate: () => void;
  isActive: boolean;
  remainingMinutes?: number;
}

const DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "4 hours", value: 240 },
];

/**
 * Safety beacon control button.
 * Shows activation options when inactive, countdown when active.
 *
 * Requirements: 11.1, 11.2, 11.6, 11.7
 */
export default function BeaconButton({
  onActivate,
  onDeactivate,
  isActive,
  remainingMinutes,
}: BeaconButtonProps) {
  const [showOptions, setShowOptions] = useState(false);

  if (isActive) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">Safety Beacon Active</p>
          <p className="text-xs text-red-600">
            {remainingMinutes !== undefined
              ? `${remainingMinutes} min remaining`
              : "Monitoring activity..."}
          </p>
        </div>
        <button
          onClick={onDeactivate}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Deactivate safety beacon"
        >
          Stop
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 text-sm font-medium text-teal-800 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
        aria-label="Activate safety beacon"
        aria-expanded={showOptions}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        Safety Beacon
      </button>

      {showOptions && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-white dark:bg-brand-charcoal border border-brand-charcoal/10 dark:border-brand-sand/10 shadow-lg z-10 p-2" role="menu">
          <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/70 px-2 py-1">Set inactivity timer:</p>
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onActivate(opt.value);
                setShowOptions(false);
              }}
              className="block w-full text-left rounded-md px-3 py-2 text-sm text-brand-charcoal dark:text-brand-sand hover:bg-teal-50 hover:text-teal-800"
              role="menuitem"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
