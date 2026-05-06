'use client';

/**
 * ForageWise — Community Page
 *
 * Displays user-submitted sightings from IndexedDB communityDrafts store,
 * plus sub-tab navigation for Sightings, Challenges, and Blog sections.
 *
 * - Hash-based sub-tab routing: /community#sightings, /community#challenges, /community#blog
 * - Private-by-default sightings (task 14.4)
 * - Location fuzzing for public posts (task 14.5)
 * - Flagging with reason options (task 14.3)
 * - Comment/suggest ID placeholders (task 14.2)
 * - Matched species images on sighting cards (task 12.4)
 * - TrendingSpeciesSection, photo preview, pull-to-refresh (task 12.6)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/auth/useAuth';
import OnlineHint from '@/components/OnlineHint';
import IdRequest from '@/components/community/IdRequest';
import { getAllRecords, putRecord } from '@/offline/db';
import { applyLocationPrivacy } from '@/services/locationPrivacy';
import { matchSpeciesImage, type KnownSpeciesRecord } from '@/services/trending';
import TrendingSpeciesSection from '@/components/community/TrendingSpeciesSection';
import ChallengesSection from '@/components/ChallengesSection';
import SkeletonCard from '@/components/skeletons/SkeletonCard';
import type {
  CommunityDraft,
  CommunityFlag,
  CommunitySubSection,
  BlogArticle,
  FlagReason,
  LogVisibility,
  Coordinates,
} from '@/types';
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Flag reason labels
// ---------------------------------------------------------------------------

const FLAG_REASONS: { value: FlagReason; label: string }[] = [
  { value: 'unsafe-content', label: 'Unsafe content' },
  { value: 'incorrect-id', label: 'Incorrect ID' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

// ---------------------------------------------------------------------------
// New Sighting Form
// ---------------------------------------------------------------------------

interface NewSightingFormProps {
  onSave: (draft: CommunityDraft) => void;
  onCancel: () => void;
}

function NewSightingForm({ onSave, onCancel }: NewSightingFormProps) {
  const [speciesGuess, setSpeciesGuess] = useState('');
  const [notes, setNotes] = useState('');
  const [visibility, setVisibility] = useState<LogVisibility>('private');
  const [saving, setSaving] = useState(false);
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');
  const geo = useGeolocation();

  // Photo handling — stores photo IDs, names, and preview URLs
  const [photoFiles, setPhotoFiles] = useState<{ id: string; name: string; previewUrl?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photoFiles.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).map((f) => ({
      id: generateId(),
      name: f.name,
      previewUrl: URL.createObjectURL(f),
    }));
    setPhotoFiles((prev) => [...prev, ...newPhotos]);
  }, []);

  const handleRemovePhoto = useCallback((photoId: string) => {
    setPhotoFiles((prev) => {
      const removed = prev.find((p) => p.id === photoId);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((p) => p.id !== photoId);
    });
  }, []);

  async function handleSubmit() {
    setSaving(true);
    const now = new Date().toISOString();

    const rawCoords: Coordinates | undefined =
      locationMode === 'gps' && geo.position
        ? { lat: geo.position.lat, lng: geo.position.lng }
        : undefined;

    // Apply location privacy — fuzz for public, keep exact for private
    const coords = applyLocationPrivacy(rawCoords, visibility);

    const draft: CommunityDraft = {
      id: generateId(),
      userId: 'local-user', // placeholder until auth wired
      speciesGuess: speciesGuess.trim() || undefined,
      photos: photoFiles.map((p) => p.id),
      coordinates: coords,
      notes: notes.trim(),
      visibility,
      createdAt: now,
      updatedAt: now,
    };

    await putRecord('communityDrafts', draft);
    onSave(draft);
    setSaving(false);
  }

  return (
    <section
      aria-label="New sighting form"
      className="rounded-xl border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 p-5 mb-6"
    >
      <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-4">
        New Sighting
      </h2>

      <div className="space-y-4">
        {/* Species Guess */}
        <div>
          <label
            htmlFor="sighting-species"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Species Guess
          </label>
          <input
            id="sighting-species"
            type="text"
            value={speciesGuess}
            onChange={(e) => setSpeciesGuess(e.target.value)}
            placeholder="What do you think it is?"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        {/* Photos */}
        <div>
          <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
            Photos
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            aria-label="Upload sighting photos"
            onChange={(e) => {
              handleFileSelect(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-teal/30 bg-brand-teal/5 py-3 text-brand-teal hover:bg-brand-teal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[48px]"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-sm font-medium">Add Photos</span>
          </button>

          {/* Photo preview thumbnails (Req 9.1) */}
          {photoFiles.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
                {photoFiles.length} photo{photoFiles.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Selected photo previews">
                {photoFiles.map((photo) => (
                  <div key={photo.id} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-brand-teal/20 bg-brand-sand/30 dark:bg-brand-charcoal/40">
                    {photo.previewUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={photo.previewUrl}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <span className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 text-center px-1 truncate">
                          {photo.name}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-teal"
                      aria-label={`Remove photo ${photo.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
            Location
          </p>
          <div className="flex gap-2">
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
              {geo.loading ? '⏳ Getting…' : '📍 GPS Location'}
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
              ✏️ Skip Location
            </button>
          </div>
          {locationMode === 'gps' && geo.position && (
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-1">
              📍 {geo.position.lat.toFixed(5)}, {geo.position.lng.toFixed(5)}
              {geo.isCached && ' (cached)'}
            </p>
          )}
          {locationMode === 'gps' && geo.error && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {geo.error}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="sighting-notes"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Notes
          </label>
          <textarea
            id="sighting-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what you found, habitat, nearby trees…"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
          />
        </div>

        {/* Visibility (14.4) */}
        <div>
          <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
            Visibility
          </p>
          <div className="flex gap-2" role="radiogroup" aria-label="Sighting visibility">
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
            Sightings are private by default. Public sightings have GPS coordinates fuzzed for privacy.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 font-medium text-sm py-2.5 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-lg bg-brand-teal text-white font-semibold text-sm py-2.5 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
          >
            {saving ? 'Saving…' : 'Save Sighting'}
          </button>
        </div>
      </div>
    </section>
  );
}


// ---------------------------------------------------------------------------
// Flag Dialog
// ---------------------------------------------------------------------------

interface FlagDialogProps {
  sightingId: string;
  onClose: () => void;
  onSubmit: (flag: CommunityFlag) => void;
}

function FlagDialog({ sightingId, onClose, onSubmit }: FlagDialogProps) {
  const [reason, setReason] = useState<FlagReason | ''>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleFlag() {
    if (!reason) return;
    setSubmitting(true);

    const flag: CommunityFlag = {
      id: generateId(),
      targetId: sightingId,
      userId: 'local-user',
      reason,
      details: details.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await putRecord('communityFlags', flag);
    onSubmit(flag);
    setSubmitting(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-label="Report sighting"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-brand-charcoal border border-brand-teal/20 p-5 shadow-lg">
        <h3 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-3">
          Report Sighting
        </h3>

        <fieldset>
          <legend className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
            Reason
          </legend>
          <div className="space-y-2">
            {FLAG_REASONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors min-h-[44px] ${
                  reason === opt.value
                    ? 'border-brand-teal bg-brand-teal/10'
                    : 'border-brand-teal/15 bg-white/60 dark:bg-brand-charcoal/40 hover:bg-brand-teal/5'
                }`}
              >
                <input
                  type="radio"
                  name="flag-reason"
                  value={opt.value}
                  checked={reason === opt.value}
                  onChange={() => setReason(opt.value)}
                  className="accent-brand-teal w-4 h-4"
                />
                <span className="text-sm text-brand-charcoal dark:text-brand-sand">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {reason === 'other' && (
          <div className="mt-3">
            <label htmlFor="flag-details" className="sr-only">
              Additional details
            </label>
            <textarea
              id="flag-details"
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please describe the issue…"
              className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-3 py-2 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
            />
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 font-medium text-sm py-2.5 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFlag}
            disabled={!reason || submitting}
            className="flex-1 rounded-lg bg-red-600 text-white font-semibold text-sm py-2.5 hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
          >
            {submitting ? 'Reporting…' : 'Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sighting Card
// ---------------------------------------------------------------------------

interface SightingCardProps {
  sighting: CommunityDraft;
  knownSpecies: KnownSpeciesRecord[];
  onFlag: (id: string) => void;
}

function SightingCard({ sighting, knownSpecies, onFlag }: SightingCardProps) {
  const [showComments, setShowComments] = useState(false);

  // Match species guess against known species/plants for image (Req 7.1, 7.2)
  const speciesMatch = sighting.speciesGuess
    ? matchSpeciesImage(sighting.speciesGuess, knownSpecies)
    : undefined;

  return (
    <article
      className="rounded-xl border border-brand-teal/15 bg-white/80 dark:bg-brand-charcoal/60 p-4"
      aria-label={`Sighting: ${sighting.speciesGuess || 'Unknown species'}`}
    >
      {/* Species image (Req 7.1, 7.2) */}
      <div className="relative w-full h-36 rounded-lg overflow-hidden bg-brand-sand/40 dark:bg-brand-charcoal/40 mb-3">
        {speciesMatch?.image ? (
          <Image
            src={speciesMatch.image}
            alt={sighting.speciesGuess || 'Species image'}
            width={400}
            height={200}
            sizes="(max-width: 512px) 100vw, 512px"
            quality={70}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <svg
              aria-hidden="true"
              className="w-10 h-10 text-brand-charcoal/15 dark:text-brand-sand/15"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand truncate">
            {sighting.speciesGuess || 'Unknown species'}
          </h3>
          <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
            {formatDate(sighting.createdAt)}
          </p>
        </div>

        {/* Privacy indicator (14.4) */}
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            sighting.visibility === 'public'
              ? 'bg-brand-teal/10 text-brand-teal'
              : 'bg-brand-charcoal/10 dark:bg-brand-sand/10 text-brand-charcoal/60 dark:text-brand-sand/60'
          }`}
          aria-label={`Visibility: ${sighting.visibility}`}
        >
          {sighting.visibility === 'public' ? '🌐' : '🔒'}
          {sighting.visibility === 'public' ? 'Public' : 'Private'}
        </span>
      </div>

      {/* Notes */}
      {sighting.notes && (
        <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 mb-2">
          {sighting.notes}
        </p>
      )}

      {/* Location (fuzzed for public) */}
      {sighting.coordinates && (
        <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mb-2">
          📍 {sighting.coordinates.lat.toFixed(3)}, {sighting.coordinates.lng.toFixed(3)}
          {sighting.visibility === 'public' && (
            <span className="ml-1 text-brand-teal">(approximate)</span>
          )}
        </p>
      )}

      {/* Photo thumbnails (Req 7.3) */}
      {sighting.photos.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3" aria-label="Sighting photos">
          {sighting.photos.map((photoId) => (
            <div
              key={photoId}
              className="shrink-0 w-14 h-14 rounded-md overflow-hidden bg-brand-sand/30 dark:bg-brand-charcoal/40 border border-brand-teal/10 flex items-center justify-center"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-brand-charcoal/20 dark:text-brand-sand/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
            </div>
          ))}
          <span className="sr-only">
            {sighting.photos.length} photo{sighting.photos.length !== 1 ? 's' : ''} attached
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 border-t border-brand-teal/10 pt-3">
        {/* Comments placeholder (14.2) */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-brand-charcoal/60 dark:text-brand-sand/60 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[36px]"
          aria-expanded={showComments}
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          Comments
        </button>

        {/* Suggest ID placeholder (14.2) */}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-brand-teal hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[36px]"
          aria-label="Suggest an identification"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          Suggest ID
        </button>

        {/* Report / Flag (14.3) */}
        <button
          type="button"
          onClick={() => onFlag(sighting.id)}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-500/70 hover:bg-red-50 dark:hover:bg-red-900/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 transition-colors min-h-[36px]"
          aria-label="Report this sighting"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
          Report
        </button>
      </div>

      {/* Comments section placeholder (14.2) */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-brand-teal/10">
          <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 text-center py-4">
            Comments will be available when the community backend is connected.
          </p>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Sub-Tab Navigation Helpers
// ---------------------------------------------------------------------------

const VALID_SECTIONS: CommunitySubSection[] = ['sightings', 'challenges', 'blog'];

function parseHashSection(hash: string): CommunitySubSection {
  const cleaned = hash.replace('#', '').toLowerCase();
  if (VALID_SECTIONS.includes(cleaned as CommunitySubSection)) {
    return cleaned as CommunitySubSection;
  }
  return 'sightings';
}

// ---------------------------------------------------------------------------
// Blog Sub-Section
// ---------------------------------------------------------------------------

function BlogSubSection() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      try {
        const all = await getAllRecords('blogArticles');
        const sorted = (all as BlogArticle[]).sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        );
        setArticles(sorted);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    loadArticles();
  }, []);

  if (isLoading) {
    return (
      <section aria-label="Blog articles">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss mb-4">
          Blog
        </h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5" />
          ))}
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section aria-label="Blog articles">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss mb-4">
          Blog
        </h2>
        <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50 text-center py-8">
          No articles available yet.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Blog articles">
      <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss mb-4">
        Blog
      </h2>
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/blog/${article.id}`}
            className="block rounded-xl border border-brand-teal/15 bg-white/80 dark:bg-brand-charcoal/60 p-4 hover:bg-brand-teal/5 dark:hover:bg-brand-teal/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-1">
              {article.title}
            </h3>
            <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mb-2">
              {article.author} · {new Date(article.publishedAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 line-clamp-2">
              {article.summary}
            </p>
            {article.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] text-brand-teal"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-Tab Navigation Bar
// ---------------------------------------------------------------------------

interface SubTabNavProps {
  activeSection: CommunitySubSection;
  onSectionChange: (section: CommunitySubSection) => void;
}

function SubTabNav({ activeSection, onSectionChange }: SubTabNavProps) {
  const tabs: { key: CommunitySubSection; label: string }[] = [
    { key: 'sightings', label: 'Sightings' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'blog', label: 'Blog' },
  ];

  return (
    <nav aria-label="Community sub-sections" className="mb-4">
      <div className="flex gap-1 rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5 p-0.5">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSectionChange(tab.key)}
              aria-label={`View ${tab.label} section`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 rounded-md text-xs font-medium py-2 min-h-[36px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                isActive
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/10 hover:text-brand-teal'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main Community Page
// ---------------------------------------------------------------------------

function CommunityContent() {
  const { isAuthenticated } = useAuth();
  const [sightings, setSightings] = useState<CommunityDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [flagTarget, setFlagTarget] = useState<string | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Sub-tab navigation state
  const [activeSection, setActiveSection] = useState<CommunitySubSection>(() => {
    if (typeof window !== 'undefined') {
      return parseHashSection(window.location.hash);
    }
    return 'sightings';
  });

  // Listen for hash changes (browser back/forward, direct link)
  useEffect(() => {
    function handleHashChange() {
      setActiveSection(parseHashSection(window.location.hash));
    }
    window.addEventListener('hashchange', handleHashChange);
    // Also read hash on mount in case SSR initial state differs
    setActiveSection(parseHashSection(window.location.hash));
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSectionChange = useCallback((section: CommunitySubSection) => {
    setActiveSection(section);
    window.location.hash = section;
  }, []);

  // Known species/plants for image matching (Req 7.4)
  const [knownSpecies, setKnownSpecies] = useState<KnownSpeciesRecord[]>([]);

  // Pull-to-refresh state (Req 9.2, 9.3, 9.4, 9.5)
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const PULL_THRESHOLD = 80;

  // Load sightings from PocketBase (online) or IndexedDB (offline)
  const loadData = useCallback(async () => {
    try {
      const { getCommunityPosts } = await import('@/services/communityPostsService');
      const { posts } = await getCommunityPosts(1, 50);

      // Convert to CommunityDraft format for display
      const drafts: CommunityDraft[] = posts.map((p) => ({
        id: p.id,
        userId: p.userId,
        speciesGuess: p.speciesGuess || undefined,
        photos: p.photos,
        coordinates: p.coordinates ?? undefined,
        notes: p.notes,
        visibility: p.visibility,
        createdAt: p.created,
        updatedAt: p.updated,
      }));

      setSightings(drafts);

      // Also load species for image matching
      const [speciesRecords, plantRecords] = await Promise.all([
        getAllRecords('species'),
        getAllRecords('plants'),
      ]);

      const known: KnownSpeciesRecord[] = [
        ...speciesRecords.map((s) => ({
          id: s.id,
          commonName: s.commonName,
          images: s.images,
        })),
        ...plantRecords.map((p) => ({
          id: p.id,
          commonName: p.commonName,
          images: p.images,
        })),
      ];
      setKnownSpecies(known);
    } catch {
      // Fallback: load from local IndexedDB
      try {
        const [drafts, speciesRecords, plantRecords] = await Promise.all([
          getAllRecords('communityDrafts'),
          getAllRecords('species'),
          getAllRecords('plants'),
        ]);

        const sorted = (drafts as CommunityDraft[]).sort(
          (a, b) => b.createdAt.localeCompare(a.createdAt),
        );
        setSightings(sorted);

        const known: KnownSpeciesRecord[] = [
          ...speciesRecords.map((s) => ({
            id: s.id,
            commonName: s.commonName,
            images: s.images,
          })),
          ...plantRecords.map((p) => ({
            id: p.id,
            commonName: p.commonName,
            images: p.images,
          })),
        ];
        setKnownSpecies(known);
      } catch { /* store may not exist */ }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await loadData();
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [loadData]);

  // Pull-to-refresh touch handlers (Req 9.2, 9.3, 9.4, 9.5)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate when scrolled to top
    const container = scrollContainerRef.current;
    if (container && container.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff, PULL_THRESHOLD * 1.5));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (touchStartY.current === null) return;
    touchStartY.current = null;

    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(0);
      await loadData();
      setRefreshing(false);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, loadData]);

  const handleSave = useCallback((draft: CommunityDraft) => {
    setSightings((prev) => [draft, ...prev]);
    setShowNewForm(false);
  }, []);

  const handleFlag = useCallback((flag: CommunityFlag) => {
    setFlaggedIds((prev) => new Set(prev).add(flag.targetId));
    setFlagTarget(null);
  }, []);

  return (
    <main
      ref={scrollContainerRef}
      className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator (Req 9.2, 9.3) */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center transition-all duration-200"
          style={{ height: refreshing ? 48 : pullDistance * 0.5 }}
          role="status"
          aria-label={refreshing ? 'Refreshing sightings' : 'Pull to refresh'}
        >
          {refreshing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-teal border-t-transparent" />
          ) : pullDistance >= PULL_THRESHOLD ? (
            <p className="text-xs text-brand-teal font-medium">Release to refresh</p>
          ) : (
            <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40">Pull to refresh</p>
          )}
        </div>
      )}

      <header className="mb-6">
        <Link
          href="/"
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal mb-2 inline-block"
        >
          ← Home
        </Link>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Community
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Share and explore observations from the community. Community IDs are not expert confirmations.
        </p>
      </header>

      <OnlineHint message="Go online to see the latest community sightings, post observations, and sync your data." />

      {/* Sub-tab navigation */}
      <SubTabNav activeSection={activeSection} onSectionChange={handleSectionChange} />

      {/* Sightings sub-section */}
      {activeSection === 'sightings' && (
        <>
          {/* Safety notice */}
          <div
            role="note"
            className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-300"
          >
            Community sightings are user-submitted and not verified by experts.
            Always verify with a qualified expert before consuming any wild species.
          </div>

          {/* New Sighting button / form */}
          {!isAuthenticated ? (
            <div className="mb-6 rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-3 text-center">
              <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
                <Link href="/login" className="font-medium text-brand-teal hover:underline">Sign in</Link> to post sightings, leave reviews, and interact with the community.
              </p>
            </div>
          ) : showNewForm ? (
            <NewSightingForm
              onSave={handleSave}
              onCancel={() => setShowNewForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="w-full mb-6 rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] min-h-[48px]"
            >
              + New Sighting
            </button>
          )}

          {/* Sightings list */}
          {isAuthenticated && (
            <div className="mb-6">
              <IdRequest />
            </div>
          )}
          {loading ? (
            <div
              className="space-y-4"
              role="status"
              aria-label="Loading sightings"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} variant="sighting" />
              ))}
              <span className="sr-only">Loading sightings…</span>
            </div>
          ) : sightings.length === 0 ? (
            <>
              {/* Trending Species Section (Req 8.1) */}
              <TrendingSpeciesSection sightings={sightings} />

              <section aria-label="No sightings" className="text-center py-12">
                <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50">
                  No sightings yet. Be the first to share an observation!
                </p>
                <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
                  All sightings save locally and sync when online.
                </p>
              </section>
            </>
          ) : (
            <>
              {/* Trending Species Section (Req 8.1) */}
              <TrendingSpeciesSection sightings={sightings} />

              <div className="space-y-4" aria-label="Sightings list">
                {sightings.map((s) => (
                  <div key={s.id} className="relative">
                    <SightingCard
                      sighting={s}
                      knownSpecies={knownSpecies}
                      onFlag={(id) => setFlagTarget(id)}
                    />
                    {flaggedIds.has(s.id) && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                          🚩 Reported
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Challenges sub-section */}
      {activeSection === 'challenges' && (
        <ChallengesSection />
      )}

      {/* Blog sub-section */}
      {activeSection === 'blog' && (
        <BlogSubSection />
      )}

      {/* Flag dialog */}
      {flagTarget && (
        <FlagDialog
          sightingId={flagTarget}
          onClose={() => setFlagTarget(null)}
          onSubmit={handleFlag}
        />
      )}
    </main>
  );
}

export default function CommunityPage() {
  return <CommunityContent />;
}
