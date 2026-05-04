"use client";

import type { Species } from "@/types";

interface LookalikeComparisonProps {
  species: Species;
  lookalike: Species;
}

/**
 * Side-by-side species comparison highlighting dangerous differences.
 * Requirements: 32.1–32.8
 */
export default function LookalikeComparison({ species, lookalike }: LookalikeComparisonProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-4">
        <p className="text-xs text-red-800 font-medium text-center">
          ⚠️ When in doubt, do NOT consume. Always verify with a qualified expert.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Species column */}
        <div>
          {species.images[0] && (
            <img src={species.images[0]} alt={species.commonName} className="w-full h-32 rounded-md object-cover mb-2" />
          )}
          <h4 className="text-sm font-semibold text-gray-800">{species.commonName}</h4>
          <p className="text-xs text-gray-500 italic mb-2">{species.scientificName}</p>
          <div className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            species.edibilityLabel === "toxic" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          }`}>
            {species.edibilityLabel.replace(/-/g, " ")}
          </div>
        </div>

        {/* Lookalike column */}
        <div>
          {lookalike.images[0] && (
            <img src={lookalike.images[0]} alt={lookalike.commonName} className="w-full h-32 rounded-md object-cover mb-2" />
          )}
          <h4 className="text-sm font-semibold text-gray-800">{lookalike.commonName}</h4>
          <p className="text-xs text-gray-500 italic mb-2">{lookalike.scientificName}</p>
          <div className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            lookalike.edibilityLabel === "toxic" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          }`}>
            {lookalike.edibilityLabel.replace(/-/g, " ")}
          </div>
        </div>
      </div>

      {/* Key differences */}
      <div className="mt-4 border-t border-gray-200 pt-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Key Differences</h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-1 text-gray-500">Feature</th>
              <th className="text-left py-1 text-gray-700">{species.commonName}</th>
              <th className="text-left py-1 text-gray-700">{lookalike.commonName}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="py-1 text-gray-500">Spore Print</td>
              <td className="py-1">{species.sporePrint ?? "—"}</td>
              <td className="py-1">{lookalike.sporePrint ?? "—"}</td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-1 text-gray-500">Habitat</td>
              <td className="py-1">{species.habitat.slice(0, 50)}...</td>
              <td className="py-1">{lookalike.habitat.slice(0, 50)}...</td>
            </tr>
            <tr>
              <td className="py-1 text-gray-500">Season</td>
              <td className="py-1">{species.season.join(", ")}</td>
              <td className="py-1">{lookalike.season.join(", ")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
