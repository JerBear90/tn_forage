"use client";

import { useState, useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface WeatherState {
  temp: number | null;
  loading: boolean;
}

/**
 * Fetches current temperature from weather.gov based on user's geolocation.
 * Returns null when offline or if location/weather is unavailable.
 * Caches result for 30 minutes to avoid excessive API calls.
 */
export function useWeatherTemp(): WeatherState {
  const isOnline = useOnlineStatus();
  const [state, setState] = useState<WeatherState>({ temp: null, loading: false });

  useEffect(() => {
    if (!isOnline) {
      setState({ temp: null, loading: false });
      return;
    }

    // Check cache first
    const cached = sessionStorage.getItem("ff-weather-cache");
    if (cached) {
      try {
        const { temp, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < 30 * 60 * 1000) {
          setState({ temp, loading: false });
          return;
        }
      } catch {
        // Invalid cache, proceed to fetch
      }
    }

    let cancelled = false;

    async function fetchWeather() {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        // Get user location
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 30 * 60 * 1000,
            });
          }
        );

        const { latitude, longitude } = position.coords;

        // Step 1: Get the forecast grid endpoint from weather.gov
        const pointRes = await fetch(
          `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
          { headers: { "User-Agent": "ForageFlow/1.0 (forageflow-app)" } }
        );

        if (!pointRes.ok) throw new Error("Failed to get weather point");

        const pointData = await pointRes.json();
        const forecastUrl = pointData.properties?.forecastHourly;

        if (!forecastUrl) throw new Error("No forecast URL");

        // Step 2: Get the hourly forecast
        const forecastRes = await fetch(forecastUrl, {
          headers: { "User-Agent": "ForageFlow/1.0 (forageflow-app)" },
        });

        if (!forecastRes.ok) throw new Error("Failed to get forecast");

        const forecastData = await forecastRes.json();
        const currentPeriod = forecastData.properties?.periods?.[0];

        if (!currentPeriod) throw new Error("No forecast period");

        const temp = currentPeriod.temperature;

        if (!cancelled) {
          setState({ temp, loading: false });
          // Cache for 30 minutes
          sessionStorage.setItem(
            "ff-weather-cache",
            JSON.stringify({ temp, timestamp: Date.now() })
          );
        }
      } catch {
        if (!cancelled) {
          setState({ temp: null, loading: false });
        }
      }
    }

    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  return state;
}
