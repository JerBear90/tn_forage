'use client';

/**
 * ForageWise — WeatherPanel Component
 *
 * Popup panel shown when the user taps the weather icon in the header.
 * Displays current conditions, hourly forecast, and foraging impact.
 * Also shows what features are available when online.
 */

import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ForecastPeriod {
  number: number;
  name: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  windSpeed: string;
  windDirection: string;
  isDaytime: boolean;
  relativeHumidity?: { value: number };
}

interface WeatherDetail {
  current: ForecastPeriod | null;
  hourly: ForecastPeriod[];
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeatherIcon(shortForecast: string): string {
  const f = shortForecast.toLowerCase();
  if (f.includes('thunder') || f.includes('storm')) return '⛈️';
  if (f.includes('rain') || f.includes('shower') || f.includes('drizzle')) return '🌧️';
  if (f.includes('snow') || f.includes('sleet') || f.includes('ice')) return '🌨️';
  if (f.includes('fog') || f.includes('mist') || f.includes('haze')) return '🌫️';
  if (f.includes('wind')) return '💨';
  if (f.includes('partly cloudy') || f.includes('partly sunny')) return '⛅';
  if (f.includes('mostly cloudy') || f.includes('overcast')) return '☁️';
  if (f.includes('cloud')) return '☁️';
  if (f.includes('clear') || f.includes('sunny')) return '☀️';
  if (f.includes('night') || f.includes('tonight')) return '🌙';
  return '🌤️';
}

function getForagingImpact(forecast: string, temp: number, humidity?: number): { rating: string; tip: string; color: string } {
  const f = forecast.toLowerCase();
  const isRainy = f.includes('rain') || f.includes('shower');
  const isHumid = (humidity ?? 0) > 70;
  const isMild = temp >= 55 && temp <= 80;

  if (isRainy && isMild) {
    return { rating: 'Excellent', tip: 'Rain + mild temps = prime mushroom conditions. Check 2-3 days after rain for best fruiting.', color: 'text-green-600 dark:text-green-400' };
  }
  if (isHumid && isMild) {
    return { rating: 'Good', tip: 'High humidity supports mushroom growth. Look on fallen logs and moist forest floors.', color: 'text-lime-600 dark:text-lime-400' };
  }
  if (isMild) {
    return { rating: 'Fair', tip: 'Mild temperatures are favorable. Best after recent rain — check shaded areas.', color: 'text-amber-600 dark:text-amber-400' };
  }
  if (temp < 40) {
    return { rating: 'Low', tip: 'Cold temps slow mushroom growth. Oyster mushrooms and Turkey Tail may still be active on dead wood.', color: 'text-gray-500 dark:text-gray-400' };
  }
  if (temp > 90) {
    return { rating: 'Low', tip: 'Hot and dry conditions are unfavorable. Focus on shaded creek areas or wait for cooler weather.', color: 'text-gray-500 dark:text-gray-400' };
  }
  return { rating: 'Moderate', tip: 'Conditions are average. Focus on moist, shaded areas near water sources.', color: 'text-brand-teal dark:text-brand-teal-300' };
}

// ---------------------------------------------------------------------------
// Online Features List
// ---------------------------------------------------------------------------

const ONLINE_FEATURES = [
  { icon: '🌤️', label: 'Live weather & foraging conditions' },
  { icon: '🔄', label: 'Sync trips & expedition logs' },
  { icon: '🗺️', label: 'Download map tiles for offline use' },
  { icon: '👥', label: 'Community sightings & reviews' },
  { icon: '🔔', label: 'Push notifications & alerts' },
  { icon: '☁️', label: 'Backup data to cloud' },
  { icon: '🆔', label: 'AI-assisted species identification' },
  { icon: '💳', label: 'Membership & account management' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface WeatherPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeatherPanel({ isOpen, onClose }: WeatherPanelProps) {
  const isOnline = useOnlineStatus();
  const [weather, setWeather] = useState<WeatherDetail>({
    current: null,
    hourly: [],
    loading: false,
    error: null,
  });

  // Fetch detailed weather when panel opens
  useEffect(() => {
    if (!isOpen || !isOnline) return;

    let cancelled = false;

    async function fetchDetailedWeather() {
      setWeather((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Check if geolocation is available
        if (!('geolocation' in navigator)) {
          throw new Error('LOCATION_UNAVAILABLE');
        }

        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 30 * 60 * 1000,
            });
          }
        ).catch((err) => {
          if (err.code === 1) throw new Error('LOCATION_DENIED');
          if (err.code === 2) throw new Error('LOCATION_UNAVAILABLE');
          throw new Error('LOCATION_TIMEOUT');
        });

        const { latitude, longitude } = position.coords;

        const pointRes = await fetch(
          `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
          { headers: { 'User-Agent': 'ForageWise/1.0 (foragewise-app)' } }
        );

        if (!pointRes.ok) throw new Error('Failed to get weather data');

        const pointData = await pointRes.json();
        const forecastUrl = pointData.properties?.forecastHourly;

        if (!forecastUrl) throw new Error('No forecast available for your location');

        const forecastRes = await fetch(forecastUrl, {
          headers: { 'User-Agent': 'ForageWise/1.0 (foragewise-app)' },
        });

        if (!forecastRes.ok) throw new Error('Failed to load forecast');

        const forecastData = await forecastRes.json();
        const periods: ForecastPeriod[] = forecastData.properties?.periods ?? [];

        if (!cancelled) {
          setWeather({
            current: periods[0] ?? null,
            hourly: periods.slice(0, 6),
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setWeather({
            current: null,
            hourly: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Unable to load weather',
          });
        }
      }
    }

    fetchDetailedWeather();
    return () => { cancelled = true; };
  }, [isOpen, isOnline]);

  if (!isOpen) return null;

  const foragingImpact = weather.current
    ? getForagingImpact(
        weather.current.shortForecast,
        weather.current.temperature,
        weather.current.relativeHumidity?.value
      )
    : null;

  return (
    <div
      role="dialog"
      aria-label="Weather and online features"
      className="fixed inset-0 z-[9998] flex items-start justify-center pt-14"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-xl bg-white dark:bg-dark-surface border border-brand-teal/20 shadow-xl overflow-hidden max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-brand-charcoal/10 dark:border-dark-border px-4 py-3 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-base text-brand-forest dark:text-brand-moss">
            Weather & Conditions
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close weather panel"
            className="rounded-full p-1.5 hover:bg-brand-charcoal/10 dark:hover:bg-dark-border transition-colors"
          >
            <svg className="w-5 h-5 text-brand-charcoal/60 dark:text-brand-sand/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current Conditions */}
          {weather.loading && (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-teal border-t-transparent mx-auto" />
              <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mt-2">Loading weather…</p>
            </div>
          )}

          {weather.error && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
              {weather.error === 'LOCATION_DENIED' || weather.error === 'LOCATION_UNAVAILABLE' || weather.error === 'LOCATION_TIMEOUT' ? (
                <div className="text-center">
                  <span className="text-2xl block mb-2" aria-hidden="true">📍</span>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Location access needed
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                    {weather.error === 'LOCATION_DENIED'
                      ? 'Location permission was denied. Please enable location access in your browser settings to see local weather.'
                      : weather.error === 'LOCATION_TIMEOUT'
                        ? 'Location request timed out. Please check your GPS is enabled and try again.'
                        : 'Location services are not available on this device.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Re-trigger location request
                      setWeather({ current: null, hourly: [], loading: true, error: null });
                      navigator.geolocation.getCurrentPosition(
                        () => window.location.reload(),
                        () => setWeather({ current: null, hourly: [], loading: false, error: 'LOCATION_DENIED' }),
                        { timeout: 10000 }
                      );
                    }}
                    className="min-h-[44px] rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal/90 transition-colors"
                  >
                    📍 Enable Location
                  </button>
                </div>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-300">{weather.error}</p>
              )}
            </div>
          )}

          {!isOnline && (
            <div className="rounded-lg bg-brand-earth/10 border border-brand-earth/20 px-3 py-2 text-sm text-brand-earth dark:text-brand-earth-300">
              You&apos;re offline so these features are not available
            </div>
          )}

          {weather.current && !weather.loading && (
            <>
              {/* Current weather card */}
              <div className="rounded-lg bg-brand-teal/5 dark:bg-brand-teal/10 border border-brand-teal/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-brand-charcoal dark:text-dark-text">
                      {weather.current.temperature}°{weather.current.temperatureUnit}
                    </p>
                    <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-0.5">
                      {weather.current.shortForecast}
                    </p>
                  </div>
                  <span className="text-4xl" aria-hidden="true">
                    {getWeatherIcon(weather.current.shortForecast)}
                  </span>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
                  <span>💨 {weather.current.windSpeed} {weather.current.windDirection}</span>
                  {weather.current.relativeHumidity && (
                    <span>💧 {weather.current.relativeHumidity.value}% humidity</span>
                  )}
                </div>
              </div>

              {/* Foraging Impact */}
              {foragingImpact && (
                <div className="rounded-lg bg-white dark:bg-dark-surface border border-brand-charcoal/10 dark:border-dark-border p-3">
                  <h3 className="text-xs font-semibold text-brand-charcoal/50 dark:text-brand-sand/50 uppercase tracking-wide mb-1">
                    Foraging Conditions
                  </h3>
                  <p className={`text-sm font-bold ${foragingImpact.color}`}>
                    {foragingImpact.rating}
                  </p>
                  <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mt-1 leading-relaxed">
                    {foragingImpact.tip}
                  </p>
                </div>
              )}

              {/* Hourly forecast */}
              {weather.hourly.length > 1 && (
                <div>
                  <h3 className="text-xs font-semibold text-brand-charcoal/50 dark:text-brand-sand/50 uppercase tracking-wide mb-2">
                    Next Hours
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {weather.hourly.slice(1).map((period) => (
                      <div
                        key={period.number}
                        className="shrink-0 flex flex-col items-center gap-1 rounded-lg bg-brand-charcoal/5 dark:bg-dark-border/50 px-3 py-2 min-w-[60px]"
                      >
                        <span className="text-sm" aria-hidden="true">
                          {getWeatherIcon(period.shortForecast)}
                        </span>
                        <span className="text-xs font-medium text-brand-charcoal dark:text-dark-text">
                          {period.temperature}°
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Online Features Section */}
          <div className="border-t border-brand-charcoal/10 dark:border-dark-border pt-4">
            <h3 className="text-xs font-semibold text-brand-charcoal/50 dark:text-brand-sand/50 uppercase tracking-wide mb-2">
              {isOnline ? '✅ Online Features Active' : '📡 Available When Online'}
            </h3>
            <ul className="space-y-1.5">
              {ONLINE_FEATURES.map((feature) => (
                <li
                  key={feature.label}
                  className={`flex items-center gap-2 text-xs ${
                    isOnline
                      ? 'text-brand-charcoal/80 dark:text-brand-sand/80'
                      : 'text-brand-charcoal/50 dark:text-brand-sand/50'
                  }`}
                >
                  <span aria-hidden="true">{feature.icon}</span>
                  <span>{feature.label}</span>
                  {isOnline && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
