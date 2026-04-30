'use client';

/**
 * ForageFlow — Community Sightings Page
 *
 * Displays user-submitted sightings from IndexedDB communityDrafts store.
 * Supports creating new sightings, viewing existing ones, commenting (placeholder),
 * suggesting IDs (placeholder), flagging content, and privacy controls.
 *
 * - Private-by-default sightings (task 14.4)
 * - Location fuzzing for public posts (task 14.5)
 * - Flagging with reason options (task 14.3)
 * - Comment/suggest ID placeholders (task 14.2)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/auth/ProtectedRoute';
import { getAllRecords, putRecord } from '@/offline/db';
import { applyLocationPrivacy } from '@/services/locationPrivacy';
import type {
  CommunityDraft,
  CommunityFlag,
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

  // Photo handling (simplified — stores photo IDs as strings)
  const [photoFiles, setPhotoFiles] = useState<{ id: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).map((f) => ({
      id: generateId(),
      name: f.name,
    }));
    setPhotoFiles((prev) => [...prev, ...newPhotos]);
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
          {photoFiles.length > 0 && (
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-1">
              {photoFiles.length} photo{photoFiles.length !== 1 ? 's' : ''} selected
            </p>
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
  onFlag: (id: string) => void;
}

function SightingCard({ sighting, onFlag }: SightingCardProps) {
  const [showComments, setShowComments] = useState(false);

  return (
    <article
      className="rounded-xl border border-brand-teal/15 bg-white/80 dark:bg-brand-charcoal/60 p-4"
      aria-label={`Sighting: ${sighting.speciesGuess || 'Unknown species'}`}
    >
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

      {/* Photos count */}
      {sighting.photos.length > 0 && (
        <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mb-3">
          📷 {sighting.photos.length} photo{sighting.photos.length !== 1 ? 's' : ''}
        </p>
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
// Main Community Page
// ---------------------------------------------------------------------------

function CommunityContent() {
  const [sightings, setSightings] = useState<CommunityDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [flagTarget, setFlagTarget] = useState<string | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Load sightings from IndexedDB
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const drafts = await getAllRecords('communityDrafts');
        if (!cancelled) {
          // Sort newest first
          const sorted = (drafts as CommunityDraft[]).sort(
            (a, b) => b.createdAt.localeCompare(a.createdAt),
          );
          setSightings(sorted);
        }
      } catch {
        // Store may not exist yet
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = useCallback((draft: CommunityDraft) => {
    setSightings((prev) => [draft, ...prev]);
    setShowNewForm(false);
  }, []);

  const handleFlag = useCallback((flag: CommunityFlag) => {
    setFlaggedIds((prev) => new Set(prev).add(flag.targetId));
    setFlagTarget(null);
  }, []);

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
          Community Sightings
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Share and explore observations from the community. Community IDs are not expert confirmations.
        </p>
      </header>

      {/* Safety notice */}
      <div
        role="note"
        className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-700 dark:text-amber-300"
      >
        Community sightings are user-submitted and not verified by experts.
        Always verify with a qualified expert before consuming any wild species.
      </div>

      {/* New Sighting button / form */}
      {showNewForm ? (
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
      {loading ? (
        <div
          className="flex items-center justify-center py-12"
          role="status"
          aria-label="Loading sightings"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
          <span className="sr-only">Loading sightings…</span>
        </div>
      ) : sightings.length === 0 ? (
        <section aria-label="No sightings" className="text-center py-12">
          <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50">
            No sightings yet. Be the first to share an observation!
          </p>
          <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
            All sightings save locally and sync when online.
          </p>
        </section>
      ) : (
        <div className="space-y-4" aria-label="Sightings list">
          {sightings.map((s) => (
            <div key={s.id} className="relative">
              <SightingCard
                sighting={s}
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
  return (
    <ProtectedRoute>
      <CommunityContent />
    </ProtectedRoute>
  );
}
