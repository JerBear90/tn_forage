"use client";

import { useState, useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface WeatherState {
  temp: number | null;
  icon: string | null;
  loading: boolean;
}

/**
 * Map weather.gov shortForecast text to an emoji icon.
 */
function getWeatherIcon(shortForecast: string): string {
  const f = shortForecast.toLowerCase();

  if (f.includes("thunder") || f.includes("storm")) return "⛈️";
  if (f.includes("rain") || f.includes("shower") || f.includes("drizzle")) return "🌧️";
  if (f.includes("snow") || f.includes("sleet") || f.includes("ice")) return "🌨️";
  if (f.includes("fog") || f.includes("mist") || f.includes("haze")) return "🌫️";
  if (f.includes("wind")) return "💨";
  if (f.includes("partly cloudy") || f.includes("partly sunny")) return "⛅";
  if (f.includes("mostly cloudy") || f.includes("overcast")) return "☁️";
  if (f.includes("cloud")) return "☁️";
  if (f.includes("clear") || f.includes("sunny")) return "☀️";
  if (f.includes("night") || f.includes("tonight")) return "🌙";

  return "🌤️"; // default: mostly clear
}

/**
 * Fetches current temperature and condition from weather.gov based on user's geolocation.
 * Returns null when offline or if location/weather is unavailable.
 * Caches result for 30 minutes to avoid excessive API calls.
 */
export function useWeatherTemp(): WeatherState {
  const isOnline = useOnlineStatus();
  const [state, setState] = useState<WeatherState>({ temp: null, icon: null, loading: false });

  useEffect(() => {
    if (!isOnline) {
      setState({ temp: null, icon: null, loading: false });
      return;
    }

    // Check cache first
    const cached = sessionStorage.getItem("ff-weather-cache");
    if (cached) {
      try {
        const { temp, icon, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < 30 * 60 * 1000) {
          setState({ temp, icon: icon || null, loading: false });
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
        const shortForecast = currentPeriod.shortForecast || "";
        const icon = getWeatherIcon(shortForecast);

        if (!cancelled) {
          setState({ temp, icon, loading: false });
          // Cache for 30 minutes
          sessionStorage.setItem(
            "ff-weather-cache",
            JSON.stringify({ temp, icon, timestamp: Date.now() })
          );
        }
      } catch {
        if (!cancelled) {
          setState({ temp: null, icon: null, loading: false });
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
