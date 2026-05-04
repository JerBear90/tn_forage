"use client";

import type { Plant } from "@/types";

interface ParkPlantsSectionProps {
  plants: Plant[];
}

/**
 * Plants list with medicinal info panels for park detail pages.
 * Requirements: 3.1–3.9
 */
export default function ParkPlantsSection({ plants }: ParkPlantsSectionProps) {
  if (plants.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Plants Found Here</h3>
      <div className="space-y-4">
        {plants.map((plant) => (
          <div key={plant.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex gap-3">
              {plant.images[0] && (
                <img
                  src={plant.images[0]}
                  alt={plant.commonName}
                  className="h-16 w-16 rounded-md object-cover"
                />
              )}
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-800">{plant.commonName}</h4>
                <p className="text-xs text-gray-500 italic">{plant.scientificName}</p>
                <p className="text-xs text-gray-600 mt-1">{plant.habitat.slice(0, 120)}...</p>
              </div>
            </div>

            {/* Medicinal Info Panel */}
            {plant.medicinalUses && (
              <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3">
                <h5 className="text-xs font-semibold text-amber-800 mb-1">Traditional Medicinal Uses</h5>
                <ul className="text-xs text-amber-700 space-y-0.5 mb-2">
                  {plant.medicinalUses.uses.map((use, i) => (
                    <li key={i}>• {use}</li>
                  ))}
                </ul>
                <p className="text-xs text-amber-600">
                  <strong>Parts used:</strong> {plant.medicinalUses.partsUsed.join(", ")}
                </p>
                <p className="text-[10px] text-amber-800 mt-2 font-medium border-t border-amber-200 pt-2">
                  {plant.medicinalUses.disclaimer}
                </p>
              </div>
            )}

            {/* Transplant Guide */}
            {plant.transplantGuide && !plant.isProtected && !plant.isInvasive && (
              <div className="mt-3 rounded-md bg-green-50 border border-green-200 p-3">
                <h5 className="text-xs font-semibold text-green-800 mb-1">Transplanting Guide</h5>
                <p className="text-xs text-green-700">Best season: {plant.transplantGuide.bestSeason}</p>
                <p className="text-xs text-green-700">Soil: {plant.transplantGuide.soilRequirements}</p>
                <p className="text-[10px] text-green-800 mt-2 font-medium border-t border-green-200 pt-2">
                  {plant.transplantGuide.disclaimer}
                </p>
              </div>
            )}

            {/* Protected/Invasive Notice */}
            {(plant.isProtected || plant.isInvasive) && (
              <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-2">
                <p className="text-xs text-red-700 font-medium">
                  {plant.isProtected && "⚠️ This species is protected. Do not collect or transplant."}
                  {plant.isInvasive && "⚠️ This species is invasive. Do not transplant."}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
