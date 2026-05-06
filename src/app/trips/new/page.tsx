'use client';

import { Suspense, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/auth/useAuth';
import type { LocationType, Trip, Species } from '@/types';
import { putRecord, batchGetRecords } from '@/offline/db';
import ParkPicker from '@/components/trip/ParkPicker';
import TrailPicker from '@/components/trip/TrailPicker';
import LikelySpeciesPanel from '@/components/trip/LikelySpeciesPanel';

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

/** The two top-level location modes for trip creation. */
type LocationMode = 'park' | 'custom';

export default function CreateTripPage() {
  return (
    <Suspense fallback={null}>
      <CreateTripPageInner />
    </Suspense>
  );
}

function CreateTripPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  // --- Location mode: park-based or custom ---
  const [locationMode, setLocationMode] = useState<LocationMode>('park');

  // --- Park-based flow state ---
  // Pre-select park from URL query param (e.g. /trips/new?parkId=park-big-ridge&parkName=Big%20Ridge)
  const initialParkId = searchParams.get('parkId');
  const initialParkName = searchParams.get('parkName');
  const [selectedParkId, setSelectedParkId] = useState<string | null>(initialParkId);
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);

  // --- Custom location state ---
  const [customLocation, setCustomLocation] = useState('');

  // --- Form state ---
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [targetSpecies, setTargetSpecies] = useState<string[]>([]);
  const [targetSpeciesInput, setTargetSpeciesInput] = useState('');
  const [companions, setCompanions] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');

  // --- Species name lookup for display ---
  const [speciesNames, setSpeciesNames] = useState<Record<string, string>>({});

  // --- Submission state ---
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  // --- Validation ---
  const [touched, setTouched] = useState(false);

  // --- Planning started (show form only after user clicks "Start Planning") ---
  // Auto-start if a parkId was passed from the map page
  const [planningStarted, setPlanningStarted] = useState(!!initialParkId);

  // --- Park picker collapsed when pre-selected ---
  const [parkPickerCollapsed, setParkPickerCollapsed] = useState(!!initialParkId);

  // Track selected park name for collapsed display
  const [selectedParkName, setSelectedParkName] = useState<string | null>(initialParkName);

  // Load park name from IndexedDB if parkId is provided but parkName is not
  useEffect(() => {
    if (initialParkId && !initialParkName) {
      const loadName = async () => {
        try {
          const { getRecord } = await import('@/offline/db');
          const park = await getRecord('parks', initialParkId);
          if (park) setSelectedParkName(park.name);
        } catch { /* silently fail */ }
      };
      loadName();
    }
  }, [initialParkId, initialParkName]);

  // Ref for auto-scrolling to form when park is pre-selected
  const formRef = useRef<HTMLFormElement>(null);

  // Current month for LikelySpeciesPanel
  const currentMonth = useMemo(() => new Date().getMonth(), []);

  // Auto-scroll to form when park is pre-selected via URL params
  useEffect(() => {
    if (initialParkId && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [initialParkId]);

  // Load species names for displaying added target species
  useEffect(() => {
    if (targetSpecies.length === 0) return;

    let cancelled = false;
    async function loadNames() {
      try {
        const records = await batchGetRecords('species', targetSpecies);
        if (!cancelled) {
          const names: Record<string, string> = {};
          for (const r of records) {
            const sp = r as Species;
            names[sp.id] = sp.commonName;
          }
          setSpeciesNames((prev) => ({ ...prev, ...names }));
        }
      } catch {
        // Silently handle — names are optional display
      }
    }
    loadNames();
    return () => { cancelled = true; };
  }, [targetSpecies]);

  // Reset park/trail selection when switching modes
  const handleModeChange = useCallback((mode: LocationMode) => {
    setLocationMode(mode);
    setSelectedParkId(null);
    setSelectedTrailId(null);
    setCustomLocation('');
    setTargetSpecies([]);
    setTargetSpeciesInput('');
  }, []);

  // Handle park selection — collapse picker after selection
  const handleSelectPark = useCallback((parkId: string) => {
    setSelectedParkId(parkId);
    setSelectedTrailId(null);
    setTargetSpecies([]);
    setParkPickerCollapsed(true);
    // Load park name for collapsed display
    async function loadParkName() {
      try {
        const { getRecord } = await import('@/offline/db');
        const park = await getRecord('parks', parkId);
        if (park) setSelectedParkName(park.name);
      } catch { /* silently fail */ }
    }
    if (parkId) loadParkName();
  }, []);

  // Handle trail selection
  const handleSelectTrail = useCallback((trailId: string) => {
    setSelectedTrailId(trailId);
  }, []);

  // Handle adding species from LikelySpeciesPanel
  const handleAddSpeciesToTrip = useCallback((speciesId: string) => {
    setTargetSpecies((prev) => {
      if (prev.includes(speciesId)) return prev;
      return [...prev, speciesId];
    });
  }, []);

  // Remove a species from the target list
  const handleRemoveSpecies = useCallback((speciesId: string) => {
    setTargetSpecies((prev) => prev.filter((id) => id !== speciesId));
  }, []);

  // Validation
  const isLocationValid = locationMode === 'custom'
    ? customLocation.trim().length > 0
    : selectedParkId !== null;
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
      // Merge manually typed species with species added from LikelySpeciesPanel
      const manualSpecies = targetSpeciesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const allTargetSpecies = [...targetSpecies, ...manualSpecies];

      const locationType: LocationType = locationMode === 'custom' ? 'custom' : 'park';

      const trip: Trip = {
        id: generateId(),
        userId: 'local-user', // placeholder until auth is wired
        locationType,
        ...(locationMode === 'custom'
          ? { customLocation: customLocation.trim() }
          : { locationId: selectedParkId! }),
        ...(selectedTrailId ? { trailId: selectedTrailId } : {}),
        date,
        notes: notes.trim(),
        targetSpecies: allTargetSpecies,
        companions: companions.trim(),
        safetyNotes: safetyNotes.trim(),
        syncStatus: 'pending',
      };

      await putRecord('trips', trip);
      setShowSharePrompt(true);
      setSaving(false);
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

      {/* Start Planning gate — show a hero CTA before the form */}
      {!planningStarted ? (
        <section className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            aria-hidden="true"
            className="w-20 h-20 text-brand-teal/30 mb-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 6.75V15m6-6v8.25m.503-12.713l5.248-2.187A.75.75 0 0121.75 3v14.25a.75.75 0 01-.497.702l-5.253 2.188a.75.75 0 01-.503 0L9.75 17.953a.75.75 0 00-.503 0l-5.248 2.187A.75.75 0 013 19.39V5.14a.75.75 0 01.497-.702l5.253-2.188a.75.75 0 01.503 0L15 5.327"
            />
          </svg>
          <h2 className="font-heading font-bold text-xl text-brand-forest dark:text-brand-moss mb-2">
            Ready to explore?
          </h2>
          <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 mb-6 max-w-xs">
            Pick a park, choose a trail, and discover what species you might find along the way.
          </p>
          <button
            type="button"
            onClick={() => setPlanningStarted(true)}
            className="rounded-lg bg-brand-teal text-white font-semibold text-base px-8 py-3.5 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] shadow-md"
          >
            🌿 Start Planning My Trip
          </button>
        </section>
      ) : (
      <>

      {/* Pre-selected park indicator from map */}
      {initialParkName && initialParkId && (
        <div className="mb-4 rounded-lg bg-brand-teal/10 border border-brand-teal/20 px-4 py-3">
          <p className="text-xs text-brand-teal font-medium">
            📍 Planning a visit to <span className="font-semibold">{initialParkName}</span>
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} ref={formRef} className="space-y-6" noValidate>
        {/* ── Step 1: Location Mode Selector ── */}
        <fieldset>
          <legend className="font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-3">
            Where are you going?
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={locationMode === 'park'}
              onClick={() => handleModeChange('park')}
              className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left transition-colors ${
                locationMode === 'park'
                  ? 'border-brand-teal bg-brand-teal/10 ring-2 ring-brand-teal/30'
                  : 'border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 hover:bg-brand-teal/5'
              }`}
            >
              <span aria-hidden="true" className="text-lg">🏞️</span>
              <span className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                Select a Park
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={locationMode === 'custom'}
              onClick={() => handleModeChange('custom')}
              className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left transition-colors ${
                locationMode === 'custom'
                  ? 'border-brand-teal bg-brand-teal/10 ring-2 ring-brand-teal/30'
                  : 'border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 hover:bg-brand-teal/5'
              }`}
            >
              <span aria-hidden="true" className="text-lg">📍</span>
              <span className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                Custom Location
              </span>
            </button>
          </div>
        </fieldset>

        {/* ── Park-based flow ── */}
        {locationMode === 'park' && (
          <>
            {/* Park Picker — collapsed when pre-selected */}
            {parkPickerCollapsed && (selectedParkName || initialParkId) ? (
              <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                    🏞️ {selectedParkName || 'Loading park...'}
                  </p>
                  <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">Selected park</p>
                </div>
                <button
                  type="button"
                  onClick={() => setParkPickerCollapsed(false)}
                  aria-label="Change park selection"
                  className="rounded-lg border border-brand-teal/30 px-3 py-2 text-xs font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                  style={{ minHeight: '44px' }}
                >
                  Change
                </button>
              </div>
            ) : (
              <ParkPicker
                selectedParkId={selectedParkId}
                onSelectPark={handleSelectPark}
              />
            )}

            {touched && !isLocationValid && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                Please select a park.
              </p>
            )}

            {/* Trail Picker — shown after park selection */}
            {selectedParkId && (
              <TrailPicker
                parkId={selectedParkId}
                selectedTrailId={selectedTrailId}
                onSelectTrail={handleSelectTrail}
              />
            )}

            {/* Likely Species Panel — shown after park selection */}
            {selectedParkId && (
              <LikelySpeciesPanel
                parkId={selectedParkId}
                trailId={selectedTrailId ?? undefined}
                currentMonth={currentMonth}
                onAddToTrip={handleAddSpeciesToTrip}
              />
            )}

            {/* Display added target species */}
            {targetSpecies.length > 0 && (
              <div>
                <p className="font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-2">
                  Target Species
                </p>
                <div className="flex flex-wrap gap-2">
                  {targetSpecies.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 text-brand-teal text-xs font-medium px-3 py-1.5"
                    >
                      {speciesNames[id] || id}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecies(id)}
                        aria-label={`Remove ${speciesNames[id] || id}`}
                        className="ml-0.5 hover:text-brand-teal/70 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Custom location flow ── */}
        {locationMode === 'custom' && (
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

        {/* ── Additional Target Species (manual input) ── */}
        <div>
          <label
            htmlFor="trip-species"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Additional Target Species
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
        <div className="pb-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Start Planning'}
          </button>
        </div>
      </form>

      {/* Share prompt after successful save */}
      {showSharePrompt && (
        <div
          role="dialog"
          aria-label="Share trip prompt"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-dark-surface border border-brand-teal/20 shadow-xl p-6 text-center">
            <div className="text-3xl mb-3" aria-hidden="true">🌿</div>
            <h2 className="font-heading font-bold text-lg text-brand-forest dark:text-brand-moss mb-2">
              Trip saved!
            </h2>
            <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-2">
              Would you like to share this trip with the community?
            </p>
            {!isAuthenticated && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 mb-4">
                You&apos;ll need to sign in or create an account to share with the community. Click &quot;Yes, share it&quot; to continue to the login screen.
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/trips')}
                aria-label="No, go to trips list"
                className="flex-1 rounded-lg border border-brand-teal/30 bg-white dark:bg-dark-surface px-4 py-3 text-sm font-semibold text-brand-teal hover:bg-brand-teal/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                style={{ minHeight: '44px' }}
              >
                No thanks
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push('/login?returnTo=/community');
                  } else {
                    router.push('/community');
                  }
                }}
                aria-label="Yes, share this trip"
                className="flex-1 rounded-lg bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                style={{ minHeight: '44px' }}
              >
                Yes, share it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline note */}
      <p className="text-xs text-center text-brand-charcoal/50 dark:text-brand-sand/50 mt-6">
        Trips are saved locally first and sync when you&apos;re back online.
      </p>
      </>
      )}
    </main>
  );
}
