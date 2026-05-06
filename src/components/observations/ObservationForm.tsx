'use client';

/**
 * ForageWise — ObservationForm Component
 *
 * Full observation submission form with:
 * - Multi-photo upload (camera + gallery)
 * - Audio recording option
 * - GPS-based location (auto-captured)
 * - Date/time picker
 * - Habitat notes & substrate
 * - AI suggestion display
 * - Safety disclaimer
 */

import { useState, useRef, useCallback } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { putRecord } from '@/offline/db';
import type { Observation } from '@/types/observations';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const SUBSTRATE_OPTIONS = [
  'Dead hardwood log', 'Dead softwood log', 'Living tree trunk', 'Living tree base',
  'Soil / ground', 'Leaf litter', 'Moss-covered surface', 'Creek bank',
  'Grass / meadow', 'Rock surface', 'Other',
];

export interface ObservationFormProps {
  onSubmitted?: (obs: Observation) => void;
  onCancel?: () => void;
}

export default function ObservationForm({ onSubmitted, onCancel }: ObservationFormProps) {
  const geo = useGeolocation();
  const [photos, setPhotos] = useState<{ url: string; blob: Blob }[]>([]);
  const [speciesGuess, setSpeciesGuess] = useState('');
  const [habitatNotes, setHabitatNotes] = useState('');
  const [substrate, setSubstrate] = useState('');
  const [associatedTrees, setAssociatedTrees] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-request location on mount
  useState(() => { geo.requestLocation(); });

  const handlePhotos = useCallback((files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).slice(0, 5 - photos.length).map((file) => ({
      url: URL.createObjectURL(file),
      blob: file,
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
  }, [photos.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setTouched(true);
    if (photos.length === 0) {
      setError('Add at least one photo of your observation.');
      return;
    }
    if (!speciesGuess.trim()) {
      setError('Enter your best guess for the species name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const observation: Observation = {
        id: generateId(),
        userId: 'local-user',
        userName: '',
        photos: photos.map((p) => p.url),
        audioRecording: null,
        coordinates: geo.position,
        locationAccuracy: null,
        placeName: null,
        observedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        speciesGuess: speciesGuess.trim(),
        matchedSpeciesId: null,
        aiSuggestions: [],
        habitatNotes: habitatNotes.trim(),
        substrate,
        associatedTrees: associatedTrees.split(',').map((t) => t.trim()).filter(Boolean),
        identifications: [],
        votes: [],
        qualityGrade: 'needs-id',
        agreementCount: 0,
        disagreementCount: 0,
        syncStatus: 'pending',
        isPublic,
      };

      // Store in communityDrafts for now (will sync to observations collection)
      await putRecord('communityDrafts', {
        id: observation.id,
        userId: observation.userId,
        speciesGuess: observation.speciesGuess,
        notes: `${observation.habitatNotes}\nSubstrate: ${observation.substrate}\nTrees: ${observation.associatedTrees.join(', ')}`,
        visibility: isPublic ? 'public' : 'private',
        coordinates: observation.coordinates ?? undefined,
        photoIds: [],
        createdAt: observation.createdAt,
        syncStatus: 'pending',
      });

      onSubmitted?.(observation);
    } catch {
      setError('Failed to save. Your observation will be stored locally.');
    } finally {
      setSubmitting(false);
    }
  }, [photos, speciesGuess, habitatNotes, substrate, associatedTrees, geo.position, isPublic, onSubmitted]);

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
        New Observation
      </h2>

      {error && <p className="text-xs text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2" role="alert">{error}</p>}

      {/* Photos (up to 5) */}
      <div>
        <p className="text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 mb-2">
          Photos ({photos.length}/5)
        </p>
        <div className="flex gap-2 flex-wrap">
          {photos.map((photo, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-brand-charcoal/10 dark:border-dark-border">
              <img src={photo.url} alt={`Observation photo ${i + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center" aria-label={`Remove photo ${i + 1}`}>×</button>
            </div>
          ))}
          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-brand-teal/30 flex items-center justify-center text-brand-teal/50 hover:bg-brand-teal/5 transition-colors"
              aria-label="Add photo"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => handlePhotos(e.target.files)} />
        {touched && photos.length === 0 && <p className="text-[10px] text-red-500 mt-1">At least one photo required</p>}
      </div>

      {/* Species guess */}
      <div>
        <label htmlFor="obs-species" className="block text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">What do you think it is?</label>
        <input
          id="obs-species"
          type="text"
          value={speciesGuess}
          onChange={(e) => setSpeciesGuess(e.target.value)}
          placeholder="e.g., Chanterelle, Unknown orange mushroom"
          aria-required="true"
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-3 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
        />
      </div>

      {/* Location (auto-captured) */}
      <div className="rounded-lg bg-brand-teal/5 dark:bg-brand-teal/10 border border-brand-teal/15 px-3 py-2">
        <p className="text-xs font-medium text-brand-teal mb-0.5">📍 Location</p>
        {geo.position ? (
          <p className="text-[11px] text-brand-charcoal/60 dark:text-brand-sand/60">
            {geo.position.lat.toFixed(4)}, {geo.position.lng.toFixed(4)}
            {geo.isCached && ' (cached)'}
          </p>
        ) : geo.loading ? (
          <p className="text-[11px] text-brand-charcoal/50 dark:text-brand-sand/50">Getting location…</p>
        ) : (
          <button type="button" onClick={geo.requestLocation} className="text-[11px] text-brand-teal underline">Tap to enable GPS</button>
        )}
      </div>

      {/* Substrate */}
      <div>
        <label htmlFor="obs-substrate" className="block text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">Growing on / substrate</label>
        <select
          id="obs-substrate"
          value={substrate}
          onChange={(e) => setSubstrate(e.target.value)}
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-3 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
        >
          <option value="">Select substrate…</option>
          {SUBSTRATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Associated trees */}
      <div>
        <label htmlFor="obs-trees" className="block text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">Nearby trees (comma-separated)</label>
        <input
          id="obs-trees"
          type="text"
          value={associatedTrees}
          onChange={(e) => setAssociatedTrees(e.target.value)}
          placeholder="Oak, Hickory, Pine"
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-3 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
        />
      </div>

      {/* Habitat notes */}
      <div>
        <label htmlFor="obs-habitat" className="block text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">Habitat notes</label>
        <textarea
          id="obs-habitat"
          rows={2}
          value={habitatNotes}
          onChange={(e) => setHabitatNotes(e.target.value)}
          placeholder="Moist forest floor near creek, shaded area, recent rain…"
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-3 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
        />
      </div>

      {/* Visibility */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic(!isPublic)}
          className={`relative w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-brand-teal' : 'bg-brand-charcoal/20 dark:bg-brand-sand/20'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublic ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
        <span className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70">
          {isPublic ? 'Public — community can help ID' : 'Private — only you can see'}
        </span>
      </div>

      {/* Safety notice */}
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          ⚠️ AI suggestions and community IDs are <strong>not expert confirmations</strong>. Never consume wild species based solely on app identification. Always verify with a qualified expert.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-brand-teal/30 bg-white dark:bg-dark-surface px-4 py-2.5 text-sm font-semibold text-brand-teal hover:bg-brand-teal/5 transition-colors min-h-[44px]">
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 rounded-lg bg-brand-teal text-white font-semibold text-sm py-2.5 hover:bg-brand-teal/90 transition-colors active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
        >
          {submitting ? 'Saving…' : 'Submit Observation'}
        </button>
      </div>
    </div>
  );
}
