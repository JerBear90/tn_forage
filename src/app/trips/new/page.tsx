'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Park, Trail, Route, LocationType, Trip } from '@/types';
import { getAllRecords, putRecord } from '@/offline/db';

/** Generate a UUID v4 (crypto-safe when available, fallback for older browsers). */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const LOCATION_TYPES: { value: LocationType; label: string; icon: string }[] = [
  { value: 'park', label: 'State Park', icon: '🏞️' },
  { value: 'trail', label: 'Trail', icon: '🥾' },
  { value: 'route', label: 'Route', icon: '🗺️' },
  { value: 'custom', label: 'Custom', icon: '📍' },
];

interface LocationItem {
  id: string;
  name: string;
}

export default function CreateTripPage() {
  const router = useRouter();

  // --- Form state ---
  const [locationType, setLocationType] = useState<LocationType>('park');
  const [locationId, setLocationId] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [targetSpeciesInput, setTargetSpeciesInput] = useState('');
  const [companions, setCompanions] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');

  // --- Location data from IndexedDB ---
  const [parks, setParks] = useState<LocationItem[]>([]);
  const [trails, setTrails] = useState<LocationItem[]>([]);
  const [routes, setRoutes] = useState<LocationItem[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // --- Search filter for location dropdown ---
  const [locationSearch, setLocationSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // --- Submission state ---
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Validation ---
  const [touched, setTouched] = useState(false);

  // Load location data from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      try {
        const [parksData, trailsData, routesData] = await Promise.all([
          getAllRecords('parks'),
          getAllRecords('trails'),
          getAllRecords('routes'),
        ]);

        if (!cancelled) {
          setParks(parksData.map((p: Park) => ({ id: p.id, name: p.name })));
          setTrails(trailsData.map((t: Trail) => ({ id: t.id, name: t.name })));
          setRoutes(routesData.map((r: Route) => ({ id: r.id, name: r.name })));
        }
      } catch {
        // Silently handle — locations may not be seeded yet
      } finally {
        if (!cancelled) setLoadingLocations(false);
      }
    }

    loadLocations();
    return () => { cancelled = true; };
  }, []);

  // Get the right location list for the selected type
  const locationItems = useMemo(() => {
    switch (locationType) {
      case 'park': return parks;
      case 'trail': return trails;
      case 'route': return routes;
      default: return [];
    }
  }, [locationType, parks, trails, routes]);

  // Filtered items based on search
  const filteredItems = useMemo(() => {
    if (!locationSearch.trim()) return locationItems;
    const q = locationSearch.toLowerCase();
    return locationItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [locationItems, locationSearch]);

  // Selected location name for display
  const selectedLocationName = useMemo(() => {
    if (locationType === 'custom') return customLocation;
    return locationItems.find((item) => item.id === locationId)?.name ?? '';
  }, [locationType, locationId, locationItems, customLocation]);

  // Reset location selection when type changes
  const handleLocationTypeChange = useCallback((type: LocationType) => {
    setLocationType(type);
    setLocationId('');
    setCustomLocation('');
    setLocationSearch('');
    setDropdownOpen(false);
  }, []);

  // Validation
  const isLocationValid = locationType === 'custom'
    ? customLocation.trim().length > 0
    : locationId.length > 0;
  const isDateValid = date.length > 0;
  const isFormValid = isLocationValid && isDateValid;

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    if (!isFormValid) return;

    setSaving(true);
    setError(null);

    try {
      const speciesList = targetSpeciesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const trip: Trip = {
        id: generateId(),
        userId: 'local-user', // placeholder until auth is wired
        locationType,
        ...(locationType === 'custom'
          ? { customLocation: customLocation.trim() }
          : { locationId }),
        date,
        notes: notes.trim(),
        targetSpecies: speciesList,
        companions: companions.trim(),
        safetyNotes: safetyNotes.trim(),
        syncStatus: 'pending',
      };

      await putRecord('trips', trip);
      router.push('/trips');
    } catch {
      setError('Failed to save trip. Please try again.');
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      <header className="mb-6">
        <Link
          href="/trips"
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal mb-2 inline-block"
        >
          ← Back to Trips
        </Link>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Create Trip
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Plan your next foraging outing. Saved locally first, synced when online.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* ── Location Type ── */}
        <fieldset>
          <legend className="font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-3">
            Where are you going?
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {LOCATION_TYPES.map((loc) => (
              <button
                key={loc.value}
                type="button"
                role="radio"
                aria-checked={locationType === loc.value}
                onClick={() => handleLocationTypeChange(loc.value)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left transition-colors ${
                  locationType === loc.value
                    ? 'border-brand-teal bg-brand-teal/10 ring-2 ring-brand-teal/30'
                    : 'border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 hover:bg-brand-teal/5'
                }`}
              >
                <span aria-hidden="true" className="text-lg">{loc.icon}</span>
                <span className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                  {loc.label}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── Location Selection ── */}
        {locationType === 'custom' ? (
          <div>
            <label
              htmlFor="custom-location"
              className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Location Name
            </label>
            <input
              id="custom-location"
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Enter a custom location name"
              aria-required="true"
              aria-invalid={touched && !isLocationValid}
              className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
            {touched && !isLocationValid && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                Please enter a location name.
              </p>
            )}
          </div>
        ) : (
          <div className="relative">
            <label
              htmlFor="location-search"
              className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Select {locationType === 'park' ? 'Park' : locationType === 'trail' ? 'Trail' : 'Route'}
            </label>

            {/* Search input that doubles as display */}
            <div className="relative">
              <input
                id="location-search"
                type="text"
                value={dropdownOpen ? locationSearch : selectedLocationName}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  if (!dropdownOpen) setDropdownOpen(true);
                }}
                onFocus={() => {
                  setDropdownOpen(true);
                  setLocationSearch('');
                }}
                placeholder={loadingLocations ? 'Loading locations…' : `Search ${locationType}s…`}
                aria-required="true"
                aria-invalid={touched && !isLocationValid}
                aria-expanded={dropdownOpen}
                aria-controls="location-listbox"
                aria-autocomplete="list"
                role="combobox"
                className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 pr-10 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
              />
              <svg
                aria-hidden="true"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/40 dark:text-brand-sand/40 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Dropdown list */}
            {dropdownOpen && (
              <ul
                id="location-listbox"
                role="listbox"
                aria-label={`Available ${locationType}s`}
                className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-brand-teal/20 bg-white dark:bg-brand-charcoal shadow-lg"
              >
                {filteredItems.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-brand-charcoal/50 dark:text-brand-sand/50">
                    {loadingLocations ? 'Loading…' : 'No results found'}
                  </li>
                ) : (
                  filteredItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={locationId === item.id}
                        onClick={() => {
                          setLocationId(item.id);
                          setLocationSearch('');
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          locationId === item.id
                            ? 'bg-brand-teal/10 text-brand-teal font-medium'
                            : 'text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/5'
                        }`}
                      >
                        {item.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}

            {touched && !isLocationValid && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                Please select a location.
              </p>
            )}
          </div>
        )}

        {/* ── Date ── */}
        <div>
          <label
            htmlFor="trip-date"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Date
          </label>
          <input
            id="trip-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-required="true"
            aria-invalid={touched && !isDateValid}
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
          {touched && !isDateValid && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
              Please select a date.
            </p>
          )}
        </div>

        {/* ── Target Species ── */}
        <div>
          <label
            htmlFor="trip-species"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Target Species
            <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50 ml-1">
              (comma-separated, optional)
            </span>
          </label>
          <input
            id="trip-species"
            type="text"
            value={targetSpeciesInput}
            onChange={(e) => setTargetSpeciesInput(e.target.value)}
            placeholder="e.g. Chanterelles, Morels, Chicken of the Woods"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        {/* ── Notes ── */}
        <div>
          <label
            htmlFor="trip-notes"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Notes
            <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50 ml-1">
              (optional)
            </span>
          </label>
          <textarea
            id="trip-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Weather conditions, gear to bring, meeting point…"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
          />
        </div>

        {/* ── Companions ── */}
        <div>
          <label
            htmlFor="trip-companions"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Companions
            <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50 ml-1">
              (optional)
            </span>
          </label>
          <input
            id="trip-companions"
            type="text"
            value={companions}
            onChange={(e) => setCompanions(e.target.value)}
            placeholder="Who's coming along?"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        {/* ── Safety Notes ── */}
        <div>
          <label
            htmlFor="trip-safety"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Safety Notes
            <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50 ml-1">
              (optional)
            </span>
          </label>
          <textarea
            id="trip-safety"
            rows={2}
            value={safetyNotes}
            onChange={(e) => setSafetyNotes(e.target.value)}
            placeholder="Allergies, emergency contacts, trail hazards…"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
          />
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Trip'}
        </button>
      </form>

      {/* Offline note */}
      <p className="text-xs text-center text-brand-charcoal/50 dark:text-brand-sand/50 mt-6">
        Trips are saved locally first and sync when you&apos;re back online.
      </p>
    </main>
  );
}
