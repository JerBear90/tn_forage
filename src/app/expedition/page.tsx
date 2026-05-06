'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type {
  ExpeditionLog,
  Photo,
  LogVisibility,
  NearbyTree,
  Trip,
  Coordinates,
} from '@/types';
import { putRecord, getAllRecords } from '@/offline/db';
import { useGeolocation } from '@/hooks/useGeolocation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Format a Date to a datetime-local input value (YYYY-MM-DDTHH:MM). */
function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TREE_OPTIONS: NearbyTree[] = [
  'Oak',
  'Hickory',
  'Elm',
  'Maple',
  'Pine',
  'Poplar',
  'Unknown',
];

// ---------------------------------------------------------------------------
// Photo preview type (in-memory before save)
// ---------------------------------------------------------------------------

interface PhotoPreview {
  id: string;
  file: File;
  objectUrl: string;
  caption: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExpeditionPage() {
  // --- Photo state ---
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- Form fields ---
  const [dateTime, setDateTime] = useState(() => toDateTimeLocal(new Date()));
  const [speciesGuess, setSpeciesGuess] = useState('');
  const [habitat, setHabitat] = useState('');
  const [treeNearby, setTreeNearby] = useState<NearbyTree | ''>('');
  const [visibility, setVisibility] = useState<LogVisibility>('private');
  const [notes, setNotes] = useState('');

  // --- Location ---
  const geo = useGeolocation();
  const [manualLocation, setManualLocation] = useState('');
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');

  // --- Trip association ---
  const [trips, setTrips] = useState<{ id: string; label: string }[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [loadingTrips, setLoadingTrips] = useState(true);

  // --- Submission ---
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load trips from IndexedDB for the optional association dropdown
  useEffect(() => {
    let cancelled = false;
    async function loadTrips() {
      try {
        const tripsData = await getAllRecords('trips');
        if (!cancelled) {
          const items = (tripsData as Trip[])
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((t) => ({
              id: t.id,
              label: `${t.date} — ${t.customLocation || t.locationId || 'Trip'}`,
            }));
          setTrips(items);
        }
      } catch {
        // trips may not exist yet
      } finally {
        if (!cancelled) setLoadingTrips(false);
      }
    }
    loadTrips();
    return () => { cancelled = true; };
  }, []);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.objectUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Photo handlers ---
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newPhotos: PhotoPreview[] = Array.from(files).map((file) => ({
      id: generateId(),
      file,
      objectUrl: URL.createObjectURL(file),
      caption: '',
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.objectUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const updateCaption = useCallback((id: string, caption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, caption } : p)),
    );
  }, []);

  // --- Resolved coordinates ---
  const resolvedCoordinates: Coordinates | undefined = useMemo(() => {
    if (locationMode === 'gps' && geo.position) {
      return { lat: geo.position.lat, lng: geo.position.lng };
    }
    return undefined;
  }, [locationMode, geo.position]);

  // --- Save handler ---
  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const logId = generateId();
      const now = new Date().toISOString();

      // Save each photo as a blob to the photos store
      const photoIds: string[] = [];
      for (const photo of photos) {
        const arrayBuffer = await photo.file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: photo.file.type });
        const photoRecord: Photo = {
          id: photo.id,
          expeditionLogId: logId,
          blob,
          mimeType: photo.file.type || 'image/jpeg',
          caption: photo.caption.trim() || undefined,
          coordinates: resolvedCoordinates,
          createdAt: now,
          syncStatus: 'pending',
        };
        await putRecord('photos', photoRecord);
        photoIds.push(photo.id);
      }

      // Build the expedition log
      const log: ExpeditionLog = {
        id: logId,
        userId: 'local-user', // placeholder until auth is wired
        tripId: selectedTripId || '',
        photos: photoIds,
        coordinates: resolvedCoordinates,
        speciesGuess: speciesGuess.trim() || undefined,
        notes: notes.trim(),
        habitat: habitat.trim() || undefined,
        treeNearby: treeNearby || undefined,
        visibility,
        syncStatus: 'pending',
        createdAt: dateTime ? new Date(dateTime).toISOString() : now,
      };

      await putRecord('expeditionLogs', log);

      // Reset form
      setSaved(true);
      // Scroll to top so user sees the success banner
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Keep the success state visible — don't reset form immediately
      // so the user sees confirmation before the form clears
      setTimeout(() => {
        setPhotos([]);
        setSpeciesGuess('');
        setHabitat('');
        setTreeNearby('');
        setVisibility('private');
        setNotes('');
        setManualLocation('');
        setSelectedTripId('');
        setDateTime(toDateTimeLocal(new Date()));
      }, 100);
    } catch {
      setError('Failed to save log entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      <header className="mb-6">
        <Link
          href="/"
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal mb-2 inline-block"
        >
          ← Home
        </Link>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Expedition Log
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Quick-log your field observations. Photos and data save locally first.
        </p>
      </header>

      {/* Success banner */}
      {saved && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 px-4 py-4 text-center"
        >
          <span className="text-2xl block mb-1" aria-hidden="true">✅</span>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            Log entry saved successfully!
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            It will sync when you&apos;re back online. You can add another entry below.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <section
        aria-label="New log entry"
        className="rounded-xl border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 p-5 mb-6"
      >
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-4">
          New Entry
        </h2>

        <div className="space-y-5">
          {/* ── Photos ── */}
          <div>
            <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
              Photos
            </p>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              aria-label="Take photo with camera"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              aria-label="Upload photos from gallery"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-brand-teal/30 bg-brand-teal/5 py-4 text-brand-teal hover:bg-brand-teal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[64px]"
              >
                <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                <span className="text-xs font-medium">Camera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-brand-moss/30 bg-brand-moss/5 py-4 text-brand-moss hover:bg-brand-moss/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[64px]"
              >
                <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <span className="text-xs font-medium">Gallery</span>
              </button>
            </div>

            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <div className="mt-3 space-y-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex gap-3 items-start rounded-lg border border-brand-teal/10 bg-brand-sand/20 dark:bg-brand-charcoal/40 p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.objectUrl}
                      alt={photo.caption || 'Photo preview'}
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`caption-${photo.id}`} className="sr-only">
                        Caption for photo
                      </label>
                      <input
                        id={`caption-${photo.id}`}
                        type="text"
                        value={photo.caption}
                        onChange={(e) => updateCaption(photo.id, e.target.value)}
                        placeholder="Add a caption…"
                        className="w-full rounded border border-brand-teal/15 bg-white/60 dark:bg-brand-charcoal/30 px-2 py-1.5 text-xs text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-1 focus:ring-brand-teal/40"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      aria-label={`Remove photo${photo.caption ? `: ${photo.caption}` : ''}`}
                      className="flex-shrink-0 rounded-full p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 transition-colors"
                    >
                      <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Date/Time ── */}
          <div>
            <label
              htmlFor="log-datetime"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Date &amp; Time
            </label>
            <input
              id="log-datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>

          {/* ── Location ── */}
          <div>
            <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
              Location
            </p>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setLocationMode('gps');
                  geo.requestLocation();
                }}
                disabled={geo.loading}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                  locationMode === 'gps'
                    ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                    : 'border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/5'
                }`}
              >
                {geo.loading ? '⏳ Getting…' : '📍 Get Location'}
              </button>
              <button
                type="button"
                onClick={() => setLocationMode('manual')}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                  locationMode === 'manual'
                    ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                    : 'border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/5'
                }`}
              >
                ✏️ Enter Manually
              </button>
            </div>

            {locationMode === 'gps' && geo.position && (
              <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
                📍 {geo.position.lat.toFixed(5)}, {geo.position.lng.toFixed(5)}
                {geo.isCached && ' (cached)'}
              </p>
            )}
            {locationMode === 'gps' && geo.error && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {geo.error}
              </p>
            )}

            {locationMode === 'manual' && (
              <div className="mt-1">
                <label htmlFor="log-manual-location" className="sr-only">
                  Manual location
                </label>
                <input
                  id="log-manual-location"
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="e.g. Radnor Lake, near the dam trail"
                  className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                />
              </div>
            )}
          </div>

          {/* ── Species Guess ── */}
          <div>
            <label
              htmlFor="log-species"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Species Guess
            </label>
            <input
              id="log-species"
              type="text"
              value={speciesGuess}
              onChange={(e) => setSpeciesGuess(e.target.value)}
              placeholder="What do you think it is?"
              className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>

          {/* ── Habitat Notes ── */}
          <div>
            <label
              htmlFor="log-habitat"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Habitat Notes
            </label>
            <textarea
              id="log-habitat"
              rows={2}
              value={habitat}
              onChange={(e) => setHabitat(e.target.value)}
              placeholder="Soil type, moisture, nearby trees, growth substrate…"
              className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
            />
          </div>

          {/* ── Tree Nearby ── */}
          <div>
            <label
              htmlFor="log-tree"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Tree Nearby
            </label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tree nearby">
              {TREE_OPTIONS.map((tree) => (
                <button
                  key={tree}
                  type="button"
                  role="radio"
                  aria-checked={treeNearby === tree}
                  onClick={() => setTreeNearby(treeNearby === tree ? '' : tree)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors min-h-[36px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                    treeNearby === tree
                      ? 'border-brand-teal bg-brand-teal/15 text-brand-teal'
                      : 'border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/5'
                  }`}
                >
                  {tree}
                </button>
              ))}
            </div>
          </div>

          {/* ── Additional Notes ── */}
          <div>
            <label
              htmlFor="log-notes"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Additional Notes
              <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50 ml-1">
                (optional)
              </span>
            </label>
            <textarea
              id="log-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other observations…"
              className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
            />
          </div>

          {/* ── Trip Association ── */}
          <div>
            <label
              htmlFor="log-trip"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Link to Trip
              <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50 ml-1">
                (optional)
              </span>
            </label>
            <select
              id="log-trip"
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            >
              <option value="">
                {loadingTrips ? 'Loading trips…' : 'No trip selected'}
              </option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Visibility ── */}
          <div>
            <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
              Visibility
            </p>
            <div className="flex gap-2" role="radiogroup" aria-label="Log visibility">
              <button
                type="button"
                role="radio"
                aria-checked={visibility === 'private'}
                onClick={() => setVisibility('private')}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                  visibility === 'private'
                    ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                    : 'border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/5'
                }`}
              >
                🔒 Private
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={visibility === 'public'}
                onClick={() => setVisibility('public')}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                  visibility === 'public'
                    ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                    : 'border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/5'
                }`}
              >
                🌐 Public
              </button>
            </div>
            <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mt-1">
              Logs are private by default. Public logs have GPS coordinates
              fuzzed for privacy.
            </p>
          </div>

          {/* ── Save ── */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
          >
            {saving ? 'Saving…' : 'Save Log Entry'}
          </button>
        </div>
      </section>

      {/* Previous logs empty state */}
      <section aria-label="Previous logs" className="text-center py-8">
        <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50">
          Your expedition logs will appear here.
        </p>
        <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
          All entries save locally and sync when online.
        </p>
      </section>
    </main>
  );
}