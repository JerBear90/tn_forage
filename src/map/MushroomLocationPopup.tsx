'use client';

import React from 'react';

export interface MushroomLocationPopupProps {
  type: 'park' | 'trail';
  name: string;
  parkName?: string;
  species: Array<{
    id: string;
    commonName: string;
    inSeason: boolean;
  }>;
  onSpeciesClick: (speciesId: string) => void;
}

/**
 * Popup content for mushroom map markers.
 * Displays location name, parent park (for trails), and a list of
 * mushroom species with in-season indicators and clickable names.
 *
 * No edibility claims. No banned safety phrases.
 */
export default function MushroomLocationPopup({
  type,
  name,
  parkName,
  species,
  onSpeciesClick,
}: MushroomLocationPopupProps) {
  return (
    <div className="min-w-[180px] max-w-[260px]">
      {/* Location name */}
      <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand leading-tight">
        {name}
      </h3>

      {/* Parent park subtitle for trails */}
      {type === 'trail' && parkName && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Trail at {parkName}
        </p>
      )}

      {/* Species list */}
      {species.length > 0 ? (
        <>
          <ul className="mt-2 space-y-1" role="list" aria-label="Mushroom species at this location">
            {species.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                {/* In-season indicator */}
                <span
                  className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                    s.inSeason ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => onSpeciesClick(s.id)}
                  className="text-xs text-brand-teal hover:text-brand-teal-700 underline underline-offset-2 text-left leading-tight"
                  aria-label={`${s.commonName}${s.inSeason ? ', in season' : ', not in season'}`}
                >
                  {s.commonName}
                </button>
              </li>
            ))}
          </ul>
          {/* Legend for green dot */}
          <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
            = Currently in season
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-400 italic">
          No mushroom species data available
        </p>
      )}
    </div>
  );
}
