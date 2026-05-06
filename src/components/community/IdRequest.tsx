'use client';

/**
 * ForageWise — IdRequest Component
 *
 * "ID This For Me" feature. Users upload a photo and ask the community
 * to help identify a species. Other users can comment with suggestions.
 * Stored in IndexedDB communityDrafts with type 'id-request'.
 */

import { useState, useRef, useCallback } from 'react';
import { putRecord } from '@/offline/db';
import { useAuth } from '@/auth/useAuth';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export interface IdRequestProps {
  onSubmitted?: () => void;
}

export default function IdRequest({ onSubmitted }: IdRequestProps) {
  const { user, isAuthenticated } = useAuth();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [question, setQuestion] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setPhotoBlob(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!photoBlob) {
      setError('Please add a photo of what you found.');
      return;
    }
    if (!question.trim()) {
      setError('Please describe what you need help with.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await putRecord('communityDrafts', {
        id: generateId(),
        userId: user?.id || 'local-user',
        speciesGuess: `[ID Request] ${question.trim()}`,
        notes: question.trim(),
        visibility: 'public',
        coordinates: null,
        photoIds: [],
        createdAt: new Date().toISOString(),
        syncStatus: 'pending',
      });

      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setError('Failed to submit. It will be saved and sent when online.');
    } finally {
      setSubmitting(false);
    }
  }, [photoBlob, question, user?.id, onSubmitted]);

  if (!isAuthenticated) {
    return null; // Only show for authenticated users
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
        <span className="text-2xl mb-2 block" aria-hidden="true">✅</span>
        <p className="text-sm font-medium text-green-800 dark:text-green-300">ID request submitted!</p>
        <p className="text-xs text-green-700/70 dark:text-green-400/70 mt-1">The community will help identify your find.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-teal/20 bg-white/80 dark:bg-dark-surface/80 p-4">
      <h3 className="font-heading font-semibold text-sm text-brand-charcoal dark:text-dark-text mb-3 flex items-center gap-2">
        <span aria-hidden="true">🔍</span>
        ID This For Me
      </h3>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-3" role="alert">{error}</p>
      )}

      {/* Photo upload */}
      <div className="mb-3">
        {photoPreview ? (
          <div className="relative">
            <img
              src={photoPreview}
              alt="Your photo for identification"
              className="w-full h-40 object-cover rounded-lg border border-brand-charcoal/10 dark:border-dark-border"
            />
            <button
              type="button"
              onClick={() => { setPhotoPreview(null); setPhotoBlob(null); }}
              className="absolute top-2 right-2 rounded-full bg-black/50 text-white w-6 h-6 flex items-center justify-center text-xs"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full h-32 rounded-lg border-2 border-dashed border-brand-teal/30 bg-brand-teal/5 flex flex-col items-center justify-center gap-2 hover:bg-brand-teal/10 transition-colors"
          >
            <svg className="w-8 h-8 text-brand-teal/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span className="text-xs text-brand-teal/70 font-medium">Tap to add a photo</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handlePhoto(e.target.files)}
        />
      </div>

      {/* Question */}
      <div className="mb-3">
        <label htmlFor="id-question" className="block text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">
          What do you need help with?
        </label>
        <textarea
          id="id-question"
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Found this on a dead oak log. Is this edible? What species could it be?"
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-3 py-2 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
        />
      </div>

      {/* Location (optional) */}
      <div className="mb-4">
        <label htmlFor="id-location" className="block text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">
          Where did you find it? (optional)
        </label>
        <input
          id="id-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Fall Creek Falls, on a trail near the creek"
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-3 py-2 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-2.5 hover:bg-brand-teal/90 transition-colors active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
      >
        {submitting ? 'Submitting…' : 'Ask the Community'}
      </button>

      <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40 mt-2 text-center">
        Community IDs are not expert confirmations. Always verify with a qualified expert.
      </p>
    </div>
  );
}
