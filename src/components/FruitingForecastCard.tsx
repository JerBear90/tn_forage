"use client";

import type { FruitingPrediction } from "@/types";

interface FruitingForecastCardProps {
  prediction: FruitingPrediction;
}

const LIKELIHOOD_STYLES = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

/**
 * Fruiting forecast prediction display card.
 * Requirements: 25.1–25.8
 */
export default function FruitingForecastCard({ prediction }: FruitingForecastCardProps) {
  return (
    <div className={`rounded-lg border p-3 ${LIKELIHOOD_STYLES[prediction.likelihood]}`}>
      <div className="flex items-center gap-3">
        {prediction.image && (
          <img src={prediction.image} alt={prediction.commonName} className="h-12 w-12 rounded-md object-cover" />
        )}
        <div className="flex-1">
          <h4 className="text-sm font-semibold">{prediction.commonName}</h4>
          <p className="text-xs capitalize font-medium">{prediction.likelihood} likelihood</p>
        </div>
      </div>
      {prediction.triggers.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {prediction.triggers.map((trigger, i) => (
            <li key={i} className="text-xs opacity-80">✓ {trigger}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
