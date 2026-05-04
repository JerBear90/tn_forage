"use client";

import { useFruitingForecast } from "@/hooks/useFruitingForecast";
import FruitingForecastCard from "@/components/FruitingForecastCard";

/**
 * Fruiting forecast page showing species predictions based on weather.
 * Requirements: 25.1–25.8
 */
export default function ForecastPage() {
  const { predictions, isLoading, lastUpdated, refreshPredictions } = useFruitingForecast({
    lat: 35.9, lng: -84.1, // Default TN coordinates
  });

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Fruiting Forecast</h1>
        <button
          onClick={refreshPredictions}
          disabled={isLoading}
          className="text-xs text-teal-600 hover:text-teal-800 disabled:opacity-50"
        >
          {isLoading ? "Updating..." : "Refresh"}
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-1">
        Forecasts are estimates based on current weather conditions and species-specific fruiting triggers.
      </p>
      <p className="text-[10px] text-amber-700 bg-amber-50 rounded p-2 mb-4">
        Forecasts are estimates only. Actual fruiting depends on many factors including microclimate, substrate condition, and mycelium maturity.
      </p>

      {lastUpdated && (
        <p className="text-[10px] text-gray-400 mb-3">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}

      {isLoading && predictions.length === 0 ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-lg" />)}
        </div>
      ) : predictions.length === 0 ? (
        <p className="text-sm text-gray-500 text-center mt-8">No forecast data available. Check back when online.</p>
      ) : (
        <div className="space-y-3">
          {predictions.map((prediction) => (
            <FruitingForecastCard key={prediction.speciesId} prediction={prediction} />
          ))}
        </div>
      )}
    </div>
  );
}
